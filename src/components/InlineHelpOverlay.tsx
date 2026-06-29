import type { RefObject } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import HelpCenter from '@/pages/HelpCenter';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useInertBackdrop } from '@/hooks/useInertBackdrop';

interface InlineHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

const modalId = 'inline-help-overlay';

export function InlineHelpOverlay({
  isOpen,
  onClose,
  triggerRef,
}: InlineHelpOverlayProps) {
  const dialogRef = useFocusTrap({
    isActive: isOpen,
    triggerRef,
    onEscape: onClose,
  });

  useBodyScrollLock({ isLocked: isOpen });
  useInertBackdrop({ isInert: isOpen, modalId });

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      id={modalId}
      className="fixed inset-0 z-[1100]"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inline-help-title"
          className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-2xl motion-safe:animate-[fadeIn_0.16s_ease]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-border bg-[#161b22] px-4 py-3 sm:px-5">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Inline support
              </p>
              <h2 id="inline-help-title" className="text-lg font-semibold">
                Help Center
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border text-muted transition-colors hover:border-blue-400 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              aria-label="Close help center overlay"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>
          <div className="overflow-y-auto bg-white text-gray-950">
            <HelpCenter />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
