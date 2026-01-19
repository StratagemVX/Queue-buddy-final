import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, LogOut, User, LayoutDashboard, Shield, Stethoscope, Database } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { checkDemoMode, disableDemoMode } from '@/lib/demoData';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(checkDemoMode());
    
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setIsDoctor(false);
    }
  }, [user]);

  async function fetchUserRole() {
    if (!user) return;

    // Check profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    setUserRole(profile?.role || 'patient');

    // Check if user is a doctor
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    setIsDoctor(!!doctor);
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            MediQueue
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link to="/departments" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Departments
          </Link>
          <Link to="/queue-status" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Queue Status
          </Link>
          {(userRole === 'admin' || isDemoMode) && (
            <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
          {(isDoctor || isDemoMode) && (
            <Link to="/doctor" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Doctor Panel
            </Link>
          )}
          {isDemoMode && (
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isDemoMode && (
            <Badge variant="secondary" className="gap-1 hidden sm:flex">
              <Database className="h-3 w-3" />
              Demo
            </Badge>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  My Dashboard
                </DropdownMenuItem>
                {(isDoctor || isDemoMode) && (
                  <DropdownMenuItem onClick={() => navigate('/doctor')}>
                    <Stethoscope className="mr-2 h-4 w-4" />
                    Doctor Panel
                  </DropdownMenuItem>
                )}
                {(userRole === 'admin' || isDemoMode) && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isDemoMode ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Demo User</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Patient Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/doctor')}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Doctor Panel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Panel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { disableDemoMode(); window.location.reload(); }} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit Demo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/auth?mode=signup')} className="bg-gradient-primary hover:opacity-90">
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}