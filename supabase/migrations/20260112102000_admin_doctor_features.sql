-- Add average consultation duration to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS avg_consultation_duration INTEGER DEFAULT 15;

-- Create system_settings table for admin configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) VALUES
  ('notification_threshold', '3', 'Number of patients ahead before sending notification'),
  ('default_consultation_duration', '15', 'Default consultation duration in minutes'),
  ('sms_enabled', 'true', 'Enable SMS notifications'),
  ('push_enabled', 'true', 'Enable push notifications'),
  ('clinic_name', 'MediQueue Hospital', 'Name of the clinic/hospital'),
  ('clinic_phone', '', 'Clinic contact phone'),
  ('clinic_email', '', 'Clinic contact email'),
  ('working_hours_start', '09:00', 'Clinic opening time'),
  ('working_hours_end', '18:00', 'Clinic closing time')
ON CONFLICT (key) DO NOTHING;

-- Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'push', 'email')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_appointment ON notification_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_patient ON notification_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Add phone number to profiles if not exists (for SMS)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add push subscription for web push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Create analytics view for admin dashboard
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  appointment_date,
  COUNT(*) as total_appointments,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status = 'no_show') as no_show,
  COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  AVG(
    CASE 
      WHEN actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (actual_end_time::timestamptz - actual_start_time::timestamptz)) / 60
    END
  )::INTEGER as avg_consultation_minutes
FROM appointments
GROUP BY appointment_date
ORDER BY appointment_date DESC;

-- Create doctor analytics view
CREATE OR REPLACE VIEW doctor_analytics AS
SELECT 
  d.id as doctor_id,
  d.name as doctor_name,
  dep.name as department_name,
  a.appointment_date,
  COUNT(*) as total_patients,
  COUNT(*) FILTER (WHERE a.status = 'completed') as completed,
  AVG(
    CASE 
      WHEN a.actual_start_time IS NOT NULL AND a.actual_end_time IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (a.actual_end_time::timestamptz - a.actual_start_time::timestamptz)) / 60
    END
  )::INTEGER as avg_consultation_minutes
FROM doctors d
LEFT JOIN departments dep ON d.department_id = dep.id
LEFT JOIN appointments a ON d.id = a.doctor_id
GROUP BY d.id, d.name, dep.name, a.appointment_date
ORDER BY a.appointment_date DESC, d.name;

-- Function to calculate estimated wait time
CREATE OR REPLACE FUNCTION calculate_wait_time(
  p_doctor_id UUID,
  p_queue_position INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_avg_duration INTEGER;
BEGIN
  -- Get average consultation duration for doctor
  SELECT COALESCE(avg_consultation_duration, 15)
  INTO v_avg_duration
  FROM doctors
  WHERE id = p_doctor_id;
  
  -- Return estimated wait time in minutes
  RETURN v_avg_duration * (p_queue_position - 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get patients needing notification (3 positions away)
CREATE OR REPLACE FUNCTION get_patients_for_notification(
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
  RETURN QUERY
  WITH current_queue AS (
    SELECT 
      a.id,
      a.patient_id,
      a.token_number,
      ROW_NUMBER() OVER (ORDER BY a.token_number) as position
    FROM appointments a
    WHERE a.doctor_id = p_doctor_id
      AND a.appointment_date = CURRENT_DATE
      AND a.status = 'waiting'
  )
  SELECT 
    cq.id as appointment_id,
    cq.patient_id,
    cq.token_number,
    cq.position::INTEGER as queue_position,
    p.phone as patient_phone,
    p.full_name as patient_name
  FROM current_queue cq
  JOIN profiles p ON cq.patient_id = p.user_id
  LEFT JOIN notification_logs nl ON cq.id = nl.appointment_id 
    AND nl.notification_type = 'sms' 
    AND nl.status IN ('sent', 'delivered')
    AND nl.created_at > NOW() - INTERVAL '1 hour'
  WHERE cq.position = p_threshold
    AND nl.id IS NULL; -- No notification sent in last hour
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies for system_settings (admin only can modify, all authenticated can read)
CREATE POLICY "Anyone can read settings" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies for notification_logs
CREATE POLICY "Users can view their own notifications" ON notification_logs
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notification_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all notifications" ON notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
