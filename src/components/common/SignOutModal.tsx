'use client';

import { useEffect, useRef } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: SignOutModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto focus the Cancel button by default when modal opens
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 flex items-center justify-center text-[#FF6B00] shrink-0 font-bold shadow-xs">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Sign Out Confirmation</h3>
            <p className="text-xs text-gray-500 mt-0.5">Confirm session termination</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
          Are you sure you want to sign out of your <strong>eYuvaShop</strong> account? You will need to enter your login credentials to access your account again.
        </p>

        {/* Action Buttons - Cancel focused by default */}
        <div className="flex items-center gap-3 pt-1">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 focus:ring-2 focus:ring-gray-900/50 outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 text-xs font-extrabold py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Signing Out...' : 'Yes, Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
