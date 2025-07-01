import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
