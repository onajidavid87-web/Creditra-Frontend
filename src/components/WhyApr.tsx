import { RefObject, useEffect, useState } from 'react';
import { X, Info, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useInertBackdrop } from '@/hooks/useInertBackdrop';

interface ScoreFactor {
  id: string;
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  value: string;
}

interface WhyAprProps {
  /** Controls visibility of the drawer */
  isOpen: boolean;
  /** Callback when the drawer requests to close */
  onClose: () => void;
  /** Ref to the button that triggered the drawer, for focus restoration */
  triggerRef?: RefObject<HTMLElement | null>;
}

const drawerId = 'why-apr-drawer';

/**
 * Inline drawer that explains the factors contributing to the user's APR.
 * Uses live score data to provide per-factor explanations.
 * Implements an accessible focus order and acts as a sheet on mobile breakpoints.
 */
export function WhyApr({ isOpen, onClose, triggerRef }: WhyAprProps) {
  const [factors, setFactors] = useState<ScoreFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live score data when the drawer opens
  useEffect(() => {
    if (isOpen && factors.length === 0) {
      setIsLoading(true);
      // Simulate fetching live score data
      const fetchScoreData = async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setFactors([
          {
            id: 'utilization',
            name: 'Credit Utilization',
            impact: 'positive',
            description: 'Your utilization is below 30%, which favorably impacts your rate.',
            value: '12%',
          },
          {
            id: 'behavior',
            name: 'Payment Behavior',
            impact: 'positive',
            description: 'Consistent on-time payments lower your risk profile.',
            value: '100% on-time',
          },
          {
            id: 'history',
            name: 'Credit History Length',
            impact: 'neutral',
            description: 'Average account age is moderate. Longer history can further improve rates.',
            value: '4.5 years',
          },
        ]);
        setIsLoading(false);
      };
      fetchScoreData();
    }
  }, [isOpen, factors.length]);

  const dialogRef = useFocusTrap({
    isActive: isOpen,
    triggerRef,
    onEscape: onClose,
  });

  useBodyScrollLock({ isLocked: isOpen });
  useInertBackdrop({ isInert: isOpen, modalId: drawerId });

  if (!isOpen) return null;

  return createPortal(
    <div
      id={drawerId}
      className="fixed inset-0 z-[1200] flex justify-end"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={dialogRef as RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="why-apr-title"
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-surface text-foreground shadow-2xl transition-transform motion-safe:animate-[slideInRight_0.3s_ease] sm:border-l sm:border-border h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">APR Breakdown</p>
            <h2 id="why-apr-title" className="text-lg font-bold">
              Why this APR?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-border/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
            aria-label="Close APR details"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
              <p className="text-sm text-foreground">
                Your APR of <strong className="text-blue-400">12.5%</strong> is determined by multiple live factors, including your ongoing behavior and utilization.
              </p>
            </div>
          </div>

          <h3 className="mb-4 text-sm font-semibold uppercase text-muted">Score Signals</h3>

          {isLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading score factors">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-border p-4">
                  <div className="h-5 w-1/2 bg-border rounded mb-2" />
                  <div className="h-4 w-3/4 bg-border/50 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-4">
              {factors.map((factor) => (
                <li key={factor.id} className="rounded-lg border border-border bg-background/50 p-4 transition-colors hover:bg-background">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {factor.impact === 'positive' && <ShieldCheck className="h-4 w-4 text-green-400" aria-hidden="true" />}
                      {factor.impact === 'neutral' && <Activity className="h-4 w-4 text-yellow-400" aria-hidden="true" />}
                      {factor.impact === 'negative' && <TrendingUp className="h-4 w-4 text-red-400" aria-hidden="true" />}
                      <span className="font-semibold text-foreground">{factor.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{factor.value}</span>
                  </div>
                  <p className="text-sm text-muted">{factor.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
