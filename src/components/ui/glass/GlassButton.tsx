import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeMap = {
    sm: 'h-9 px-4 text-xs gap-2',
    md: 'h-11 px-6 text-xs sm:text-sm gap-2.5',
    lg: 'h-13 px-8 text-sm sm:text-base gap-3',
  };

  const variantClassMap = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-secondary bg-transparent hover:bg-white/[0.05]',
    danger: 'btn-secondary bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-all',
  };

  return (
    <button
      className={`${sizeMap[size]} ${variantClassMap[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
