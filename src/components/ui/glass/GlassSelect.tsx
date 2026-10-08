import React from 'react';

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  pill?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, pill = true, className = '', children, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-300 ml-1 tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-5 py-2.5 ${
            pill ? 'rounded-full' : 'rounded-2xl'
          } bg-[#111317] backdrop-blur-xl border ${
            error ? 'border-rose-500/50' : 'border-white/12 focus:border-white/35'
          } text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/15 transition-all duration-200 cursor-pointer appearance-none ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-rose-400 font-medium ml-1">{error}</span>}
      </div>
    );
  }
);
GlassSelect.displayName = 'GlassSelect';
