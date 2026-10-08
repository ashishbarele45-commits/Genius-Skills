import React from 'react';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-white/10 text-slate-200 border-white/15',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    error: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium backdrop-blur-md ${variantStyles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success'
            ? 'bg-emerald-400'
            : variant === 'warning'
            ? 'bg-amber-400'
            : variant === 'error'
            ? 'bg-rose-400'
            : 'bg-slate-400'
        }`}
      />
      <span>{children}</span>
    </span>
  );
};

interface GlassTabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1.5 rounded-full bg-white/[0.04] backdrop-blur-3xl border border-white/10 overflow-x-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-6 py-2.5 rounded-full text-xs font-bold tracking-tight transition-all duration-500 cubic-bezier(0.16,1,0.3,1) cursor-pointer whitespace-nowrap flex items-center gap-2.5 select-none active:scale-[0.97] ${
              isActive
                ? 'bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-black/10 text-black' : 'bg-white/10 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

interface GlassSkeletonProps {
  className?: string;
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-white/[0.05] border border-white/5 ${className}`}
    />
  );
};
