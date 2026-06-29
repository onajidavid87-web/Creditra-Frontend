/**
 * Marks all sibling/parent background content as inert while modal is open.
 * Uses the `inert` attribute (or aria-hidden + pointer-events fallback)
 * to make background content non-interactive and hidden from assistive tech.
 *
 * WCAG 2.1 AA: 4.1.2 (Name, Role, Value)
 */

import { useEffect } from 'react';

interface UseInertBackdropOptions {
  /** Whether to make backdrop inert */
  isInert: boolean;
  /** ID of the modal container (elements outside this are made inert) */
  modalId: string;
}

/**
 * Make everything outside a given modal container unreachable to both
 * pointer input and assistive technology while the modal is open.
 *
 * Prefers the native `inert` attribute when supported; falls back to
 * `aria-hidden` plus `pointer-events: none` for older browsers. Original
 * attribute values are restored on cleanup so this hook is safe to
 * compose with manually managed `aria-hidden` regions.
 */
export function useInertBackdrop({ isInert, modalId }: UseInertBackdropOptions) {
  useEffect(() => {
    if (!isInert) return;

    const modal = document.getElementById(modalId);
    if (!modal) return;

    const elementsToInert = new Set<Element>();
    const originalStates: Array<{
      element: Element;
      inert: boolean | null;
      ariaHidden: string | null;
      pointerEvents: string;
    }> = [];

    // Inert only siblings outside the modal subtree so we never disable an
    // ancestor that still contains the active dialog.
    let current: Element | null = modal;
    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;

      Array.from(parent.children).forEach((sibling) => {
        if (sibling === current) return;

        const tagName = sibling.tagName.toLowerCase();
        if (['script', 'style', 'link', 'meta', 'noscript'].includes(tagName)) {
          return;
        }

        elementsToInert.add(sibling);
      });

      current = parent;
    }

    elementsToInert.forEach((element) => {
      originalStates.push({
        element,
        inert: element.hasAttribute('inert') ? true : null,
        ariaHidden: element.getAttribute('aria-hidden'),
        pointerEvents: (element as HTMLElement).style.pointerEvents,
      });

      if ('inert' in HTMLElement.prototype) {
        (element as HTMLElement).inert = true;
      } else {
        element.setAttribute('aria-hidden', 'true');
        (element as HTMLElement).style.pointerEvents = 'none';
      }
    });

    return () => {
      originalStates.forEach(({ element, inert, ariaHidden, pointerEvents }) => {
        if ('inert' in HTMLElement.prototype) {
          if (inert === null) {
            (element as HTMLElement).removeAttribute('inert');
          } else {
            (element as HTMLElement).inert = true;
          }
        } else {
          if (ariaHidden === null) {
            element.removeAttribute('aria-hidden');
          } else {
            element.setAttribute('aria-hidden', ariaHidden);
          }
          (element as HTMLElement).style.pointerEvents = pointerEvents;
        }
      });
    };
  }, [isInert, modalId]);
}
