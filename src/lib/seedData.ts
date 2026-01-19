import { supabase } from '@/integrations/supabase/client';

export const seedDepartments = [
  { id: 'd1000000-0000-0000-0000-000000000001', name: 'General Medicine', description: 'Primary care and general health consultations for common illnesses and preventive care', icon: 'Stethoscope' },
  { id: 'd1000000-0000-0000-0000-000000000002', name: 'Cardiology', description: 'Heart and cardiovascular system specialists for cardiac conditions and treatments', icon: 'Heart' },
  { id: 'd1000000-0000-0000-0000-000000000003', name: 'Orthopedics', description: 'Bone, joint, and muscle specialists for musculoskeletal conditions', icon: 'Bone' },
  { id: 'd1000000-0000-0000-0000-000000000004', name: 'Pediatrics', description: 'Child healthcare specialists for infants, children, and adolescents', icon: 'Baby' },
  { id: 'd1000000-0000-0000-0000-000000000005', name: 'Radiology', description: 'Medical imaging and diagnostic services including X-rays, CT, and MRI scans', icon: 'Scan' },
  { id: 'd1000000-0000-0000-0000-000000000006', name: 'Ophthalmology', description: 'Eye care specialists for vision problems and eye diseases', icon: 'Eye' },
  { id: 'd1000000-0000-0000-0000-000000000007', name: 'ENT', description: 'Ear, Nose, and Throat specialists for related conditions', icon: 'Ear' },
  { id: 'd1000000-0000-0000-0000-000000000008', name: 'Neurology', description: 'Brain and nervous system specialists for neurological disorders', icon: 'Brain' },
];

export const seedDoctors = [
  { id: 'dc000000-0000-0000-0000-000000000001', name: 'Dr. Sarah Johnson', department_id: 'd1000000-0000-0000-0000-000000000001', specialization: 'General Physician', qualification: 'MBBS, MD', experience_years: 12, consultation_fee: 500, available_from: '09:00:00', available_to: '17:00:00', max_patients_per_day: 40, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000002', name: 'Dr. Michael Chen', department_id: 'd1000000-0000-0000-0000-000000000001', specialization: 'Internal Medicine', qualification: 'MBBS, MD (Internal Medicine)', experience_years: 8, consultation_fee: 600, available_from: '10:00:00', available_to: '18:00:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000003', name: 'Dr. Emily Williams', department_id: 'd1000000-0000-0000-0000-000000000002', specialization: 'Interventional Cardiology', qualification: 'MBBS, DM Cardiology', experience_years: 15, consultation_fee: 1200, available_from: '09:00:00', available_to: '16:00:00', max_patients_per_day: 25, is_available: true, avg_consultation_duration: 20 },
  { id: 'dc000000-0000-0000-0000-000000000004', name: 'Dr. James Anderson', department_id: 'd1000000-0000-0000-0000-000000000002', specialization: 'Cardiac Electrophysiology', qualification: 'MBBS, MD, DM', experience_years: 10, consultation_fee: 1000, available_from: '11:00:00', available_to: '19:00:00', max_patients_per_day: 20, is_available: true, avg_consultation_duration: 20 },
  { id: 'dc000000-0000-0000-0000-000000000005', name: 'Dr. Robert Martinez', department_id: 'd1000000-0000-0000-0000-000000000003', specialization: 'Joint Replacement', qualification: 'MBBS, MS Ortho', experience_years: 18, consultation_fee: 900, available_from: '08:00:00', available_to: '15:00:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000006', name: 'Dr. Lisa Thompson', department_id: 'd1000000-0000-0000-0000-000000000003', specialization: 'Sports Medicine', qualification: 'MBBS, DNB Ortho', experience_years: 7, consultation_fee: 800, available_from: '10:00:00', available_to: '18:00:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000007', name: 'Dr. Jennifer Davis', department_id: 'd1000000-0000-0000-0000-000000000004', specialization: 'Pediatric Medicine', qualification: 'MBBS, MD Pediatrics', experience_years: 14, consultation_fee: 700, available_from: '09:00:00', available_to: '17:00:00', max_patients_per_day: 45, is_available: true, avg_consultation_duration: 12 },
  { id: 'dc000000-0000-0000-0000-000000000008', name: 'Dr. David Wilson', department_id: 'd1000000-0000-0000-0000-000000000004', specialization: 'Neonatology', qualification: 'MBBS, MD, DM Neonatology', experience_years: 9, consultation_fee: 850, available_from: '08:00:00', available_to: '16:00:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000009', name: 'Dr. Maria Garcia', department_id: 'd1000000-0000-0000-0000-000000000005', specialization: 'Diagnostic Radiology', qualification: 'MBBS, MD Radiology', experience_years: 11, consultation_fee: 400, available_from: '09:00:00', available_to: '18:00:00', max_patients_per_day: 50, is_available: true, avg_consultation_duration: 10 },
  { id: 'dc000000-0000-0000-0000-000000000010', name: 'Dr. Thomas Brown', department_id: 'd1000000-0000-0000-0000-000000000006', specialization: 'Cataract & Refractive Surgery', qualification: 'MBBS, MS Ophthalmology', experience_years: 16, consultation_fee: 800, available_from: '10:00:00', available_to: '17:00:00', max_patients_per_day: 35, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000011', name: 'Dr. Amanda Lee', department_id: 'd1000000-0000-0000-0000-000000000007', specialization: 'ENT Surgery', qualification: 'MBBS, MS ENT', experience_years: 13, consultation_fee: 750, available_from: '09:00:00', available_to: '16:00:00', max_patients_per_day: 30, is_available: true, avg_consultation_duration: 15 },
  { id: 'dc000000-0000-0000-0000-000000000012', name: 'Dr. Christopher Moore', department_id: 'd1000000-0000-0000-0000-000000000008', specialization: 'Epilepsy & Movement Disorders', qualification: 'MBBS, DM Neurology', experience_years: 20, consultation_fee: 1500, available_from: '10:00:00', available_to: '17:00:00', max_patients_per_day: 20, is_available: true, avg_consultation_duration: 25 },
];

export async function seedDatabase() {
  try {
    // Insert departments one by one to avoid type issues
    for (const dept of seedDepartments) {
      const { error } = await supabase
        .from('departments')
        .insert(dept as any);
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting department:', error);
      }
    }

    // Insert doctors one by one
    for (const doc of seedDoctors) {
      const { error } = await supabase
        .from('doctors')
        .insert(doc as any);
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting doctor:', error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: String(error) };
  }
}
