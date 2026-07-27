import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmación de Acción',
  message = '¿Está seguro de realizar esta acción?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#D1E3EB]"
      >
        {/* Header */}
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <h3 className="font-brand font-bold text-lg">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atención:</strong> Por favor verifique el impacto antes de confirmar.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-[#D1E3EB] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-brand font-semibold text-sm rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 text-white font-brand font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#0B4F6C] hover:bg-[#083b52]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
