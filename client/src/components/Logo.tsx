import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <img 
      src="/logo/Asset 4.png" 
      alt="My-Tibabu Logo" 
      className={`object-contain ${sizeClasses[size]} ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Logo; 