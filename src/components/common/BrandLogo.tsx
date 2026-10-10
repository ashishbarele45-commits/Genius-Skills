import React, { useState } from 'react';
import { useBrand } from '../../context/BrandContext';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
}

const OFFICIAL_LOGO =
  'https://res.cloudinary.com/ntspltr3/image/upload/v1791397447/b5063c05-ec02-4baa-83aa-a6a64db1a363-removebg-preview.png';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
}) => {
  const { logoUrl, brandName } = useBrand();
  const [useFallback, setUseFallback] = useState(false);

  // Exact responsive height rules ensuring prominence on desktop & clear recognition on mobile
  const sizeMap = {
    sm: 'h-7 sm:h-8',
    md: 'h-8 sm:h-9 md:h-10 lg:h-11',
    lg: 'h-12 sm:h-14 md:h-16',
    xl: 'h-16 sm:h-20 md:h-24',
    hero: 'h-24 sm:h-28 md:h-36',
  };

  const activeSrc = (!useFallback && logoUrl && logoUrl.trim().startsWith('http')) ? logoUrl.trim() : OFFICIAL_LOGO;

  return (
    <img
      src={activeSrc}
      alt={brandName || 'GENIUS SKILLS Official Logo'}
      loading="eager"
      decoding="async"
      className={`w-auto object-contain select-none max-w-full transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${sizeMap[size]} ${className}`}
      onClick={onClick}
      onError={() => {
        if (!useFallback) {
          setUseFallback(true);
        }
      }}
    />
  );
};


