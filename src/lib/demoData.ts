// Comprehensive Demo Data for MediQueue Hospital Queue Management System
// This provides a complete demo experience without requiring a database connection

export interface DemoDepartment {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface DemoDoctor {
  id: string;
  name: string;
  department_id: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  available_from: string;
  available_to: string;
  max_patients_per_day: number;
  is_available: boolean;
  avg_consultation_duration: number;
  avatar_url: string | null;
  user_id: string | null;
}

export interface DemoAppointment {
  id: string;
  token_number: number;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  appointment_date: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  estimated_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface DemoProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'patient' | 'doctor' | 'admin';
  created_at: string;
}

// Demo Departments - 8 Medical Departments
export const demoDepartments: DemoDepartment[] = [
  { 
    id: 'dept-001', 
    name: 'General Medicine', 
    description: 'Primary care and general health consultations for common illnesses, preventive care, and health checkups', 
    icon: 'Stethoscope',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-002', 
    name: 'Cardiology', 
    description: 'Heart and cardiovascular system specialists for cardiac conditions, heart disease, and blood pressure management', 
    icon: 'Heart',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-003', 
    name: 'Orthopedics', 
    description: 'Bone, joint, and muscle specialists for fractures, arthritis, sports injuries, and spine conditions', 
    icon: 'Bone',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-004', 
    name: 'Pediatrics', 
    description: 'Child healthcare specialists for infants, children, and adolescents including vaccinations and growth monitoring', 
    icon: 'Baby',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-005', 
    name: 'Radiology', 
    description: 'Medical imaging and diagnostic services including X-rays, CT scans, MRI, and ultrasound', 
    icon: 'Scan',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-006', 
    name: 'Ophthalmology', 
    description: 'Eye care specialists for vision problems, cataracts, glaucoma, and laser eye surgeries', 
    icon: 'Eye',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-007', 
    name: 'ENT', 
    description: 'Ear, Nose, and Throat specialists for hearing problems, sinusitis, tonsils, and voice disorders', 
    icon: 'Ear',
    created_at: '2026-01-01T00:00:00Z'
  },
  { 
    id: 'dept-008', 
    name: 'Neurology', 
    description: 'Brain and nervous system specialists for headaches, epilepsy, stroke, and neurological disorders', 
    icon: 'Brain',
    created_at: '2026-01-01T00:00:00Z'
  },
];

// Demo Doctors - 2-3 doctors per department
export const demoDoctors: DemoDoctor[] = [
  // General Medicine
  { id: 'doc-001', name: 'Dr. Sarah Johnson', department_id: 'dept-001', specialization: 'General Physician', qualification: 'MBBS, MD (Medicine)', experience_years: 12, consultation_fee: 500, available_from: '09:00', available_to: '17:00', max_patients_per_day: 40, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-002', name: 'Dr. Michael Chen', department_id: 'dept-001', specialization: 'Internal Medicine', qualification: 'MBBS, MD, FICP', experience_years: 8, consultation_fee: 600, available_from: '10:00', available_to: '18:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-003', name: 'Dr. Priya Sharma', department_id: 'dept-001', specialization: 'Family Medicine', qualification: 'MBBS, DNB (Family Med)', experience_years: 6, consultation_fee: 450, available_from: '08:00', available_to: '14:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 12, avatar_url: null, user_id: null },
  
  // Cardiology
  { id: 'doc-004', name: 'Dr. Emily Williams', department_id: 'dept-002', specialization: 'Interventional Cardiology', qualification: 'MBBS, DM Cardiology', experience_years: 15, consultation_fee: 1200, available_from: '09:00', available_to: '16:00', max_patients_per_day: 25, is_available: true, avg_consultation_duration: 20, avatar_url: null, user_id: null },
  { id: 'doc-005', name: 'Dr. James Anderson', department_id: 'dept-002', specialization: 'Cardiac Electrophysiology', qualification: 'MBBS, MD, DM', experience_years: 10, consultation_fee: 1000, available_from: '11:00', available_to: '19:00', max_patients_per_day: 20, is_available: true, avg_consultation_duration: 20, avatar_url: null, user_id: null },
  
  // Orthopedics
  { id: 'doc-006', name: 'Dr. Robert Martinez', department_id: 'dept-003', specialization: 'Joint Replacement', qualification: 'MBBS, MS Ortho, MCh', experience_years: 18, consultation_fee: 900, available_from: '08:00', available_to: '15:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-007', name: 'Dr. Lisa Thompson', department_id: 'dept-003', specialization: 'Sports Medicine', qualification: 'MBBS, DNB Ortho', experience_years: 7, consultation_fee: 800, available_from: '10:00', available_to: '18:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-008', name: 'Dr. Arun Kumar', department_id: 'dept-003', specialization: 'Spine Surgery', qualification: 'MBBS, MS, Fellowship Spine', experience_years: 14, consultation_fee: 1100, available_from: '09:00', available_to: '17:00', max_patients_per_day: 20, is_available: true, avg_consultation_duration: 20, avatar_url: null, user_id: null },
  
  // Pediatrics
  { id: 'doc-009', name: 'Dr. Jennifer Davis', department_id: 'dept-004', specialization: 'Pediatric Medicine', qualification: 'MBBS, MD Pediatrics', experience_years: 14, consultation_fee: 700, available_from: '09:00', available_to: '17:00', max_patients_per_day: 45, is_available: true, avg_consultation_duration: 12, avatar_url: null, user_id: null },
  { id: 'doc-010', name: 'Dr. David Wilson', department_id: 'dept-004', specialization: 'Neonatology', qualification: 'MBBS, MD, DM Neonatology', experience_years: 9, consultation_fee: 850, available_from: '08:00', available_to: '16:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  
  // Radiology
  { id: 'doc-011', name: 'Dr. Maria Garcia', department_id: 'dept-005', specialization: 'Diagnostic Radiology', qualification: 'MBBS, MD Radiology', experience_years: 11, consultation_fee: 400, available_from: '09:00', available_to: '18:00', max_patients_per_day: 50, is_available: true, avg_consultation_duration: 10, avatar_url: null, user_id: null },
  { id: 'doc-012', name: 'Dr. Kevin Brown', department_id: 'dept-005', specialization: 'Interventional Radiology', qualification: 'MBBS, DNB, FRCR', experience_years: 13, consultation_fee: 600, available_from: '10:00', available_to: '17:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  
  // Ophthalmology
  { id: 'doc-013', name: 'Dr. Thomas Brown', department_id: 'dept-006', specialization: 'Cataract & Refractive Surgery', qualification: 'MBBS, MS Ophthalmology', experience_years: 16, consultation_fee: 800, available_from: '10:00', available_to: '17:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-014', name: 'Dr. Neha Patel', department_id: 'dept-006', specialization: 'Retina Specialist', qualification: 'MBBS, DO, DNB', experience_years: 10, consultation_fee: 900, available_from: '09:00', available_to: '16:00', max_patients_per_day: 25, is_available: true, avg_consultation_duration: 20, avatar_url: null, user_id: null },
  
  // ENT
  { id: 'doc-015', name: 'Dr. Amanda Lee', department_id: 'dept-007', specialization: 'ENT Surgery', qualification: 'MBBS, MS ENT', experience_years: 13, consultation_fee: 750, available_from: '09:00', available_to: '16:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15, avatar_url: null, user_id: null },
  { id: 'doc-016', name: 'Dr. Rahul Verma', department_id: 'dept-007', specialization: 'Audiology & Hearing', qualification: 'MBBS, DLO, MS', experience_years: 8, consultation_fee: 650, available_from: '10:00', available_to: '18:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 12, avatar_url: null, user_id: null },
  
  // Neurology
  { id: 'doc-017', name: 'Dr. Christopher Moore', department_id: 'dept-008', specialization: 'Epilepsy & Movement Disorders', qualification: 'MBBS, DM Neurology', experience_years: 20, consultation_fee: 1500, available_from: '10:00', available_to: '17:00', max_patients_per_day: 20, is_available: true, avg_consultation_duration: 25, avatar_url: null, user_id: null },
  { id: 'doc-018', name: 'Dr. Anjali Reddy', department_id: 'dept-008', specialization: 'Stroke & Neurovascular', qualification: 'MBBS, MD, DM', experience_years: 12, consultation_fee: 1200, available_from: '09:00', available_to: '16:00', max_patients_per_day: 18, is_available: true, avg_consultation_duration: 25, avatar_url: null, user_id: null },
];

// Get today's date for appointments
const today = new Date().toISOString().split('T')[0];

// Demo Appointments - Active queue for today
export const demoAppointments: DemoAppointment[] = [
  // General Medicine - Dr. Sarah Johnson
  { id: 'apt-001', token_number: 1, patient_id: 'pat-001', patient_name: 'Rajesh Kumar', doctor_id: 'doc-001', appointment_date: today, status: 'completed', estimated_time: '09:00', actual_start_time: '09:02:00', actual_end_time: '09:14:00', notes: 'Regular checkup completed', created_at: '2026-01-12T08:30:00Z' },
  { id: 'apt-002', token_number: 2, patient_id: 'pat-002', patient_name: 'Sunita Devi', doctor_id: 'doc-001', appointment_date: today, status: 'completed', estimated_time: '09:15', actual_start_time: '09:16:00', actual_end_time: '09:28:00', notes: 'Fever and cold treatment', created_at: '2026-01-12T08:35:00Z' },
  { id: 'apt-003', token_number: 3, patient_id: 'pat-003', patient_name: 'Amit Sharma', doctor_id: 'doc-001', appointment_date: today, status: 'in_progress', estimated_time: '09:30', actual_start_time: '09:30:00', actual_end_time: null, notes: null, created_at: '2026-01-12T08:40:00Z' },
  { id: 'apt-004', token_number: 4, patient_id: 'pat-004', patient_name: 'Priya Singh', doctor_id: 'doc-001', appointment_date: today, status: 'waiting', estimated_time: '09:45', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:45:00Z' },
  { id: 'apt-005', token_number: 5, patient_id: 'pat-005', patient_name: 'Vikram Patel', doctor_id: 'doc-001', appointment_date: today, status: 'waiting', estimated_time: '10:00', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:50:00Z' },
  { id: 'apt-006', token_number: 6, patient_id: 'pat-006', patient_name: 'Meera Gupta', doctor_id: 'doc-001', appointment_date: today, status: 'waiting', estimated_time: '10:15', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T09:00:00Z' },
  
  // Cardiology - Dr. Emily Williams  
  { id: 'apt-007', token_number: 1, patient_id: 'pat-007', patient_name: 'Suresh Reddy', doctor_id: 'doc-004', appointment_date: today, status: 'completed', estimated_time: '09:00', actual_start_time: '09:05:00', actual_end_time: '09:22:00', notes: 'ECG done, normal readings', created_at: '2026-01-12T08:30:00Z' },
  { id: 'apt-008', token_number: 2, patient_id: 'pat-008', patient_name: 'Lakshmi Narayanan', doctor_id: 'doc-004', appointment_date: today, status: 'in_progress', estimated_time: '09:25', actual_start_time: '09:25:00', actual_end_time: null, notes: null, created_at: '2026-01-12T08:40:00Z' },
  { id: 'apt-009', token_number: 3, patient_id: 'pat-009', patient_name: 'Ramesh Iyer', doctor_id: 'doc-004', appointment_date: today, status: 'waiting', estimated_time: '09:50', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:50:00Z' },
  { id: 'apt-010', token_number: 4, patient_id: 'pat-010', patient_name: 'Kavitha Menon', doctor_id: 'doc-004', appointment_date: today, status: 'waiting', estimated_time: '10:15', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T09:00:00Z' },
  
  // Orthopedics - Dr. Robert Martinez
  { id: 'apt-011', token_number: 1, patient_id: 'pat-011', patient_name: 'Anand Krishnan', doctor_id: 'doc-006', appointment_date: today, status: 'in_progress', estimated_time: '08:00', actual_start_time: '08:05:00', actual_end_time: null, notes: 'Knee pain consultation', created_at: '2026-01-12T07:30:00Z' },
  { id: 'apt-012', token_number: 2, patient_id: 'pat-012', patient_name: 'Deepa Nair', doctor_id: 'doc-006', appointment_date: today, status: 'waiting', estimated_time: '08:20', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T07:45:00Z' },
  { id: 'apt-013', token_number: 3, patient_id: 'pat-013', patient_name: 'Mohan Das', doctor_id: 'doc-006', appointment_date: today, status: 'waiting', estimated_time: '08:40', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:00:00Z' },
  
  // Pediatrics - Dr. Jennifer Davis
  { id: 'apt-014', token_number: 1, patient_id: 'pat-014', patient_name: 'Baby Arjun (3 yrs)', doctor_id: 'doc-009', appointment_date: today, status: 'completed', estimated_time: '09:00', actual_start_time: '09:00:00', actual_end_time: '09:10:00', notes: 'Vaccination done', created_at: '2026-01-12T08:30:00Z' },
  { id: 'apt-015', token_number: 2, patient_id: 'pat-015', patient_name: 'Baby Siya (1 yr)', doctor_id: 'doc-009', appointment_date: today, status: 'in_progress', estimated_time: '09:15', actual_start_time: '09:12:00', actual_end_time: null, notes: null, created_at: '2026-01-12T08:35:00Z' },
  { id: 'apt-016', token_number: 3, patient_id: 'pat-016', patient_name: 'Child Rohan (7 yrs)', doctor_id: 'doc-009', appointment_date: today, status: 'waiting', estimated_time: '09:30', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:40:00Z' },
  { id: 'apt-017', token_number: 4, patient_id: 'pat-017', patient_name: 'Baby Aanya (6 months)', doctor_id: 'doc-009', appointment_date: today, status: 'waiting', estimated_time: '09:45', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T08:50:00Z' },
  
  // Ophthalmology - Dr. Thomas Brown
  { id: 'apt-018', token_number: 1, patient_id: 'pat-018', patient_name: 'Gopal Rao', doctor_id: 'doc-013', appointment_date: today, status: 'in_progress', estimated_time: '10:00', actual_start_time: '10:02:00', actual_end_time: null, notes: 'Eye checkup', created_at: '2026-01-12T09:30:00Z' },
  { id: 'apt-019', token_number: 2, patient_id: 'pat-019', patient_name: 'Padma Lakshmi', doctor_id: 'doc-013', appointment_date: today, status: 'waiting', estimated_time: '10:20', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T09:40:00Z' },
  
  // Neurology - Dr. Christopher Moore
  { id: 'apt-020', token_number: 1, patient_id: 'pat-020', patient_name: 'Shyam Sundar', doctor_id: 'doc-017', appointment_date: today, status: 'in_progress', estimated_time: '10:00', actual_start_time: '10:05:00', actual_end_time: null, notes: 'Migraine consultation', created_at: '2026-01-12T09:30:00Z' },
  { id: 'apt-021', token_number: 2, patient_id: 'pat-021', patient_name: 'Vasantha Kumari', doctor_id: 'doc-017', appointment_date: today, status: 'waiting', estimated_time: '10:30', actual_start_time: null, actual_end_time: null, notes: null, created_at: '2026-01-12T09:45:00Z' },
];

// Demo Profiles - Sample users
export const demoProfiles: DemoProfile[] = [
  { id: 'prof-001', user_id: 'user-001', full_name: 'Admin User', email: 'admin@mediqueue.com', phone: '+91 9876543210', role: 'admin', created_at: '2026-01-01T00:00:00Z' },
  { id: 'prof-002', user_id: 'user-002', full_name: 'Dr. Sarah Johnson', email: 'sarah.johnson@mediqueue.com', phone: '+91 9876543211', role: 'doctor', created_at: '2026-01-01T00:00:00Z' },
  { id: 'prof-003', user_id: 'user-003', full_name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 9876543212', role: 'patient', created_at: '2026-01-10T00:00:00Z' },
  { id: 'prof-004', user_id: 'user-004', full_name: 'Sunita Devi', email: 'sunita.devi@email.com', phone: '+91 9876543213', role: 'patient', created_at: '2026-01-10T00:00:00Z' },
];

// Demo Analytics Data
export const demoAnalytics = {
  totalAppointmentsToday: 21,
  completedToday: 4,
  inProgressToday: 6,
  waitingToday: 11,
  cancelledToday: 0,
  
  totalPatients: 156,
  totalDoctors: 18,
  totalDepartments: 8,
  
  averageWaitTime: 18, // minutes
  averageConsultationTime: 15, // minutes
  
  // For AnalyticsDashboard component
  todayStats: {
    total: 21,
    completed: 4,
    waiting: 11,
    in_progress: 6,
    cancelled: 0,
    no_show: 0
  },
  
  weeklyData: [
    { appointment_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 45, completed: 42, cancelled: 2, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 14 },
    { appointment_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 52, completed: 48, cancelled: 3, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 15 },
    { appointment_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 38, completed: 35, cancelled: 2, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 16 },
    { appointment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 61, completed: 58, cancelled: 2, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 14 },
    { appointment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 55, completed: 51, cancelled: 3, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 15 },
    { appointment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total_appointments: 28, completed: 26, cancelled: 1, no_show: 1, waiting: 0, in_progress: 0, avg_consultation_minutes: 13 },
    { appointment_date: new Date().toISOString().split('T')[0], total_appointments: 21, completed: 4, cancelled: 0, no_show: 0, waiting: 11, in_progress: 6, avg_consultation_minutes: 15 },
  ],
  
  weeklyStats: [
    { day: 'Mon', appointments: 45, completed: 42 },
    { day: 'Tue', appointments: 52, completed: 48 },
    { day: 'Wed', appointments: 38, completed: 35 },
    { day: 'Thu', appointments: 61, completed: 58 },
    { day: 'Fri', appointments: 55, completed: 51 },
    { day: 'Sat', appointments: 28, completed: 26 },
    { day: 'Sun', appointments: 12, completed: 11 },
  ],
  
  departmentStats: [
    { name: 'General Medicine', appointments: 85, percentage: 28 },
    { name: 'Pediatrics', appointments: 62, percentage: 20 },
    { name: 'Orthopedics', appointments: 45, percentage: 15 },
    { name: 'Cardiology', appointments: 38, percentage: 12 },
    { name: 'ENT', appointments: 32, percentage: 10 },
    { name: 'Ophthalmology', appointments: 25, percentage: 8 },
    { name: 'Neurology', appointments: 12, percentage: 4 },
    { name: 'Radiology', appointments: 10, percentage: 3 },
  ],
};

// Demo System Settings (as array for SystemSettings component)
export const demoSettings = [
  { id: 'setting-001', key: 'clinic_name', value: 'MediQueue City Hospital', description: 'Hospital/Clinic Name' },
  { id: 'setting-002', key: 'clinic_address', value: '123 Healthcare Avenue, Medical District, City - 560001', description: 'Address' },
  { id: 'setting-003', key: 'clinic_phone', value: '+91 80 1234 5678', description: 'Contact Phone' },
  { id: 'setting-004', key: 'clinic_email', value: 'info@mediqueue.com', description: 'Contact Email' },
  { id: 'setting-005', key: 'working_hours_start', value: '08:00', description: 'Opening Time' },
  { id: 'setting-006', key: 'working_hours_end', value: '20:00', description: 'Closing Time' },
  { id: 'setting-007', key: 'notification_threshold', value: '3', description: 'Notify when X patients ahead' },
  { id: 'setting-008', key: 'sms_enabled', value: 'true', description: 'SMS Notifications' },
  { id: 'setting-009', key: 'push_enabled', value: 'true', description: 'Push Notifications' },
  { id: 'setting-010', key: 'appointment_reminder_hours', value: '2', description: 'Reminder before appointment (hours)' },
  { id: 'setting-011', key: 'max_booking_days_advance', value: '30', description: 'Max days in advance for booking' },
];

// Helper function to get doctor by ID
export function getDoctorById(id: string): DemoDoctor | undefined {
  return demoDoctors.find(doc => doc.id === id);
}

// Helper function to get department by ID
export function getDepartmentById(id: string): DemoDepartment | undefined {
  return demoDepartments.find(dept => dept.id === id);
}

// Helper function to get doctors by department
export function getDoctorsByDepartment(departmentId: string): DemoDoctor[] {
  return demoDoctors.filter(doc => doc.department_id === departmentId);
}

// Helper function to get appointments by doctor
export function getAppointmentsByDoctor(doctorId: string): DemoAppointment[] {
  return demoAppointments.filter(apt => apt.doctor_id === doctorId);
}

// Helper function to get today's queue
export function getTodaysQueue(): DemoAppointment[] {
  const today = new Date().toISOString().split('T')[0];
  return demoAppointments.filter(apt => apt.appointment_date === today);
}

// Helper to calculate wait time
export function calculateDemoWaitTime(appointment: DemoAppointment): number {
  const doctor = getDoctorById(appointment.doctor_id);
  if (!doctor) return 0;
  
  const doctorAppointments = getAppointmentsByDoctor(appointment.doctor_id);
  const waiting = doctorAppointments.filter(apt => 
    apt.status === 'waiting' && apt.token_number < appointment.token_number
  ).length;
  const inProgress = doctorAppointments.some(apt => apt.status === 'in_progress') ? 1 : 0;
  
  return (waiting + (inProgress * 0.5)) * doctor.avg_consultation_duration;
}

// Demo Mode State Management
let isDemoMode = false;

export function enableDemoMode() {
  isDemoMode = true;
  localStorage.setItem('mediqueue_demo_mode', 'true');
}

export function disableDemoMode() {
  isDemoMode = false;
  localStorage.removeItem('mediqueue_demo_mode');
}

export function checkDemoMode(): boolean {
  if (isDemoMode) return true;
  return localStorage.getItem('mediqueue_demo_mode') === 'true';
}
