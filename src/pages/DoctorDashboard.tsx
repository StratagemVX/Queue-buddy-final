import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { triggerNotificationCheck } from '@/lib/notifications';
import { 
  Loader2, ShieldAlert, Play, CheckCircle, XCircle, Clock, 
  Users, UserCheck, AlertCircle, Calendar, Timer, Database
} from 'lucide-react';
import { DoctorSchedule } from '@/components/doctor/DoctorSchedule';
import { DoctorStats } from '@/components/doctor/DoctorStats';
import { checkDemoMode, demoDoctors, demoAppointments, demoProfiles } from '@/lib/demoData';

interface QueuePatient {
  id: string;
  token_number: number;
  status: string;
  appointment_date: string;
  created_at: string;
  notes: string | null;
  patient_id: string;
  estimated_wait_time?: number;
  patient?: {
    full_name: string;
    phone: string | null;
  };
}

interface DoctorInfo {
  id: string;
  name: string;
  specialization: string | null;
  avg_consultation_duration: number | null;
  is_available: boolean | null;
}

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueuePatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [useDemoMode, setUseDemoMode] = useState(false);

  useEffect(() => {
    // Allow demo mode access strictly in development builds
    if (import.meta.env.DEV && !import.meta.env.PROD && checkDemoMode()) {
      setUseDemoMode(true);
      loadDemoDoctor();
      return;
    }

    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    checkDoctorAccess();
  }, [user, authLoading, navigate]);

  function loadDemoDoctor() {
    // Use first demo doctor
    const demoDoctor = demoDoctors[0];
    setDoctor({
      id: demoDoctor.id,
      name: demoDoctor.name,
      specialization: demoDoctor.specialization,
      avg_consultation_duration: demoDoctor.avg_consultation_duration,
      is_available: demoDoctor.is_available
    });
    loadDemoQueue(demoDoctor.id, demoDoctor.avg_consultation_duration || 15);
  }

  function loadDemoQueue(doctorId: string, avgDuration: number) {
    const today = new Date().toISOString().split('T')[0];
    const doctorAppointments = demoAppointments.filter(
      apt => apt.doctor_id === doctorId && apt.appointment_date === today && ['waiting', 'in_progress'].includes(apt.status)
    );

    const enriched: QueuePatient[] = doctorAppointments.map((apt, index) => {
      const profile = demoProfiles.find(p => p.user_id === apt.patient_id);
      return {
        id: apt.id,
        token_number: apt.token_number,
        status: apt.status,
        appointment_date: apt.appointment_date,
        created_at: apt.created_at,
        notes: apt.notes,
        patient_id: apt.patient_id,
        estimated_wait_time: index * avgDuration,
        patient: profile ? { full_name: profile.full_name || 'Unknown', phone: profile.phone } : { full_name: 'Demo Patient', phone: null }
      };
    });

    const inProgress = enriched.find(a => a.status === 'in_progress');
    setCurrentPatient(inProgress || null);
    setQueue(enriched.filter(a => a.status === 'waiting'));
    setLoading(false);
  }

  async function checkDoctorAccess() {
    if (!user) return;

    // Check if user is a doctor
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('id, name, specialization, avg_consultation_duration, is_available')
      .eq('user_id', user.id)
      .single() as { data: DoctorInfo | null };

    if (doctorData) {
      setDoctor(doctorData);
      await fetchQueue(doctorData.id, doctorData.avg_consultation_duration || 15);
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('doctor-queue')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'appointments',
          filter: `doctor_id=eq.${doctorData.id}`
        }, () => {
          fetchQueue(doctorData.id, doctorData.avg_consultation_duration || 15);
        })
        .subscribe();

      setLoading(false);
      return () => { supabase.removeChannel(channel); };
    }

    // Check if user has doctor role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single() as { data: { role: string } | null };

    if (!profile || profile.role !== 'doctor') {
      setDoctor(null);
    }
    setLoading(false);
  }

  async function fetchQueue(doctorId: string, avgDuration: number) {
    const today = new Date().toISOString().split('T')[0];
    
    interface AppointmentRow {
      id: string;
      token_number: number;
      status: string;
      appointment_date: string;
      created_at: string;
      notes: string | null;
      patient_id: string;
    }
    
    const { data } = await supabase
      .from('appointments')
      .select(`
        id, token_number, status, appointment_date, created_at, notes, patient_id
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress'])
      .order('token_number') as { data: AppointmentRow[] | null };

    if (data) {
      // Fetch patient details separately
      const patientIds = [...new Set(data.map(a => a.patient_id))];
      
      interface ProfileRow {
        user_id: string;
        full_name: string | null;
        phone: string | null;
      }
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', patientIds) as { data: ProfileRow[] | null };

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const enriched = data.map((apt, index) => ({
        ...apt,
        patient: profileMap.get(apt.patient_id) || { full_name: 'Unknown', phone: null },
        estimated_wait_time: index * avgDuration,
      }));

      const inProgress = enriched.find(a => a.status === 'in_progress');
      setCurrentPatient(inProgress || null);
      setQueue(enriched.filter(a => a.status === 'waiting'));
    }
  }

  async function callNextPatient() {
    if (!doctor || queue.length === 0) return;
    
    const nextPatient = queue[0];
    setActionLoading(nextPatient.id);

    // Demo mode simulation
    if (useDemoMode) {
      setTimeout(() => {
        setCurrentPatient(nextPatient);
        setQueue(prev => prev.filter(p => p.id !== nextPatient.id));
        toast({ title: `Calling Token #${nextPatient.token_number}`, description: nextPatient.patient?.full_name });
        setActionLoading(null);
      }, 500);
      return;
    }

    // If there's a current patient, mark them as completed first
    if (currentPatient) {
      await supabase
        .from('appointments')
        .update({ 
          status: 'completed', 
          actual_end_time: new Date().toISOString() 
        })
        .eq('id', currentPatient.id);
    }

    // Call the next patient
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'in_progress', 
        actual_start_time: new Date().toISOString() 
      })
      .eq('id', nextPatient.id);

    if (error) {
      toast({ title: 'Error calling patient', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Calling Token #${nextPatient.token_number}`, description: nextPatient.patient?.full_name });
      
      // Trigger notification check for patients approaching in queue
      triggerNotificationCheck(doctor.id);
    }
    
    setActionLoading(null);
    fetchQueue(doctor.id, doctor.avg_consultation_duration || 15);
  }

  async function completeCurrentPatient() {
    if (!doctor || !currentPatient) return;
    
    setActionLoading(currentPatient.id);

    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'completed', 
        actual_end_time: new Date().toISOString() 
      })
      .eq('id', currentPatient.id);

    if (error) {
      toast({ title: 'Error completing appointment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Appointment completed' });
    }
    
    setActionLoading(null);
    fetchQueue(doctor.id, doctor.avg_consultation_duration || 15);
  }

  async function markNoShow(appointmentId: string) {
    if (!doctor) return;
    
    setActionLoading(appointmentId);

    const { error } = await supabase
      .from('appointments')
      .update({ status: 'no_show' })
      .eq('id', appointmentId);

    if (error) {
      toast({ title: 'Error marking no-show', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Marked as no-show' });
    }
    
    setActionLoading(null);
    fetchQueue(doctor.id, doctor.avg_consultation_duration || 15);
  }

  async function skipPatient(appointmentId: string, currentToken: number) {
    if (!doctor) return;
    
    setActionLoading(appointmentId);

    // Get the highest token number
    const { data } = await supabase
      .from('appointments')
      .select('token_number')
      .eq('doctor_id', doctor.id)
      .eq('appointment_date', new Date().toISOString().split('T')[0])
      .order('token_number', { ascending: false })
      .limit(1) as { data: { token_number: number }[] | null };

    const newToken = (data?.[0]?.token_number || currentToken) + 1;

    const { error } = await supabase
      .from('appointments')
      .update({ token_number: newToken })
      .eq('id', appointmentId);

    if (error) {
      toast({ title: 'Error skipping patient', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Patient moved to end of queue' });
    }
    
    setActionLoading(null);
    fetchQueue(doctor.id, doctor.avg_consultation_duration || 15);
  }

  async function toggleAvailability() {
    if (!doctor) return;
    
    if (useDemoMode) {
      setDoctor({ ...doctor, is_available: !doctor.is_available });
      toast({ title: doctor.is_available ? 'Marked as unavailable' : 'Marked as available' });
      return;
    }
    
    const { error } = await supabase
      .from('doctors')
      .update({ is_available: !doctor.is_available })
      .eq('id', doctor.id);

    if (!error) {
      setDoctor({ ...doctor, is_available: !doctor.is_available });
      toast({ title: doctor.is_available ? 'Marked as unavailable' : 'Marked as available' });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have a doctor account linked. Please contact admin.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Doctor Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Dr. {doctor.name}</h1>
              {useDemoMode && (
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  Demo Mode
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{doctor.specialization || 'General Practitioner'}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={doctor.is_available ? 'default' : 'secondary'}
              className="cursor-pointer text-sm py-1 px-3"
              onClick={toggleAvailability}
            >
              {doctor.is_available ? 'Available' : 'Unavailable'}
            </Badge>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Avg. Consultation</p>
              <p className="font-semibold">{doctor.avg_consultation_duration || 15} mins</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="queue" className="gap-2">
              <Users className="h-4 w-4" /> Patient Queue
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Timer className="h-4 w-4" /> Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            {/* Current Patient */}
            <Card className={currentPatient ? 'border-primary border-2' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Current Patient
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentPatient ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">#{currentPatient.token_number}</span>
                      </div>
                      <div>
                        <p className="text-xl font-semibold">{currentPatient.patient?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{currentPatient.patient?.phone || 'No phone'}</p>
                        {currentPatient.notes && (
                          <p className="text-sm text-muted-foreground mt-1">Notes: {currentPatient.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => markNoShow(currentPatient.id)}
                        disabled={actionLoading === currentPatient.id}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> No Show
                      </Button>
                      <Button 
                        onClick={completeCurrentPatient}
                        disabled={actionLoading === currentPatient.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === currentPatient.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Complete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patient currently being served</p>
                    {queue.length > 0 && (
                      <Button onClick={callNextPatient} className="mt-4 gap-2">
                        <Play className="h-4 w-4" /> Call First Patient
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waiting Queue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Waiting Queue ({queue.length})
                </CardTitle>
                {queue.length > 0 && currentPatient && (
                  <Button onClick={callNextPatient} className="gap-2">
                    <Play className="h-4 w-4" /> Call Next
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No patients waiting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((patient, index) => (
                      <div 
                        key={patient.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          index === 0 ? 'bg-primary/5 border-primary/30' : 'bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                          }`}>
                            <span className="font-bold">#{patient.token_number}</span>
                          </div>
                          <div>
                            <p className="font-medium">{patient.patient?.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              Est. wait: ~{patient.estimated_wait_time} mins
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => skipPatient(patient.id, patient.token_number)}
                            disabled={actionLoading === patient.id}
                          >
                            <AlertCircle className="h-4 w-4 mr-1" /> Skip
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => markNoShow(patient.id)}
                            disabled={actionLoading === patient.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> No Show
                          </Button>
                          {index === 0 && !currentPatient && (
                            <Button 
                              size="sm"
                              onClick={callNextPatient}
                              disabled={actionLoading === patient.id}
                            >
                              <Play className="h-4 w-4 mr-1" /> Call
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <DoctorSchedule doctorId={doctor.id} />
          </TabsContent>

          <TabsContent value="stats">
            <DoctorStats doctorId={doctor.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
