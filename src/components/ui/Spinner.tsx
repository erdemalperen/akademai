import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';


const spinnerVariants = cva(
  'animate-spin rounded-full border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-3',
      },
      color: {
        default: 'border-gray-300 border-t-gray-600',
        primary: 'border-blue-300 border-t-blue-600',
        secondary: 'border-purple-300 border-t-purple-600',
        white: 'border-gray-300 border-t-white',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'primary',
    },
  }
);


export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof spinnerVariants> {}


const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, ...props }, ref) => {
    
    const spinnerColor = color as ('default' | 'primary' | 'secondary' | 'white' | null | undefined);
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, color: spinnerColor }), className)}
        {...props}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
