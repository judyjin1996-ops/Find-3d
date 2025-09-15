import React from 'react';
import { createPortal } from 'react-dom';
import type { ModalConfig } from '../../types/ui';

interface ModalProps extends ModalConfig {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  size = 'md',
  closable = true,
  maskClosable = true,
  keyboard = true,
  centered = true,
  className = ''
}) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  React.useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboard && event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, keyboard, onClose]);
  
  if (!mounted || !open) return null;
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  const centerClasses = centered ? 'items-center' : 'items-start pt-16';
  
  const handleMaskClick = (event: React.MouseEvent) => {
    if (maskClosable && event.target === event.currentTarget) {
      onClose();
    }
  };
  
  const modalContent = (
    <div className={`fixed inset-0 z-50 flex justify-center ${centerClasses} p-4`}>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleMaskClick}
      />
      
      {/* 模态框内容 */}
      <div className={`relative bg-white rounded-sketch-lg border-2 border-sketch-border shadow-sketch-lg w-full ${sizeClasses[size]} ${className}`}>
        {/* 头部 */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b-2 border-sketch-border">
            {title && (
              <h3 className="text-lg font-semibold text-sketch-text">
                {title}
              </h3>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="p-1 rounded-sketch text-sketch-muted hover:text-sketch-text hover:bg-sketch-background transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 内容区域 */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};