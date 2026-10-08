import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* iOS Bubble Glass Dialog */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} bg-[#0e1116]/95 backdrop-blur-3xl border border-white/12 rounded-[36px] p-8 sm:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.9)] z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 ease-[0.16,1,0.3,1]`}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent rounded-[36px] pointer-events-none" />
        <div className="flex items-start justify-between gap-4 mb-8 relative z-10">
          <div>
            {title && <h3 className="text-2xl font-extrabold text-white tracking-tight">{title}</h3>}
            {description && <p className="text-sm text-slate-400 mt-1.5 font-medium">{description}</p>}
          </div>
          {/* Circular bubble close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/12 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};
