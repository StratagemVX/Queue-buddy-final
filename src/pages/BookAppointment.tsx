import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { checkDemoMode, getDepartmentById, getDoctorsByDepartment, getAppointmentsByDoctor, demoDoctors, type DemoDoctor } from '@/lib/demoData';
import { 
  User, Clock, Award, IndianRupee, Calendar,
  ArrowLeft, Loader2, CheckCircle2, Users, AlertCircle
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  available_from: string | null;
  available_to: string | null;
  max_patients_per_day: number | null;
  is_available: boolean | null;
  avg_consultation_duration?: number | null;
}

interface Department {
  id: string;
  name: string;
}

export default function BookAppointment() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Record<string, number>>({});
  const [useDemoMode, setUseDemoMode] = useState(checkDemoMode());
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      if (checkDemoMode()) {
        // Use demo data
        const demoDept = getDepartmentById(departmentId || '');
        if (demoDept) {
          setDepartment({ id: demoDept.id, name: demoDept.name });
        }
        
        const demoDocs = getDoctorsByDepartment(departmentId || '');
        setDoctors(demoDocs as Doctor[]);
        
        // Calculate today's appointments from demo data
        const counts: Record<string, number> = {};
        demoDocs.forEach(doc => {
          const appointments = getAppointmentsByDoctor(doc.id);
          counts[doc.id] = appointments.filter(apt => 
            apt.status === 'waiting' || apt.status === 'in_progress'
          ).length;
        });
        setTodayAppointments(counts);
        setUseDemoMode(true);
        setLoading(false);
        return;
      }

      // Fetch from database
      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .single();
      
      if (deptData) {
        setDepartment(deptData);
      }
      
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_available', true)
        .order('name');
      
      if (doctorsData) {
        setDoctors(doctorsData);
        
        const today = new Date().toISOString().split('T')[0];
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('doctor_id')
          .in('doctor_id', doctorsData.map(d => d.id))
          .eq('appointment_date', today)
          .in('status', ['waiting', 'in_progress']);
        
        if (appointmentsData) {
          const counts: Record<string, number> = {};
          appointmentsData.forEach(apt => {
            counts[apt.doctor_id] = (counts[apt.doctor_id] || 0) + 1;
          });
          setTodayAppointments(counts);
        }
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [departmentId, user, navigate]);

  const handleBookAppointment = async (doctor: Doctor) => {
    setBookingDoctor(doctor.id);
    
    if (useDemoMode) {
      // Demo mode - simulate booking
      setTimeout(() => {
        const existingAppointments = getAppointmentsByDoctor(doctor.id);
        const tokenNumber = existingAppointments.length + 1;
        
        toast({
          title: 'Demo: Appointment Booked!',
          description: `Your token number is ${tokenNumber}. In demo mode, no actual booking is made.`,
        });
        
        navigate('/dashboard');
        setBookingDoctor(null);
      }, 1000);
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already booked with this doctor today
      const { data: existingBooking } = await supabase
        .from('appointments')
        .select('id')
        .eq('patient_id', user.id)
        .eq('doctor_id', doctor.id)
        .eq('appointment_date', today)
        .in('status', ['waiting', 'in_progress'])
        .single();
      
      if (existingBooking) {
        toast({
          variant: 'destructive',
          title: 'Already booked',
          description: 'You already have an active appointment with this doctor today.',
        });
        setBookingDoctor(null);
        return;
      }
      
      // Get next token number
      const { data: tokenData } = await supabase
        .rpc('get_next_token_number', { p_doctor_id: doctor.id, p_date: today });
      
      const tokenNumber = tokenData || 1;
      
      // Create appointment
      const { error } = await supabase
        .from('appointments')
        .insert({
          token_number: tokenNumber,
          patient_id: user.id,
          doctor_id: doctor.id,
          appointment_date: today,
          status: 'waiting',
        });
      
      if (error) throw error;
      
      toast({
        title: 'Appointment Booked!',
        description: `Your token number is ${tokenNumber}. Track your queue status in the dashboard.`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Booking failed',
        description: 'Unable to book appointment. Please try again.',
      });
    } finally {
      setBookingDoctor(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="mx-auto max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6 gap-2"
            onClick={() => navigate('/departments')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Departments
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {department?.name || 'Select Doctor'}
            </h1>
            <p className="text-muted-foreground">
              Choose your preferred doctor and book an appointment
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No doctors available in this department.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {doctors.map((doctor) => {
                const currentQueue = todayAppointments[doctor.id] || 0;
                const maxPatients = doctor.max_patients_per_day || 30;
                const spotsLeft = maxPatients - currentQueue;
                const isFull = spotsLeft <= 0;
                
                return (
                  <Card key={doctor.id} className="border-border/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{doctor.name}</h3>
                            <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              {doctor.qualification && (
                                <span className="flex items-center gap-1">
                                  <Award className="h-4 w-4" />
                                  {doctor.qualification}
                                </span>
                              )}
                              {doctor.experience_years && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {doctor.experience_years} years
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                              <IndianRupee className="h-4 w-4" />
                              {doctor.consultation_fee || 0}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {doctor.available_from?.slice(0, 5)} - {doctor.available_to?.slice(0, 5)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`text-sm font-medium ${isFull ? 'text-destructive' : 'text-success'}`}>
                              {isFull ? 'Fully Booked' : `${spotsLeft} spots left`}
                            </div>
                            <Button
                              onClick={() => handleBookAppointment(doctor)}
                              disabled={isFull || bookingDoctor === doctor.id}
                              className="bg-gradient-primary hover:opacity-90 gap-2"
                            >
                              {bookingDoctor === doctor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}