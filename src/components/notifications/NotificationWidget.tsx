/**
 * NotificationWidget
 *
 * Co-locates NotificationBell (trigger) and NotificationCenter (panel)
 * with a shared triggerRef so focus returns to the bell when the panel
 * closes — satisfying WCAG 2.4.3 (Focus Order).
 *
 * Drop this single component wherever the bell button should appear
 * (currently the App.tsx header). It must be rendered inside a
 * NotificationProvider.
 */
import { useRef } from 'react';
import { NotificationBell } from './NotificationBell';
import { NotificationCenter } from './NotificationCenter';

export function NotificationWidget() {
  const bellRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <NotificationBell ref={bellRef} />
      <NotificationCenter triggerRef={bellRef} />
    </>
  );
}
