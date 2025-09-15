import React from 'react';
import type { ButtonVariant, ButtonSize } from '../../types/ui';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-sketch border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-sketch-accent text-white border-sketch-accent hover:bg-opacity-90 focus:ring-sketch-accent',
    secondary: 'bg-sketch-secondary text-white border-sketch-secondary hover:bg-opacity-90 focus:ring-sketch-secondary',
    outline: 'bg-transparent text-sketch-accent border-sketch-accent hover:bg-sketch-accent hover:text-white focus:ring-sketch-accent',
    ghost: 'bg-transparent text-sketch-text border-transparent hover:bg-sketch-border focus:ring-sketch-accent',
    danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600 focus:ring-red-500'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>加载中...</span>
        </div>
      );
    }
    
    if (icon && !children) {
      return icon;
    }
    
    if (icon && iconPosition === 'left') {
      return (
        <div className="flex items-center space-x-2">
          {icon}
          <span>{children}</span>
        </div>
      );
    }
    
    if (icon && iconPosition === 'right') {
      return (
        <div className="flex items-center space-x-2">
          <span>{children}</span>
          {icon}
        </div>
      );
    }
    
    return children;
  };
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};