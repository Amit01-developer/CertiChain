import { X } from 'lucide-react';
import React, { useEffect } from 'react';

interface Props {
  open:      boolean;
  onClose:   () => void;
  title:     string;
  children:  React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-serif text-xl text-brand-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
