/**
 * NotificationCenter
 *
 * Desktop: right-side slide-in panel (380 px wide).
 * Mobile (≤ 640 px): full-height bottom sheet with drag handle.
 *
 * The layout variant is driven purely by CSS — the same React tree renders
 * both modes. The drag handle `<div>` is always in the DOM; CSS shows it
 * only on narrow viewports.
 *
 * Accessibility:
 *   role="dialog", aria-modal, aria-label
 *   useFocusTrap    — Tab/Shift+Tab cycle, Escape, return focus to bell
 *   useBodyScrollLock — prevents background scroll while panel is open
 *   useInertBackdrop  — marks background content inert for screen readers
 *   WCAG 2.1 AA: 2.1.1, 2.4.3, 4.1.2
 */
import { useRef, useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useInertBackdrop } from '../../hooks/useInertBackdrop';
import type { NotificationCategory } from '../../types/notification';
import { CATEGORY_ICON, TYPE_COLOR, TYPE_ICON } from './notificationIcons';
import './NotificationCenter.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_ID = 'notification-center';

const CATEGORIES: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'credit_line', label: 'Credit Lines' },
  { value: 'risk_score',  label: 'Risk Score' },
  { value: 'rate_change', label: 'Rates' },
  { value: 'system',      label: 'System' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationCenterProps {
  /**
   * Ref to the bell button that opened the panel.
   * Passed to useFocusTrap so focus returns correctly on close.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function NotificationCenter({ triggerRef }: NotificationCenterProps = {}) {
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
  const [showPrefs, setShowPrefs]       = useState(false);

  // ── Accessibility hooks ──────────────────────────────────────────────────
  // All three are no-ops when isActive / isLocked / isInert is false.
  const panelRef = useFocusTrap({
    isActive: isPanelOpen,
    triggerRef,
    onEscape: closePanel,
  });

  useBodyScrollLock({ isLocked: isPanelOpen });
  useInertBackdrop({ isInert: isPanelOpen, modalId: PANEL_ID });

  const filtered = filterByCategory(activeFilter);

  // ── Drag handle (touch/mouse, mobile only) ───────────────────────────────
  // We use a simple pointer-down-and-move approach. When the user drags
  // downward > 80 px from the handle, we close the panel. This complements
  // the tap-to-dismiss backdrop and does not replace keyboard/button dismiss.
  const dragStartY     = useRef<number | null>(null);
  const panelElRef     = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta < 0) return; // don't allow dragging upward
    // Apply a visual translation while dragging
    if (panelElRef.current) {
      panelElRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    dragStartY.current = null;

    if (panelElRef.current) {
      panelElRef.current.style.transform = '';
    }

    // Dismiss if dragged > 80 px downward
    if (delta > 80) {
      closePanel();
    }
  };

  // Merge the focus-trap ref with our local panelElRef
  const setRefs = (el: HTMLDivElement | null) => {
    panelElRef.current = el;
    // panelRef from useFocusTrap is a RefObject<HTMLDivElement>
    (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <>
      {/* Backdrop */}
      {isPanelOpen && (
        <div
          className="nc-backdrop"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel (desktop) / bottom sheet (mobile) */}
      <div
        ref={setRefs}
        id={PANEL_ID}
        className={`nc-panel ${isPanelOpen ? 'nc-panel-open' : ''}`}
        role="dialog"
        aria-modal={isPanelOpen}
        aria-label="Notification center"
        aria-hidden={!isPanelOpen}
        // Escape is already handled by useFocusTrap; the onKeyDown here is a
        // defence-in-depth fallback for the jsdom test environment where the
        // hook's document listener may not fire on the element directly.
        onKeyDown={e => { if (e.key === 'Escape') closePanel(); }}
      >
        {/*
          Drag handle — visible only on mobile (≤ 640 px via CSS).
          role="button" so keyboard users can activate it as a dismiss gesture;
          they already have the × button and Escape, so this is a convenience.
        */}
        <div
          className="nc-drag-handle-area"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          aria-hidden="true"
        >
          <div className="nc-drag-handle" />
        </div>

        {/* Header */}
        <div className="nc-header">
          <div className="nc-header-left">
            <span className="nc-title">Notifications</span>
            {unreadCount > 0 && (
              <span className="nc-badge" aria-label={`${unreadCount} unread`}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="nc-header-actions">
            <button
              className="nc-icon-btn"
              onClick={() => setShowPrefs(p => !p)}
              aria-label="Notification preferences"
              aria-expanded={showPrefs}
              aria-controls="nc-prefs-panel"
            >
              ⚙
            </button>
            <button
              className="nc-text-btn"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              aria-label={`Mark all notifications as read${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              Mark all read
            </button>
            {notifications.length > 0 && (
              <button
                className="nc-text-btn nc-text-btn-danger"
                onClick={clearAll}
                aria-label="Clear all notifications"
              >
                Clear all
              </button>
            )}
            <button
              className="nc-close-btn"
              onClick={closePanel}
              aria-label="Close notification center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Preferences panel */}
        <div
          id="nc-prefs-panel"
          className={`nc-prefs ${showPrefs ? 'nc-prefs-open' : ''}`}
          aria-hidden={!showPrefs}
        >
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

        {/* Filter tabs */}
        <div className="nc-filters" role="tablist" aria-label="Filter notifications by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              role="tab"
              aria-selected={activeFilter === cat.value}
              className={`nc-filter-tab ${activeFilter === cat.value ? 'nc-filter-active' : ''}`}
              onClick={() => setActiveFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div
          className="nc-list"
          role="feed"
          aria-label={`${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
          aria-busy="false"
        >
          {filtered.length === 0 ? (
            <div className="nc-empty" role="status">
              <span className="nc-empty-icon" aria-hidden="true">🔔</span>
              <p>No notifications</p>
            </div>
          ) : (
            filtered.map(n => {
              const colors = TYPE_COLOR[n.type];
              return (
                <article
                  key={n.id}
                  className={`nc-item ${!n.read ? 'nc-item-unread' : ''}`}
                  aria-label={`${n.title}${!n.read ? ', unread' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <span
                    className="nc-item-icon"
                    style={{ background: colors.bg, color: colors.icon }}
                    aria-hidden="true"
                  >
                    {TYPE_ICON[n.type]}
                  </span>
                  <div className="nc-item-body">
                    <div className="nc-item-header">
                      <span className="nc-item-title">{n.title}</span>
                      <time
                        className="nc-item-time"
                        dateTime={n.timestamp}
                        aria-label={`Received ${relativeTime(n.timestamp)}`}
                      >
                        {relativeTime(n.timestamp)}
                      </time>
                    </div>
                    <p className="nc-item-message">{n.message}</p>
                    {n.action && (
                      <button
                        className="nc-item-action"
                        style={{ color: colors.text }}
                        onClick={e => { e.stopPropagation(); n.action!.onClick(); }}
                        aria-label={`${n.action.label} for notification: ${n.title}`}
                      >
                        {n.action.label} →
                      </button>
                    )}
                  </div>
                  {!n.read && (
                    <span className="nc-unread-dot" aria-hidden="true" />
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
