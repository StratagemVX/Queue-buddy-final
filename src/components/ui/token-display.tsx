import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const tokenVariants = cva(
  'inline-flex items-center justify-center font-bold rounded-xl transition-all',
  {
    variants: {
      size: {
        sm: 'h-10 w-10 text-sm',
        md: 'h-14 w-14 text-lg',
        lg: 'h-20 w-20 text-2xl',
        xl: 'h-28 w-28 text-4xl',
      },
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        active: 'bg-gradient-primary text-primary-foreground shadow-glow',
        waiting: 'bg-warning/15 text-warning border-2 border-warning/30',
        completed: 'bg-success/15 text-success border-2 border-success/30',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

interface TokenDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tokenVariants> {
  tokenNumber: number;
  label?: string;
}

export function TokenDisplay({ 
  tokenNumber, 
  label,
  size, 
  variant, 
  className, 
  ...props 
}: TokenDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(tokenVariants({ size, variant }), className)} {...props}>
        {tokenNumber.toString().padStart(2, '0')}
      </div>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
}