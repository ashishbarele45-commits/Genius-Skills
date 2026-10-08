import React, { useState } from 'react';
import { useBrand } from '../../context/BrandContext';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
}) => {
  const { logoUrl, brandName } = useBrand();
  const [imageError, setImageError] = useState(false);

  // Dimension mapping based on size prop - purely for layout, no decorative wrappers
  const sizeMap = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24',
    hero: 'h-28 sm:h-36',
  };

  // If no logo is configured, we show nothing rather than a text fallback to strictly adhere to brand guidelines
  if (!logoUrl || imageError) {
    return null;
  }

  return (
    <img
      src={logoUrl}
      alt={brandName || 'GENIUS SKILLS Official Logo'}
      className={`w-auto object-contain select-none max-w-full transition-all duration-300 ${
        onClick ? 'cursor-pointer active:scale-95' : ''
      } ${sizeMap[size]} ${className}`}
      onClick={onClick}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
    />
  );
};

