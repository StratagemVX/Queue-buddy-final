import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface Appointment {
  id: string;
  token_number: number;
  status: string;
  appointment_date: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
}

interface DoctorScheduleProps {
  doctorId: string;
}

export function DoctorSchedule({ doctorId }: DoctorScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentDates, setAppointmentDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAppointments();
    fetchAppointmentDates();
  }, [selectedDate, doctorId]);

  async function fetchAppointments() {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('appointments')
      .select('id, token_number, status, appointment_date, actual_start_time, actual_end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', dateStr)
      .order('token_number');

    if (data) setAppointments(data as Appointment[]);
    setLoading(false);
  }

  async function fetchAppointmentDates() {
    // Fetch dates with appointments for the current month
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    const { data } = await supabase
      .from('appointments')
      .select('appointment_date')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', format(startOfMonth, 'yyyy-MM-dd'))
      .lte('appointment_date', format(endOfMonth, 'yyyy-MM-dd')) as { data: { appointment_date: string }[] | null };

    if (data) {
      setAppointmentDates(new Set(data.map(a => a.appointment_date)));
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'waiting': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'waiting': return <Badge variant="default" className="bg-yellow-500">Waiting</Badge>;
      case 'in_progress': return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show': return <Badge variant="secondary">No Show</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    waiting: appointments.filter(a => a.status === 'waiting').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              hasAppointments: (date) => appointmentDates.has(format(date, 'yyyy-MM-dd')),
            }}
            modifiersStyles={{
              hasAppointments: { 
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} appointments • {stats.completed} completed • {stats.waiting} waiting
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No appointments scheduled for this day
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <div 
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full ${getStatusColor(apt.status)}`} />
                    <div>
                      <p className="font-medium">Token #{apt.token_number}</p>
                      {apt.actual_start_time && (
                        <p className="text-xs text-muted-foreground">
                          Started: {format(new Date(apt.actual_start_time), 'h:mm a')}
                          {apt.actual_end_time && ` - ${format(new Date(apt.actual_end_time), 'h:mm a')}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
