import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = false,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/LANKA NEWS ROOM.svg"
        alt="Lanka News Room Logo"
        width={size === 'sm' ? 120 : size === 'md' ? 160 : 200}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
      />
    </div>
  );
};

export default Logo;

