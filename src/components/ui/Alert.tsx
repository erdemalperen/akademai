import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';


const alertVariants = cva(
  'relative w-full rounded-md border p-4 mb-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        error: 'border-red-500 text-red-700 bg-red-50',
        warning: 'border-yellow-500 text-yellow-700 bg-yellow-50',
        info: 'border-blue-500 text-blue-700 bg-blue-50',
        success: 'border-green-500 text-green-700 bg-green-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);


export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  description?: string;
}


const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, title, description, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {title && <h5 className="font-medium mb-1">{title}</h5>}
      {description && <div className="text-sm">{description}</div>}
      {children}
    </div>
  )
);

Alert.displayName = 'Alert';

export { Alert };
export default Alert;
