import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/LANKA NEWS ROOM.svg"
        alt="Lanka News Room Logo"
        width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
        className={`${sizeClasses[size]} w-auto object-contain flex-shrink-0`}
        priority
      />
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-semibold text-[#1E293B] ${textSizeClasses[size]} tracking-tight leading-tight`}>
          Lanka News Room
        </span>
      )}
    </div>
  );
};

export default Logo;

