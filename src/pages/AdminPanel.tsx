import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert, Database } from 'lucide-react';
import { DoctorManagement } from '@/components/admin/DoctorManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { Card, CardContent } from '@/components/ui/card';
import { checkDemoMode } from '@/lib/demoData';

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);

  useEffect(() => {
    // Allow demo mode access strictly in development builds
    if (import.meta.env.DEV && !import.meta.env.PROD && checkDemoMode()) {
      setUseDemoMode(true);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    checkAdminRole();
  }, [user, authLoading, navigate]);

  async function checkAdminRole() {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single() as { data: { role: string } | null; error: unknown };

    setIsAdmin(!error && data?.role === 'admin');
    setLoading(false);
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
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
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            {useDemoMode && (
              <Badge variant="secondary" className="gap-1">
                <Database className="h-3 w-3" />
                Demo Mode
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Manage doctors, departments, and system settings</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard useDemoMode={useDemoMode} />
          </TabsContent>

          <TabsContent value="doctors">
            <DoctorManagement useDemoMode={useDemoMode} />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagement useDemoMode={useDemoMode} />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings useDemoMode={useDemoMode} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
