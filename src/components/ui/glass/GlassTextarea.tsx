import React from 'react';

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-300 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl bg-white/[0.03] backdrop-blur-xl border ${
            error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-white/30'
          } text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-rose-500/40' : 'focus:ring-white/20'
          } transition-all duration-200 shadow-inner ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
        {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
      </div>
    );
  }
);
GlassTextarea.displayName = 'GlassTextarea';
