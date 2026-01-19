import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Users, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-info/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Smart Queue Management
          </div>
          
          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl animate-slide-up">
            Skip the Wait,{' '}
            <span className="text-gradient">Not the Care</span>
          </h1>
          
          {/* Description */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Book your OPD appointment online, get a digital token, and track your queue position in real-time. 
            No more waiting in long lines.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {user ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/departments')}
                  className="bg-gradient-primary hover:opacity-90 gap-2 h-12 px-8"
                >
                  Book Appointment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="h-12 px-8"
                >
                  View Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth?mode=signup')}
                  className="bg-gradient-primary hover:opacity-90 gap-2 h-12 px-8"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                  className="h-12 px-8"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <StatCard icon={Clock} value="70%" label="Less Wait Time" />
          <StatCard icon={Users} value="10K+" label="Patients Served" />
          <StatCard icon={Shield} value="100%" label="Secure & Private" />
          <StatCard icon={Smartphone} value="24/7" label="Online Access" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-card p-6 shadow-soft border border-border/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}