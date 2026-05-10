import React, { useEffect } from 'react';

interface IModalProps {
  title: string;
  onClose(): void;
  children: React.ReactNode;
  /** Max width class — defaults to max-w-lg */
  maxWidth?: string;
}

/**
 * Shared modal shell. Renders a centred overlay with a themed card.
 * Closes on backdrop click or Escape key press.
 */
export default function Modal({
  title,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: IModalProps): React.JSX.Element {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-line shadow-2xl`}
        style={{ background: 'var(--surface-nav)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-t1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-t3 transition-colors hover:bg-surface-hover hover:text-t1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
