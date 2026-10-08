import React from 'react';

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'high';
  border?: boolean;
  className?: string;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  intensity = 'medium',
  border = true,
  className = '',
  ...props
}) => {
  const intensityMap = {
    subtle: 'bg-white/[0.02] backdrop-blur-md',
    medium: 'bg-white/[0.04] backdrop-blur-xl',
    high: 'bg-white/[0.07] backdrop-blur-2xl shadow-2xl shadow-black/60',
  };

  return (
    <div
      className={`relative rounded-2xl ${intensityMap[intensity]} ${
        border ? 'border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
