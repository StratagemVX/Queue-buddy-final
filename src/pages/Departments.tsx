import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { demoDepartments, demoDoctors, getDoctorsByDepartment, enableDemoMode, checkDemoMode } from '@/lib/demoData';
import { 
  Stethoscope, Heart, Bone, Baby, Scan, Eye, Ear, Brain, 
  ArrowRight, Loader2, Users, AlertCircle 
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

const iconMap: Record<string, typeof Stethoscope> = {
  Stethoscope,
  Heart,
  Bone,
  Baby,
  Scan,
  Eye,
  Ear,
  Brain,
};

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(checkDemoMode());
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function fetchDepartments() {
    // Check if demo mode is enabled
    if (checkDemoMode()) {
      setDepartments(demoDepartments as Department[]);
      setUseDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error || !data || data.length === 0) {
        // Auto-enable demo mode if database is not available
        enableDemoMode();
        setDepartments(demoDepartments as Department[]);
        setUseDemoMode(true);
      } else {
        setDepartments(data);
        setUseDemoMode(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      enableDemoMode();
      setDepartments(demoDepartments as Department[]);
      setUseDemoMode(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSelectDepartment = (departmentId: string) => {
    navigate(`/book/${departmentId}`);
  };

  const getDoctorCount = (departmentId: string): number => {
    if (useDemoMode) {
      return getDoctorsByDepartment(departmentId).length;
    }
    return 0; // Will be fetched from DB in real mode
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Select a <span className="text-gradient">Department</span>
            </h1>
            <p className="text-muted-foreground">
              Choose your department to view available doctors and book an appointment
            </p>
            {useDemoMode && (
              <Badge variant="secondary" className="mt-3 bg-amber-100 text-amber-800 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Demo Mode - Sample Data
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {departments.map((dept) => {
                const IconComponent = iconMap[dept.icon || 'Stethoscope'] || Stethoscope;
                const doctorCount = getDoctorCount(dept.id);
                
                return (
                  <Card 
                    key={dept.id} 
                    className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-medium transition-all duration-300"
                    onClick={() => handleSelectDepartment(dept.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-gradient-primary transition-all duration-300">
                          <IconComponent className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{dept.name}</CardTitle>
                          {doctorCount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Users className="h-3 w-3" /> {doctorCount} Doctors
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-3 text-xs line-clamp-2">
                        {dept.description}
                      </CardDescription>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 p-0 h-auto text-primary hover:text-primary hover:bg-transparent text-xs"
                      >
                        View Doctors
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
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