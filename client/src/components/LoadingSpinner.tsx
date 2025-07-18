import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-heartbeat`}>
        <img 
          src="/logo/Asset 2.png" 
          alt="Loading" 
          className="w-full h-full object-contain"
        />
      </div>
      <p className="text-sm text-gray-600 mt-2 font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner; 