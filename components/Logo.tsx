import React from 'react';

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
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Blue Folder Icon with Glow */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Glow Effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Folder Icon */}
          <path
            d="M3 6C3 4.89543 3.89543 4 5 4H9.58579C9.851 4 10.1054 4.10536 10.2929 4.29289L12.7071 6.70711C12.8946 6.89464 13.149 7 13.4142 7H19C20.1046 7 21 7.89543 21 9V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6Z"
            fill="#2563EB"
            filter="url(#glow)"
            className="drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
          />
          
          {/* Folder Tab */}
          <path
            d="M9.58579 4H5C3.89543 4 3 4.89543 3 6V7H10.2929L9.58579 4Z"
            fill="#3B82F6"
            opacity="0.9"
          />
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold text-[#0F172A] ${textSizeClasses[size]} tracking-tight`}>
          Lanka News Room
        </span>
      )}
    </div>
  );
};

export default Logo;

