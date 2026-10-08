import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative rounded-[32px] bg-white/[0.03] backdrop-blur-2xl border border-white/12 p-6 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.65)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] ${className}`}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
