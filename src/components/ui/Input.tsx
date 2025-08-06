import React from 'react';
import { cn } from '../../lib/utils';


export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}


const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, fullWidth = false, ...props }, ref) => {
    return (
      <div className={cn('mb-4', fullWidth ? 'w-full' : '')}>
        {label && (
          <label 
            className="block text-sm font-medium text-gray-700 mb-1" 
            htmlFor={props.id || props.name}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm',
            error ? 'border-red-500 focus:ring-red-500' : '',
            fullWidth ? 'w-full' : '',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
