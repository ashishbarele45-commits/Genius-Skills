import React from 'react';
import { GlassModal } from '../ui/glass/GlassModal';
import { GlassButton } from '../ui/glass/GlassButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  isLoading = false,
}) => {
  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-4 my-2">
        <div className="w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed pt-1">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
        <GlassButton variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
          Cancel
        </GlassButton>
        <GlassButton
          variant="danger"
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </GlassButton>
      </div>
    </GlassModal>
  );
};
