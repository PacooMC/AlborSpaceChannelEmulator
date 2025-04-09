import React from 'react';
    import { AlertTriangle, Check, X } from 'lucide-react';

    export interface ConfirmationModalProps {
      isOpen: boolean;
      title: string;
      message: React.ReactNode; // Allow JSX for message
      confirmText?: string;
      cancelText?: string;
      confirmButtonVariant?: 'primary' | 'danger'; // Style confirm button
      onConfirm: () => void;
      onCancel: () => void;
      icon?: React.ElementType;
    }

    const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
      isOpen,
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmButtonVariant = 'primary', // Default to primary (orange)
      onConfirm,
      onCancel,
      icon: Icon = AlertTriangle, // Default icon
    }) => {
      if (!isOpen) {
        return null;
      }

      const confirmButtonClasses = {
        primary: 'bg-albor-orange hover:bg-albor-orange/80 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
      };

      return (
        // Backdrop
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={onCancel} // Close on backdrop click
        >
          {/* Modal Content */}
          <div
            className="bg-albor-bg-dark border border-albor-dark-gray rounded-lg shadow-xl w-full max-w-md p-6 m-4 text-albor-light-gray transform transition-all scale-95 opacity-0 animate-scale-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <Icon
                size={24}
                className={confirmButtonVariant === 'danger' ? 'text-red-500' : 'text-albor-orange'}
              />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>

            {/* Message Body */}
            <div className="text-sm text-albor-light-gray/90 mb-6">
              {message}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded text-sm bg-albor-bg-dark/80 hover:bg-albor-dark-gray/50 border border-albor-dark-gray text-albor-light-gray transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors flex items-center space-x-1.5 ${confirmButtonClasses[confirmButtonVariant]}`}
              >
                <Check size={16} />
                <span>{confirmText}</span>
              </button>
            </div>
          </div>

          {/* Add animation styles if not already present globally */}
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
          `}</style>
        </div>
      );
    };

    export default ConfirmationModal;
