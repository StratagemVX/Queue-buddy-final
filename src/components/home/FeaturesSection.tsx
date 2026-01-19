import { 
  CalendarCheck, 
  Bell, 
  Monitor, 
  QrCode, 
  LineChart, 
  Shield 
} from 'lucide-react';

const features = [
  {
    icon: CalendarCheck,
    title: 'Online Booking',
    description: 'Book your OPD appointment from anywhere, anytime. Select your preferred doctor and time slot.',
  },
  {
    icon: QrCode,
    title: 'Digital Token',
    description: 'Receive a unique digital token instantly. No need for physical tokens or paper slips.',
  },
  {
    icon: Monitor,
    title: 'Live Queue Tracking',
    description: 'Track your position in the queue in real-time. Know exactly when your turn is coming.',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified when your turn is approaching. Never miss your appointment slot.',
  },
  {
    icon: LineChart,
    title: 'Wait Time Estimation',
    description: 'See estimated wait times before booking. Plan your visit accordingly.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your health data is encrypted and protected. HIPAA-compliant security standards.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need for a{' '}
            <span className="text-gradient">Hassle-Free</span> Visit
          </h2>
          <p className="text-muted-foreground text-lg">
            Our smart queue management system transforms your hospital visit experience
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: typeof CalendarCheck; 
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <div 
      className="group relative rounded-2xl bg-card p-6 shadow-soft border border-border/50 hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-gradient-primary group-hover:shadow-glow transition-all duration-300">
        <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}