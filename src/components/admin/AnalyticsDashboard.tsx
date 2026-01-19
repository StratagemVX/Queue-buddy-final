import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Calendar, Clock, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { demoAnalytics, demoDoctors, demoDepartments } from '@/lib/demoData';

interface DailyAnalytics {
  appointment_date: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_show: number;
  waiting: number;
  in_progress: number;
  avg_consultation_minutes: number | null;
}

interface TodayStats {
  total: number;
  completed: number;
  waiting: number;
  in_progress: number;
  cancelled: number;
  no_show: number;
}

interface AnalyticsDashboardProps {
  useDemoMode?: boolean;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export function AnalyticsDashboard({ useDemoMode = false }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState<TodayStats>({ total: 0, completed: 0, waiting: 0, in_progress: 0, cancelled: 0, no_show: 0 });
  const [weeklyData, setWeeklyData] = useState<DailyAnalytics[]>([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);

  useEffect(() => {
    if (useDemoMode) {
      loadDemoAnalytics();
    } else {
      fetchAnalytics();
    }
  }, [useDemoMode]);

  function loadDemoAnalytics() {
    setTodayStats(demoAnalytics.todayStats);
    setWeeklyData(demoAnalytics.weeklyData);
    setTotalDoctors(demoDoctors.length);
    setTotalDepartments(demoDepartments.length);
    setLoading(false);
  }

  async function fetchAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's appointments
    const { data: todayData } = await supabase
      .from('appointments')
      .select('status')
      .eq('appointment_date', today) as { data: { status: string }[] | null };

    if (todayData) {
      setTodayStats({
        total: todayData.length,
        completed: todayData.filter(a => a.status === 'completed').length,
        waiting: todayData.filter(a => a.status === 'waiting').length,
        in_progress: todayData.filter(a => a.status === 'in_progress').length,
        cancelled: todayData.filter(a => a.status === 'cancelled').length,
        no_show: todayData.filter(a => a.status === 'no_show').length,
      });
    }

    // Fetch weekly data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: weekData } = await supabase
      .from('appointments')
      .select('appointment_date, status')
      .gte('appointment_date', weekAgo.toISOString().split('T')[0])
      .order('appointment_date') as { data: { appointment_date: string; status: string }[] | null };

    if (weekData) {
      const grouped = weekData.reduce((acc, apt) => {
        const date = apt.appointment_date;
        if (!acc[date]) {
          acc[date] = { appointment_date: date, total_appointments: 0, completed: 0, cancelled: 0, no_show: 0, waiting: 0, in_progress: 0, avg_consultation_minutes: null };
        }
        acc[date].total_appointments++;
        if (apt.status === 'completed') acc[date].completed++;
        if (apt.status === 'cancelled') acc[date].cancelled++;
        if (apt.status === 'no_show') acc[date].no_show++;
        if (apt.status === 'waiting') acc[date].waiting++;
        if (apt.status === 'in_progress') acc[date].in_progress++;
        return acc;
      }, {} as Record<string, DailyAnalytics>);
      
      setWeeklyData(Object.values(grouped));
    }

    // Fetch counts
    const { count: doctorCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
    const { count: deptCount } = await supabase.from('departments').select('*', { count: 'exact', head: true });
    
    setTotalDoctors(doctorCount || 0);
    setTotalDepartments(deptCount || 0);
    setLoading(false);
  }

  const pieData = [
    { name: 'Completed', value: todayStats.completed, color: '#10b981' },
    { name: 'Waiting', value: todayStats.waiting, color: '#f59e0b' },
    { name: 'In Progress', value: todayStats.in_progress, color: '#3b82f6' },
    { name: 'Cancelled', value: todayStats.cancelled, color: '#ef4444' },
    { name: 'No Show', value: todayStats.no_show, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

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
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.completed} completed, {todayStats.waiting} waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.waiting + todayStats.in_progress}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats.in_progress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Registered doctors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.waiting}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.in_progress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{todayStats.no_show}</p>
              <p className="text-xs text-muted-foreground">No Show</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="appointment_date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No appointments today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="appointment_date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="total_appointments" stroke="#3b82f6" name="Total" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
