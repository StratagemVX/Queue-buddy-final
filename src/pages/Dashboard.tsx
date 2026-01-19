import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { TokenDisplay } from '@/components/ui/token-display';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, User, X, Loader2, Plus, Timer, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatWaitTime, getWaitTimeColor } from '@/hooks/useWaitTime';
import { checkDemoMode, demoAppointments, getDoctorById, DemoAppointment } from '@/lib/demoData';

interface Appointment {
  id: string;
  token_number: number;
  appointment_date: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  doctor_id: string;
  estimated_wait_time?: number;
  doctors: { name: string; specialization: string | null; avg_consultation_duration: number | null } | null;
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Allow demo mode without auth
    if (checkDemoMode()) {
      setUseDemoMode(true);
      fetchDemoAppointments();
      return;
    }
    
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAppointments();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `patient_id=eq.${user.id}` }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  function fetchDemoAppointments() {
    // Convert demo appointments to dashboard format
    const mapped: Appointment[] = demoAppointments.map(apt => {
      const doctor = getDoctorById(apt.doctor_id);
      return {
        id: apt.id,
        token_number: apt.token_number,
        appointment_date: apt.appointment_date,
        status: apt.status,
        created_at: apt.created_at,
        doctor_id: apt.doctor_id,
        estimated_wait_time: apt.status === 'waiting' ? Math.floor(Math.random() * 30) + 5 : undefined,
        doctors: doctor ? {
          name: doctor.name,
          specialization: doctor.specialization,
          avg_consultation_duration: doctor.avg_consultation_duration
        } : null
      };
    });
    setAppointments(mapped);
    setLoading(false);
  }

  async function fetchAppointments() {
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, doctors(name, specialization, avg_consultation_duration)')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false })
      .order('token_number', { ascending: true })
      .limit(20);
    
    if (data) {
      // Calculate wait times for active appointments
      const enriched = await calculateWaitTimes(data as Appointment[]);
      setAppointments(enriched);
    }
    setLoading(false);
  }

  async function calculateWaitTimes(apts: Appointment[]): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const enriched: Appointment[] = [];

    for (const apt of apts) {
      if (apt.appointment_date === today && apt.status === 'waiting') {
        // Get queue position for this doctor
        const { data: queue } = await supabase
          .from('appointments')
          .select('token_number, status')
          .eq('doctor_id', apt.doctor_id)
          .eq('appointment_date', today)
          .in('status', ['waiting', 'in_progress'])
          .lt('token_number', apt.token_number);

        const avgDuration = apt.doctors?.avg_consultation_duration || 15;
        const patientsAhead = queue?.length || 0;
        const inProgressCount = queue?.filter(q => q.status === 'in_progress').length || 0;
        const waitTime = Math.round((patientsAhead - (inProgressCount * 0.5)) * avgDuration);

        enriched.push({ ...apt, estimated_wait_time: Math.max(0, waitTime) });
      } else {
        enriched.push(apt);
      }
    }

    return enriched;
  }

  const cancelAppointment = async (id: string) => {
    if (useDemoMode) {
      toast({ title: 'Appointment cancelled (Demo)', description: 'In demo mode, changes are simulated.' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a));
      return;
    }
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (!error) {
      toast({ title: 'Appointment cancelled' });
      fetchAppointments();
    }
  };

  const activeAppointments = appointments.filter(a => ['waiting', 'in_progress'].includes(a.status));
  const pastAppointments = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            {useDemoMode && (
              <Badge variant="secondary" className="gap-1">
                <Database className="h-3 w-3" />
                Demo Mode
              </Badge>
            )}
          </div>
          <Button onClick={() => navigate('/departments')} className="bg-gradient-primary gap-2">
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Active Appointments</h2>
              {activeAppointments.length === 0 ? (
                <Card className="text-center py-12"><CardContent><p className="text-muted-foreground">No active appointments</p></CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeAppointments.map(apt => (
                    <Card key={apt.id} className="border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <TokenDisplay tokenNumber={apt.token_number} variant={apt.status === 'in_progress' ? 'active' : 'waiting'} size="lg" />
                            <div>
                              <h3 className="font-semibold">{apt.doctors?.name}</h3>
                              <p className="text-sm text-muted-foreground">{apt.doctors?.specialization}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />{apt.appointment_date}
                              </div>
                              {apt.status === 'waiting' && apt.estimated_wait_time !== undefined && (
                                <div className={`flex items-center gap-1 mt-2 text-sm ${getWaitTimeColor(apt.estimated_wait_time)}`}>
                                  <Timer className="h-4 w-4" />
                                  <span>Est. wait: {formatWaitTime(apt.estimated_wait_time)}</span>
                                </div>
                              )}
                              <StatusBadge status={apt.status} className="mt-2" />
                            </div>
                          </div>
                          {apt.status === 'waiting' && (
                            <Button variant="ghost" size="icon" onClick={() => cancelAppointment(apt.id)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Past Appointments</h2>
              {pastAppointments.length === 0 ? (
                <p className="text-muted-foreground">No past appointments</p>
              ) : (
                <div className="space-y-3">
                  {pastAppointments.slice(0, 5).map(apt => (
                    <Card key={apt.id} className="border-border/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TokenDisplay tokenNumber={apt.token_number} size="sm" />
                          <div>
                            <p className="font-medium">{apt.doctors?.name}</p>
                            <p className="text-xs text-muted-foreground">{apt.appointment_date}</p>
                          </div>
                        </div>
                        <StatusBadge status={apt.status} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}