-- Harden signup role assignment, profile RLS, notification log integrity, and reporting views.

-- 1. Never trust client-supplied role metadata during self-registration.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.email,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''),
    'patient'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Non-recursive role lookup helper for RLS policies.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Prevent non-privileged users from escalating their own role via UPDATE.
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.role() NOT IN ('service_role', 'postgres', 'supabase_admin')
       AND public.get_current_user_role() IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Only administrators may modify user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_role_on_update ON public.profiles;
CREATE TRIGGER protect_profile_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_self_change();

-- 4. Replace permissive/recursive profiles RLS policies.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors and admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = public.get_current_user_role()
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'patient'
  );

CREATE POLICY "Doctors and admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.get_current_user_role() IN ('doctor', 'admin'));

-- 5. Tighten admin-managed tables using non-recursive role lookup + WITH CHECK.
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments"
  ON public.departments
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;
CREATE POLICY "Admins can manage doctors"
  ON public.doctors
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can modify settings" ON public.system_settings;
CREATE POLICY "Admins can modify settings"
  ON public.system_settings
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- 6. Prevent arbitrary clients from forging notification_logs entries (service_role bypasses RLS).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notification_logs;

CREATE POLICY "Admins can view all notifications"
  ON public.notification_logs
  FOR SELECT
  USING (public.get_current_user_role() = 'admin');

-- 7. Pin search_path on RPC helpers and enforce authorization on patient contact lookup.
CREATE OR REPLACE FUNCTION public.calculate_wait_time(
  p_doctor_id UUID,
  p_queue_position INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_avg_duration INTEGER;
BEGIN
  SELECT COALESCE(avg_consultation_duration, 15)
  INTO v_avg_duration
  FROM public.doctors
  WHERE id = p_doctor_id;

  RETURN GREATEST(0, v_avg_duration * (COALESCE(p_queue_position, 1) - 1));
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_patients_for_notification(
  p_doctor_id UUID,
  p_threshold INTEGER DEFAULT 3
) RETURNS TABLE (
  appointment_id UUID,
  patient_id UUID,
  token_number INTEGER,
  queue_position INTEGER,
  patient_phone TEXT,
  patient_name TEXT
) AS $$
BEGIN
  IF auth.role() NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    IF public.get_current_user_role() = 'admin' THEN
      NULL;
    ELSIF public.get_current_user_role() = 'doctor' AND EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = p_doctor_id AND d.user_id = auth.uid()
    ) THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Unauthorized queue notification query';
    END IF;
  END IF;

  RETURN QUERY
  WITH current_queue AS (
    SELECT
      a.id,
      a.patient_id,
      a.token_number,
      ROW_NUMBER() OVER (ORDER BY a.token_number) AS position
    FROM public.appointments a
    WHERE a.doctor_id = p_doctor_id
      AND a.appointment_date = CURRENT_DATE
      AND a.status = 'waiting'
  )
  SELECT
    cq.id AS appointment_id,
    cq.patient_id,
    cq.token_number,
    cq.position::INTEGER AS queue_position,
    p.phone AS patient_phone,
    p.full_name AS patient_name
  FROM current_queue cq
  JOIN public.profiles p ON cq.patient_id = p.user_id
  LEFT JOIN public.notification_logs nl ON cq.id = nl.appointment_id
    AND nl.notification_type = 'sms'
    AND nl.status IN ('sent', 'delivered')
    AND nl.created_at > NOW() - INTERVAL '1 hour'
  WHERE cq.position = LEAST(GREATEST(COALESCE(p_threshold, 3), 1), 100)
    AND nl.id IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 8. Ensure analytics views respect invoking user's RLS permissions (PostgreSQL 15+).
ALTER VIEW IF EXISTS public.daily_analytics SET (security_invoker = true);
ALTER VIEW IF EXISTS public.doctor_analytics SET (security_invoker = true);
