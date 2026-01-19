import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';

interface DoctorStatsProps {
  doctorId: string;
}

interface DailyStats {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  avg_duration: number | null;
}

export function DoctorStats({ doctorId }: DoctorStatsProps) {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, cancelled: 0, noShow: 0, avgDuration: 0 });
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [avgConsultation, setAvgConsultation] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [doctorId]);

  interface AppointmentData {
    status: string;
    actual_start_time: string | null;
    actual_end_time: string | null;
    appointment_date?: string;
  }

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    // Today's stats
    const { data: todayData } = await supabase
      .from('appointments')
      .select('status, actual_start_time, actual_end_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today) as { data: AppointmentData[] | null };

    if (todayData) {
      const completed = todayData.filter(a => a.status === 'completed');
      let totalDuration = 0;
      let countWithDuration = 0;
      
      completed.forEach(a => {
        if (a.actual_start_time && a.actual_end_time) {
          const duration = (new Date(a.actual_end_time).getTime() - new Date(a.actual_start_time).getTime()) / 60000;
          totalDuration += duration;
          countWithDuration++;
        }
      });

      setTodayStats({
        total: todayData.length,
        completed: completed.length,
        cancelled: todayData.filter(a => a.status === 'cancelled').length,
        noShow: todayData.filter(a => a.status === 'no_show').length,
        avgDuration: countWithDuration > 0 ? Math.round(totalDuration / countWithDuration) : 0,
      });
    }

    // Weekly stats
    const { data: weekData } = await supabase
      .from('appointments')
      .select('appointment_date, status, actual_start_time, actual_end_time')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', weekAgo)
      .lte('appointment_date', today)
      .order('appointment_date') as { data: (AppointmentData & { appointment_date: string })[] | null };

    if (weekData) {
      const grouped: Record<string, DailyStats> = {};
      
      weekData.forEach(apt => {
        const date = apt.appointment_date;
        if (!grouped[date]) {
          grouped[date] = { date, total: 0, completed: 0, cancelled: 0, no_show: 0, avg_duration: null };
        }
        grouped[date].total++;
        if (apt.status === 'completed') grouped[date].completed++;
        if (apt.status === 'cancelled') grouped[date].cancelled++;
        if (apt.status === 'no_show') grouped[date].no_show++;
      });

      setWeeklyStats(Object.values(grouped));
    }

    // All-time stats
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('status', 'completed');

    setTotalPatients(count || 0);

    // Average consultation time from completed appointments
    const { data: avgData } = await supabase
      .from('appointments')
      .select('actual_start_time, actual_end_time')
      .eq('doctor_id', doctorId)
      .eq('status', 'completed')
      .not('actual_start_time', 'is', null)
      .not('actual_end_time', 'is', null)
      .limit(100) as { data: { actual_start_time: string; actual_end_time: string }[] | null };

    if (avgData && avgData.length > 0) {
      let totalDuration = 0;
      avgData.forEach(a => {
        if (a.actual_start_time && a.actual_end_time) {
          totalDuration += (new Date(a.actual_end_time).getTime() - new Date(a.actual_start_time).getTime()) / 60000;
        }
      });
      setAvgConsultation(Math.round(totalDuration / avgData.length));
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.avgDuration} min</div>
            <p className="text-xs text-muted-foreground">per consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">all time completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Consultation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConsultation} min</div>
            <p className="text-xs text-muted-foreground">historical average</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.noShow}</p>
              <p className="text-xs text-muted-foreground">No Shows Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {weeklyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'EEE')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                  <Bar dataKey="no_show" fill="#8b5cf6" name="No Show" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available for the past week
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
