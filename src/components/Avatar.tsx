'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 md:w-32 md:h-32 text-3xl md:text-4xl',
};

const onlineDotSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
  '2xl': 'w-6 h-6',
};

// Genera un color consistente basado en el nombre
function getColorFromName(name: string): string {
  const colors = [
    'from-[#13C1AC] to-emerald-500',
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-orange-500 to-orange-600',
    'from-indigo-500 to-indigo-600',
    'from-cyan-500 to-cyan-600',
    'from-rose-500 to-rose-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Obtiene las iniciales del nombre
function getInitials(name: string): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  showOnlineStatus = false,
  isOnline = false
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const showImage = src && !imageError;
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);
  
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {showImage ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-white shadow-md`}>
          <Image 
            src={src} 
            alt={name} 
            width={80} 
            height={80} 
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white`}>
          {initials}
        </div>
      )}
      
      {showOnlineStatus && (
        <div className={`absolute bottom-0 right-0 ${onlineDotSizes[size]} rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      )}
    </div>
  );
}
