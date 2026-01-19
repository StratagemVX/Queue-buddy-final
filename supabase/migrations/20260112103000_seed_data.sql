-- Seed departments data
INSERT INTO public.departments (id, name, description, icon) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'General Medicine', 'Primary care and general health consultations for common illnesses and preventive care', 'Stethoscope'),
  ('d1000000-0000-0000-0000-000000000002', 'Cardiology', 'Heart and cardiovascular system specialists for cardiac conditions and treatments', 'Heart'),
  ('d1000000-0000-0000-0000-000000000003', 'Orthopedics', 'Bone, joint, and muscle specialists for musculoskeletal conditions', 'Bone'),
  ('d1000000-0000-0000-0000-000000000004', 'Pediatrics', 'Child healthcare specialists for infants, children, and adolescents', 'Baby'),
  ('d1000000-0000-0000-0000-000000000005', 'Radiology', 'Medical imaging and diagnostic services including X-rays, CT, and MRI scans', 'Scan'),
  ('d1000000-0000-0000-0000-000000000006', 'Ophthalmology', 'Eye care specialists for vision problems and eye diseases', 'Eye'),
  ('d1000000-0000-0000-0000-000000000007', 'ENT', 'Ear, Nose, and Throat specialists for related conditions', 'Ear'),
  ('d1000000-0000-0000-0000-000000000008', 'Neurology', 'Brain and nervous system specialists for neurological disorders', 'Brain')
ON CONFLICT (name) DO NOTHING;

-- Seed sample doctors data
INSERT INTO public.doctors (id, name, department_id, specialization, qualification, experience_years, consultation_fee, available_from, available_to, max_patients_per_day, is_available, avg_consultation_duration) VALUES
  ('dc000000-0000-0000-0000-000000000001', 'Dr. Sarah Johnson', 'd1000000-0000-0000-0000-000000000001', 'General Physician', 'MBBS, MD', 12, 500.00, '09:00:00', '17:00:00', 40, true, 15),
  ('dc000000-0000-0000-0000-000000000002', 'Dr. Michael Chen', 'd1000000-0000-0000-0000-000000000001', 'Internal Medicine', 'MBBS, MD (Internal Medicine)', 8, 600.00, '10:00:00', '18:00:00', 35, true, 15),
  ('dc000000-0000-0000-0000-000000000003', 'Dr. Emily Williams', 'd1000000-0000-0000-0000-000000000002', 'Interventional Cardiology', 'MBBS, DM Cardiology', 15, 1200.00, '09:00:00', '16:00:00', 25, true, 20),
  ('dc000000-0000-0000-0000-000000000004', 'Dr. James Anderson', 'd1000000-0000-0000-0000-000000000002', 'Cardiac Electrophysiology', 'MBBS, MD, DM', 10, 1000.00, '11:00:00', '19:00:00', 20, true, 20),
  ('dc000000-0000-0000-0000-000000000005', 'Dr. Robert Martinez', 'd1000000-0000-0000-0000-000000000003', 'Joint Replacement', 'MBBS, MS Ortho', 18, 900.00, '08:00:00', '15:00:00', 30, true, 15),
  ('dc000000-0000-0000-0000-000000000006', 'Dr. Lisa Thompson', 'd1000000-0000-0000-0000-000000000003', 'Sports Medicine', 'MBBS, DNB Ortho', 7, 800.00, '10:00:00', '18:00:00', 35, true, 15),
  ('dc000000-0000-0000-0000-000000000007', 'Dr. Jennifer Davis', 'd1000000-0000-0000-0000-000000000004', 'Pediatric Medicine', 'MBBS, MD Pediatrics', 14, 700.00, '09:00:00', '17:00:00', 45, true, 12),
  ('dc000000-0000-0000-0000-000000000008', 'Dr. David Wilson', 'd1000000-0000-0000-0000-000000000004', 'Neonatology', 'MBBS, MD, DM Neonatology', 9, 850.00, '08:00:00', '16:00:00', 30, true, 15),
  ('dc000000-0000-0000-0000-000000000009', 'Dr. Maria Garcia', 'd1000000-0000-0000-0000-000000000005', 'Diagnostic Radiology', 'MBBS, MD Radiology', 11, 400.00, '09:00:00', '18:00:00', 50, true, 10),
  ('dc000000-0000-0000-0000-000000000010', 'Dr. Thomas Brown', 'd1000000-0000-0000-0000-000000000006', 'Cataract & Refractive Surgery', 'MBBS, MS Ophthalmology', 16, 800.00, '10:00:00', '17:00:00', 35, true, 15),
  ('dc000000-0000-0000-0000-000000000011', 'Dr. Amanda Lee', 'd1000000-0000-0000-0000-000000000007', 'ENT Surgery', 'MBBS, MS ENT', 13, 750.00, '09:00:00', '16:00:00', 30, true, 15),
  ('dc000000-0000-0000-0000-000000000012', 'Dr. Christopher Moore', 'd1000000-0000-0000-0000-000000000008', 'Epilepsy & Movement Disorders', 'MBBS, DM Neurology', 20, 1500.00, '10:00:00', '17:00:00', 20, true, 25)
ON CONFLICT DO NOTHING;

-- Seed system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('notification_threshold', '3', 'Number of patients ahead when notification is triggered'),
  ('sms_enabled', 'true', 'Enable SMS notifications'),
  ('push_enabled', 'true', 'Enable push notifications'),
  ('clinic_name', 'MediQueue Hospital', 'Name of the clinic/hospital'),
  ('clinic_address', '123 Healthcare Avenue, Medical District', 'Clinic address'),
  ('clinic_phone', '+91 1234567890', 'Clinic contact number'),
  ('working_hours_start', '08:00', 'Clinic opening time'),
  ('working_hours_end', '20:00', 'Clinic closing time')
ON CONFLICT (key) DO NOTHING;
