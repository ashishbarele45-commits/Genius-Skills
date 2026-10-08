import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  pill?: boolean;
  className?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, helperText, pill = true, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label className="text-[10px] font-bold text-slate-500 ml-3 uppercase tracking-[0.2em]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-6 py-3.5 ${
            pill ? 'rounded-full' : 'rounded-3xl'
          } bg-white/[0.03] hover:bg-white/[0.05] border ${
            error
              ? 'border-rose-500/50 focus:border-rose-500'
              : 'border-white/10 focus:border-white/25 focus:ring-4 focus:ring-white/5'
          } text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-300 ease-[0.16,1,0.3,1] ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-400 font-medium ml-1">{error}</span>}
        {helperText && !error && <span className="text-xs text-slate-500 ml-1">{helperText}</span>}
      </div>
    );
  }
);
GlassInput.displayName = 'GlassInput';

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
          <label className="text-xs font-medium text-slate-300 ml-1 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-5 py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border ${
            error
              ? 'border-rose-500/50 focus:border-rose-500 ring-rose-500/20'
              : 'border-white/12 focus:border-white/35 focus:ring-2 focus:ring-white/15'
          } text-sm text-white placeholder-slate-500 focus:outline-none transition-all duration-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-400 font-medium ml-1">{error}</span>}
        {helperText && !error && <span className="text-xs text-slate-500 ml-1">{helperText}</span>}
      </div>
    );
  }
);
GlassTextarea.displayName = 'GlassTextarea';

export { GlassSelect } from './GlassSelect';
