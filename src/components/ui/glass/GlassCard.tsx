import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  interactive = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative rounded-[32px] bg-[#0e1116]/80 backdrop-blur-3xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-500 cubic-bezier(0.16,1,0.3,1) ${
        interactive
          ? 'hover:bg-[#12151c]/90 hover:border-white/20 hover:-translate-y-2 hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] group'
          : ''
      } ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
