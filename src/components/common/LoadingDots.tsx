import React from 'react';

interface LoadingDotsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'white';
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  className = '',
  size = 'md',
  color = 'accent'
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4'
  };

  const colorClasses = {
    primary: 'bg-gray-900',
    accent: 'bg-blue-500',
    white: 'bg-white'
  };

  const dotSize = sizeClasses[size];
  const dotColor = colorClasses[color];
  const gap = gapClasses[size];

  return (
    <div className={`flex items-center justify-center ${gap} ${className}`} role="status" aria-label="Cargando">
      <div
        className={`${dotSize} ${dotColor} rounded-full animate-dynamic-pulse`}
        style={{ animationDelay: '0s' }}
      ></div>
      <div
        className={`${dotSize} ${dotColor} rounded-full animate-dynamic-pulse`}
        style={{ animationDelay: '0.3s' }}
      ></div>
      <div
        className={`${dotSize} ${dotColor} rounded-full animate-dynamic-pulse`}
        style={{ animationDelay: '0.6s' }}
      ></div>
    </div>
  );
};

export default LoadingDots;