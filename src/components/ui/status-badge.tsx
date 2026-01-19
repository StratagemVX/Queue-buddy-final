import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      status: {
        waiting: 'bg-warning/15 text-warning border border-warning/20',
        in_progress: 'bg-primary/15 text-primary border border-primary/20',
        completed: 'bg-success/15 text-success border border-success/20',
        cancelled: 'bg-destructive/15 text-destructive border border-destructive/20',
        no_show: 'bg-muted text-muted-foreground border border-border',
      },
    },
    defaultVariants: {
      status: 'waiting',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  showDot?: boolean;
}

export function StatusBadge({ 
  className, 
  status, 
  showDot = true,
  children,
  ...props 
}: StatusBadgeProps) {
  const statusLabels: Record<string, string> = {
    waiting: 'Waiting',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showDot && (
        <span 
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'waiting' && 'bg-warning animate-pulse',
            status === 'in_progress' && 'bg-primary animate-pulse',
            status === 'completed' && 'bg-success',
            status === 'cancelled' && 'bg-destructive',
            status === 'no_show' && 'bg-muted-foreground',
          )} 
        />
      )}
      {children || statusLabels[status || 'waiting']}
    </span>
  );
}