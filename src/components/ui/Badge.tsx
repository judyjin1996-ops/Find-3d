import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border-2 transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-sketch-background text-sketch-text border-sketch-border',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300'
  };
  
  const sizeClasses = {
    xs: dot ? 'w-1.5 h-1.5' : 'px-1.5 py-0.5 text-xs',
    sm: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    md: dot ? 'w-3 h-3' : 'px-2.5 py-1 text-sm',
    lg: dot ? 'w-4 h-4' : 'px-3 py-1.5 text-base'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  if (dot) {
    return <span className={classes} />;
  }
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
};