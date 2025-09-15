import React from 'react';
import type { CardVariant } from '../../types/ui';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  variant = 'default',
  padding = 'md',
  header,
  footer
}) => {
  const baseClasses = 'bg-sketch-card rounded-sketch transition-all duration-200';
  
  const variantClasses = {
    default: 'border-2 border-sketch-border shadow-sketch',
    outlined: 'border-2 border-sketch-border',
    elevated: 'border-2 border-sketch-border shadow-sketch-lg',
    filled: 'bg-sketch-background border-2 border-transparent'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const hoverClasses = hoverable ? 'hover:shadow-sketch-lg hover:-translate-y-1 cursor-pointer' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickClasses} ${className}`;
  
  return (
    <div className={classes} onClick={onClick}>
      {header && (
        <div className="mb-4 pb-3 border-b-2 border-sketch-border">
          {header}
        </div>
      )}
      
      <div className={padding === 'none' ? paddingClasses.md : ''}>
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-3 border-t-2 border-sketch-border">
          {footer}
        </div>
      )}
    </div>
  );
};