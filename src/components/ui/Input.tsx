import React from 'react';
import type { InputType, InputSize } from '../../types/ui';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  inputSize?: InputSize;
  inputType?: InputType;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  inputSize = 'md',
  inputType = 'text',
  clearable = false,
  onClear,
  className = '',
  value,
  ...props
}) => {
  const baseClasses = 'w-full border-2 border-sketch-border rounded-sketch bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sketch-accent focus:ring-opacity-20 focus:border-sketch-accent disabled:bg-gray-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };
  
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  
  const leftIconClasses = icon && iconPosition === 'left' ? 'pl-10' : '';
  const rightIconClasses = (icon && iconPosition === 'right') || clearable ? 'pr-10' : '';
  
  const classes = `${baseClasses} ${sizeClasses[inputSize]} ${errorClasses} ${leftIconClasses} ${rightIconClasses} ${className}`;
  
  const showClearButton = clearable && value && typeof value === 'string' && value.length > 0;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-sketch-text mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sketch-muted">
            {icon}
          </div>
        )}
        
        <input
          type={inputType}
          className={classes}
          value={value}
          {...props}
        />
        
        {icon && iconPosition === 'right' && !showClearButton && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-sketch-muted">
            {icon}
          </div>
        )}
        
        {showClearButton && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sketch-muted hover:text-sketch-text"
            onClick={onClear}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-sketch-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};