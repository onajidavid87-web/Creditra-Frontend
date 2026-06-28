import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useInertBackdrop } from '../../hooks/useInertBackdrop';
import type { NotificationCategory } from '../../types/notification';
import { CATEGORY_ICON, TYPE_COLOR, TYPE_ICON } from './notificationIcons';
import { UndoToast } from './UndoToast';
import './NotificationCenter.css';

const CATEGORIES: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'credit_line', label: 'Credit Lines' },
  { value: 'risk_score', label: 'Risk Score' },
  { value: 'rate_change', label: 'Rates' },
  { value: 'system', label: 'System' },
];

/** Viewport breakpoint: bottom-sheet is active below this width (Tailwind `md`). */
export const NOTIFICATION_CENTER_MD_BREAKPOINT = 768;

export type SheetSnapPoint = 'half' | 'full';

/** Height ratios for mobile snap points (50% and 90% of viewport). */
export const SHEET_SNAP_RATIOS: Record<SheetSnapPoint, number> = {
  half: 0.5,
  full: 0.9,
};

/**
 * Pick the nearest snap point (or dismiss) after a drag ends.
 * Thresholds sit midway between snap targets so a quick flick feels natural.
 */
export function resolveSheetSnapFromRatio(ratio: number): SheetSnapPoint | 'dismiss' {
  if (ratio < 0.35) return 'dismiss';
  if (ratio < 0.7) return 'half';
  return 'full';
}

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function useMobileSheetActive() {
  const query = `(max-width: ${NOTIFICATION_CENTER_MD_BREAKPOINT - 1}px)`;
  const [isMobileSheet, setIsMobileSheet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const sync = () => setIsMobileSheet(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, [query]);

  return isMobileSheet;
}

/**
 * Notification inbox panel.
 *
 * Below `md` (768px) the panel becomes a bottom sheet with 50%/90% snap
 * points, a decorative drag handle, and explicit Expand/Collapse controls
 * for keyboard users. At `md` and above the original right-side slide-in
 * panel is preserved.
 */
export function NotificationCenter() {
  const {
    isPanelOpen,
    closePanel,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    filterByCategory,
    preferences,
    updatePreferences,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'all'>('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [snapPoint, setSnapPoint] = useState<SheetSnapPoint>('half');
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [markAllAnnouncement, setMarkAllAnnouncement] = useState('');

  const isMobileSheet = useMobileSheetActive();
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const filterTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const panelRef = useFocusTrap({
    isActive: isPanelOpen,
    onEscape: closePanel,
  });

  useBodyScrollLock({ isLocked: isPanelOpen });
  useInertBackdrop({ isInert: isPanelOpen, modalId: 'notification-center' });

  const filtered = filterByCategory(activeFilter);

  const handleItemClick = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;

    markAsRead(id);

    const key = ++undoToastKeyRef.current;
    setUndoToasts(prev => [...prev, { key, message: '1 notification marked as read', ids: [id] }]);
  }, [notifications, markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    markAllAsRead();

    const key = ++undoToastKeyRef.current;
    setUndoToasts(prev => [...prev, { key, message: `${unreadIds.length} notifications marked as read`, ids: unreadIds }]);
  }, [notifications, markAllAsRead]);

  const selectFilterAtIndex = (index: number) => {
    const category = CATEGORIES[index];
    if (!category) return;

    setActiveFilter(category.value);
    filterTabRefs.current[index]?.focus();
  };

  const handleFilterKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = CATEGORIES.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = index === lastIndex ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = index === 0 ? lastIndex : index - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectFilterAtIndex(nextIndex);
  };

  /**
   * Mark all notifications as read and announce to screen readers.
   */
  const handleMarkAllAsRead = () => {
    const count = unreadCount;
    markAllAsRead();
    
    // Announce completion to screen readers
    const message = count === 1 
      ? '1 notification marked as read' 
      : `${count} notifications marked as read`;
    setMarkAllAnnouncement(message);
    
    // Clear announcement after it's been read
    setTimeout(() => setMarkAllAnnouncement(''), 3000);
  };

  useEffect(() => {
    if (!isPanelOpen) {
      setSnapPoint('half');
      setDragHeightPx(null);
      setIsDragging(false);
    }
  }, [isPanelOpen]);

  const getSnapHeightPx = useCallback(
    (snap: SheetSnapPoint) => window.innerHeight * SHEET_SNAP_RATIOS[snap],
    [],
  );

  const handleDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileSheet || !isPanelOpen) return;

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dragStartY.current = event.clientY;
    dragStartHeight.current =
      dragHeightPx ?? getSnapHeightPx(snapPoint);
    setIsDragging(true);
  };

  const handleDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isMobileSheet) return;

    const deltaY = dragStartY.current - event.clientY;
    const maxHeight = window.innerHeight * SHEET_SNAP_RATIOS.full;
    const minHeight = window.innerHeight * 0.25;
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, dragStartHeight.current + deltaY));
    setDragHeightPx(nextHeight);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isMobileSheet) return;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const currentHeight = dragHeightPx ?? getSnapHeightPx(snapPoint);
    const ratio = currentHeight / window.innerHeight;
    const resolved = resolveSheetSnapFromRatio(ratio);

    setIsDragging(false);
    setDragHeightPx(null);

    if (resolved === 'dismiss') {
      closePanel();
      return;
    }

    setSnapPoint(resolved);
  };

  const panelStyle =
    isMobileSheet && dragHeightPx != null
      ? { height: `${dragHeightPx}px` }
      : undefined;

  return (
    <>
      {isPanelOpen && (
        <div className="nc-backdrop" onClick={closePanel} aria-hidden="true" />
      )}

      <div
        ref={panelRef}
        id="notification-center"
        className={[
          'nc-panel',
          isPanelOpen ? 'nc-panel-open' : '',
          isMobileSheet ? `nc-panel-snap-${snapPoint}` : '',
          isDragging ? 'nc-panel-dragging' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={panelStyle}
        role="dialog"
        aria-modal={isPanelOpen}
        aria-label="Notification center"
        aria-hidden={!isPanelOpen}
      >
        {isMobileSheet && (
          <div className="nc-mobile-chrome">
            {/* Decorative drag affordance; keyboard users rely on Expand/Collapse below. */}
            <div
              className="nc-drag-handle"
              aria-hidden="true"
              onPointerDown={handleDragPointerDown}
              onPointerMove={handleDragPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            />
            <div className="nc-snap-controls">
              <button
                type="button"
                className="nc-text-btn"
                onClick={() => setSnapPoint('full')}
                disabled={snapPoint === 'full'}
                aria-label="Expand notification panel to full height"
              >
                Expand
              </button>
              <button
                type="button"
                className="nc-text-btn"
                onClick={() => setSnapPoint('half')}
                disabled={snapPoint === 'half'}
                aria-label="Collapse notification panel to half height"
              >
                Collapse
              </button>
            </div>
          </div>
        )}

        <div className="nc-header">
          <div className="nc-header-left">
            <span className="nc-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="nc-badge">{unreadCount}</span>
            )}
          </div>
          <div className="nc-header-actions">
            <button
              className="nc-icon-btn"
              onClick={() => setShowPrefs(p => !p)}
              title="Preferences"
              aria-label="Notification preferences"
              aria-expanded={showPrefs}
            >
              ⚙
            </button>
            <button
              className="nc-text-btn"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              aria-label={`Mark all notifications as read${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              Mark all read
            </button>
            {notifications.length > 0 && (
              <button className="nc-text-btn nc-text-btn-danger" onClick={clearAll}>
                Clear all
              </button>
            )}
            <button className="nc-close-btn" onClick={closePanel} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        {showPrefs && (
          <div className="nc-prefs">
            <p className="nc-prefs-title">Notification Preferences</p>
            {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
              <label key={cat.value} className="nc-pref-row">
                <span className="nc-pref-label">
                  {CATEGORY_ICON[cat.value as NotificationCategory]} {cat.label}
                </span>
                <input
                  type="checkbox"
                  className="nc-pref-toggle"
                  checked={preferences[cat.value as NotificationCategory]}
                  onChange={e =>
                    updatePreferences({ [cat.value]: e.target.checked })
                  }
                />
              </label>
            ))}
          </div>
        )}

        <div className="nc-filters" role="tablist">
          {CATEGORIES.map((cat, index) => {
            const isSelected = activeFilter === cat.value;
            return (
              <button
                key={cat.value}
                ref={element => { filterTabRefs.current[index] = element; }}
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`nc-filter-tab ${isSelected ? 'nc-filter-active' : ''}`}
                onClick={() => setActiveFilter(cat.value)}
                onKeyDown={event => handleFilterKeyDown(event, index)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="nc-list">
          {filtered.length === 0 ? (
            <div className="nc-empty">
              <span className="nc-empty-icon">🔔</span>
              <p>No notifications</p>
            </div>
          ) : (
            filtered.map(n => {
              const colors = TYPE_COLOR[n.type];
              return (
                <div
                  key={n.id}
                  className={`nc-item ${!n.read ? 'nc-item-unread' : ''}`}
                  onClick={() => handleItemClick(n.id)}
                >
                  <span
                    className="nc-item-icon"
                    style={{ background: colors.bg, color: colors.icon }}
                  >
                    {TYPE_ICON[n.type]}
                  </span>
                  <div className="nc-item-body">
                    <div className="nc-item-header">
                      <span className="nc-item-title">{n.title}</span>
                      <span className="nc-item-time">{relativeTime(n.timestamp)}</span>
                    </div>
                    <p className="nc-item-message">{n.message}</p>
                    {n.action && (
                      <button
                        className="nc-item-action"
                        style={{ color: colors.text }}
                        onClick={e => { e.stopPropagation(); n.action!.onClick(); }}
                      >
                        {n.action.label} →
                      </button>
                    )}
                  </div>
                  {!n.read && <span className="nc-unread-dot" />}
                </div>
              );
            })
          )}
        </div>

        {/* Screen reader announcement for mark all as read action */}
        {markAllAnnouncement && (
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {markAllAnnouncement}
          </div>
        )}
      </div>

      {undoToasts.map(t => (
        <UndoToast
          key={t.key}
          message={t.message}
          ids={t.ids}
          onClose={() => setUndoToasts(prev => prev.filter(x => x.key !== t.key))}
        />
      ))}
    </>
  );
}
