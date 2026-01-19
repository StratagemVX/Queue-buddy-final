import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { TokenDisplay } from '@/components/ui/token-display';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Timer, Clock, AlertCircle } from 'lucide-react';
import { formatWaitTime, getWaitTimeColor } from '@/hooks/useWaitTime';
import { checkDemoMode, demoAppointments, getDoctorById, getDepartmentById } from '@/lib/demoData';

interface QueueItem {
  id: string;
  token_number: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  doctor_id: string;
  estimated_wait_time?: number;
  patient_name?: string;
  doctors: { 
    name: string; 
    avg_consultation_duration: number | null;
    departments: { name: string } | null 
  } | null;
}

export default function QueueStatus() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(checkDemoMode());

  useEffect(() => {
    fetchQueue();
    
    if (!checkDemoMode()) {
      const channel = supabase
        .channel('queue-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchQueue)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  async function fetchQueue() {
    if (checkDemoMode()) {
      // Use demo data
      const demoQueue: QueueItem[] = demoAppointments
        .filter(apt => apt.status === 'waiting' || apt.status === 'in_progress')
        .map(apt => {
          const doctor = getDoctorById(apt.doctor_id);
          const dept = doctor ? getDepartmentById(doctor.department_id) : null;
          return {
            id: apt.id,
            token_number: apt.token_number,
            status: apt.status,
            doctor_id: apt.doctor_id,
            patient_name: apt.patient_name,
            doctors: doctor ? {
              name: doctor.name,
              avg_consultation_duration: doctor.avg_consultation_duration,
              departments: dept ? { name: dept.name } : null
            } : null
          };
        });
      
      const enrichedData = calculateWaitTimes(demoQueue);
      setQueue(enrichedData);
      setUseDemoMode(true);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('appointments')
      .select('id, token_number, status, doctor_id, doctors(name, avg_consultation_duration, departments(name))')
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress'])
      .order('token_number');
    
    if (data) {
      const enrichedData = calculateWaitTimes(data as QueueItem[]);
      setQueue(enrichedData);
    }
    setLoading(false);
  }

  function calculateWaitTimes(items: QueueItem[]): QueueItem[] {
    // Group by doctor
    const byDoctor = items.reduce((acc, item) => {
      if (!acc[item.doctor_id]) acc[item.doctor_id] = [];
      acc[item.doctor_id].push(item);
      return acc;
    }, {} as Record<string, QueueItem[]>);

    // Calculate wait time for each
    const result: QueueItem[] = [];
    
    Object.values(byDoctor).forEach(doctorQueue => {
      const avgDuration = doctorQueue[0]?.doctors?.avg_consultation_duration || 15;
      
      doctorQueue.forEach((item, index) => {
        // If in_progress, wait time is 0
        if (item.status === 'in_progress') {
          result.push({ ...item, estimated_wait_time: 0 });
        } else {
          // Count how many are ahead (including any in_progress)
          const inProgressCount = doctorQueue.filter(q => q.status === 'in_progress').length;
          const waitingAhead = doctorQueue
            .filter(q => q.status === 'waiting' && q.token_number < item.token_number)
            .length;
          
          const positionAhead = waitingAhead + (inProgressCount > 0 ? 0.5 : 0);
          result.push({ ...item, estimated_wait_time: Math.round(positionAhead * avgDuration) });
        }
      });
    });

    return result.sort((a, b) => a.token_number - b.token_number);
  }

  const inProgress = queue.filter(q => q.status === 'in_progress');
  const waiting = queue.filter(q => q.status === 'waiting');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Live Queue Status</h1>
          <p className="text-muted-foreground">Real-time OPD queue updates with estimated wait times</p>
          {useDemoMode && (
            <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-800 border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Demo Mode - Sample Data
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 bg-primary rounded-full animate-pulse" /> Currently Being Served ({inProgress.length})
                </h2>
                {inProgress.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No patients currently being served</p>
                ) : (
                  <div className="space-y-3">
                    {inProgress.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3">
                          <TokenDisplay tokenNumber={item.token_number} variant="active" size="md" />
                          <div>
                            <p className="font-medium">{item.doctors?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.doctors?.departments?.name}</p>
                          </div>
                        </div>
                        <StatusBadge status="in_progress" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-warning" /> Waiting ({waiting.length})
                </h2>
                {waiting.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No patients waiting</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {waiting.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <TokenDisplay tokenNumber={item.token_number} variant="waiting" size="sm" />
                          <div>
                            <p className="text-sm font-medium">{item.doctors?.name}</p>
                            <p className="text-xs text-muted-foreground">{item.doctors?.departments?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Timer className="h-3 w-3" />
                            <span className={getWaitTimeColor(item.estimated_wait_time || 0)}>
                              {formatWaitTime(item.estimated_wait_time || 0)}
                            </span>
                          </div>
                          <StatusBadge status="waiting" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Legend */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Understanding Wait Times
            </h3>
            <p className="text-sm text-muted-foreground">
              Estimated wait times are calculated based on each doctor's average consultation duration 
              and your position in the queue. Times may vary based on individual consultations.
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-green-600">● &lt;10 min</span>
              <span className="text-yellow-600">● 10-30 min</span>
              <span className="text-orange-600">● 30-60 min</span>
              <span className="text-red-600">● &gt;60 min</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}