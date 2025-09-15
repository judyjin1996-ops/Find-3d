import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  fallback,
  className = '',
  onClick
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };
  
  const baseClasses = 'inline-flex items-center justify-center rounded-full border-2 border-sketch-border bg-sketch-background overflow-hidden transition-all duration-200';
  const clickClasses = onClick ? 'cursor-pointer hover:shadow-sketch' : '';
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${clickClasses} ${className}`;
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  const renderContent = () => {
    if (src && !imageError) {
      return (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      );
    }
    
    if (fallback) {
      return (
        <span className="font-medium text-sketch-text">
          {fallback.charAt(0).toUpperCase()}
        </span>
      );
    }
    
    return (
      <svg className="w-2/3 h-2/3 text-sketch-muted" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  };
  
  return (
    <div className={classes} onClick={onClick}>
      {renderContent()}
    </div>
  );
};