import { useEffect, useRef, type RefObject } from 'react';

/**
 * Focus trap for modals/dialogs.
 * Traps Tab/Shift-Tab inside the ref element.
 * Restores focus to the previously focused element on deactivation.
 * Pass `active` to control when the trap is enabled (for inline modals).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean = true) {
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;
    previousFocus.current = document.activeElement;
    const el = ref.current;
    if (!el) return;

    // Focus first focusable element
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableEls = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length === 0) return;

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [ref, active]);
}

/**
 * Generate a unique ID with an optional prefix.
 * Uses crypto.randomUUID() in modern browsers/Node 19+.
 * Falls back to Date.now() + random for older environments.
 */
export function generateId(prefix: string = ''): string {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${id}` : id;
}

