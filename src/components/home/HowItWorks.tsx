import { UserPlus, Stethoscope, Ticket, Bell } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Register Online',
    description: 'Create your account in minutes with just your basic details.',
  },
  {
    icon: Stethoscope,
    number: '02',
    title: 'Select Doctor',
    description: 'Choose your department and preferred doctor from available specialists.',
  },
  {
    icon: Ticket,
    number: '03',
    title: 'Get Token',
    description: 'Receive your digital token instantly with estimated wait time.',
  },
  {
    icon: Bell,
    number: '04',
    title: 'Get Called',
    description: 'Track queue live and get notified when your turn approaches.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Four simple steps to a stress-free hospital visit
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-border hidden lg:block" />
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <StepCard key={index} {...step} isLast={index === steps.length - 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({ 
  icon: Icon, 
  number, 
  title, 
  description,
  isLast 
}: { 
  icon: typeof UserPlus; 
  number: string;
  title: string; 
  description: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Step number badge */}
      <div className="relative z-10 mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
          <Icon className="h-7 w-7 text-primary-foreground" />
        </div>
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-primary text-xs font-bold text-primary">
          {number}
        </span>
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
    </div>
  );
}