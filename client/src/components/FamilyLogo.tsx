import React from 'react';

interface FamilyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl', 
  lg: 'text-4xl',
  xl: 'text-6xl'
};

export const FamilyLogo: React.FC<FamilyLogoProps> = ({ 
  size = 'md', 
  showText = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} leading-none`}>
        👨‍👩‍👧‍👦
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">FamilyXYZ</span>
          <span className="text-xs text-gray-600">Family Connection Platform</span>
        </div>
      )}
    </div>
  );
};

// Alternative emoji options for different contexts
export const FamilyEmojis = {
  family: '👨‍👩‍👧‍👦',
  heart: '💝',
  home: '🏠',
  love: '❤️',
  hug: '🤗',
  together: '👪'
} as const;
