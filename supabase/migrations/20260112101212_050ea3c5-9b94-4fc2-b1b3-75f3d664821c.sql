-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  specialization TEXT,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  available_from TIME DEFAULT '09:00:00',
  available_to TIME DEFAULT '17:00:00',
  max_patients_per_day INTEGER DEFAULT 30,
  avatar_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table with queue management
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_number INTEGER NOT NULL,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  estimated_time TIME,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint for token number per doctor per day
CREATE UNIQUE INDEX idx_unique_token_per_doctor_day ON public.appointments(doctor_id, appointment_date, token_number);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors and admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
);

-- Departments policies (public read, admin write)
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Doctors policies
CREATE POLICY "Anyone can view available doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profile" ON public.doctors FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Appointments policies
CREATE POLICY "Patients can view their own appointments" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Patients can cancel their own appointments" ON public.appointments FOR UPDATE USING (patient_id = auth.uid() AND status = 'waiting');
CREATE POLICY "Doctors can view their appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
);
CREATE POLICY "Doctors can update their appointments" ON public.appointments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid())
);

-- Enable realtime for appointments
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate next token number
CREATE OR REPLACE FUNCTION public.get_next_token_number(p_doctor_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  next_token INTEGER;
BEGIN
  SELECT COALESCE(MAX(token_number), 0) + 1 INTO next_token
  FROM public.appointments
  WHERE doctor_id = p_doctor_id AND appointment_date = p_date;
  RETURN next_token;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default departments
INSERT INTO public.departments (name, description, icon) VALUES
  ('General Medicine', 'General health checkups and common ailments', 'Stethoscope'),
  ('Cardiology', 'Heart and cardiovascular system specialists', 'Heart'),
  ('Orthopedics', 'Bone, joint, and muscle specialists', 'Bone'),
  ('Pediatrics', 'Child healthcare specialists', 'Baby'),
  ('Dermatology', 'Skin, hair, and nail specialists', 'Scan'),
  ('Ophthalmology', 'Eye care specialists', 'Eye'),
  ('ENT', 'Ear, nose, and throat specialists', 'Ear'),
  ('Neurology', 'Brain and nervous system specialists', 'Brain');

-- Insert sample doctors
INSERT INTO public.doctors (name, department_id, specialization, qualification, experience_years, consultation_fee, max_patients_per_day)
SELECT 
  'Dr. Sarah Johnson', id, 'General Physician', 'MBBS, MD', 15, 500, 30
FROM public.departments WHERE name = 'General Medicine';

INSERT INTO public.doctors (name, department_id, specialization, qualification, experience_years, consultation_fee, max_patients_per_day)
SELECT 
  'Dr. Michael Chen', id, 'Cardiologist', 'MBBS, DM Cardiology', 20, 1000, 20
FROM public.departments WHERE name = 'Cardiology';

INSERT INTO public.doctors (name, department_id, specialization, qualification, experience_years, consultation_fee, max_patients_per_day)
SELECT 
  'Dr. Emily Brown', id, 'Orthopedic Surgeon', 'MBBS, MS Ortho', 12, 800, 25
FROM public.departments WHERE name = 'Orthopedics';

INSERT INTO public.doctors (name, department_id, specialization, qualification, experience_years, consultation_fee, max_patients_per_day)
SELECT 
  'Dr. James Wilson', id, 'Pediatrician', 'MBBS, MD Pediatrics', 18, 600, 35
FROM public.departments WHERE name = 'Pediatrics';

-- Enable realtime for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;