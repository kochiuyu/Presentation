import { useEffect, useRef } from 'react';

export function useDialogFocus(isOpen: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) ?? []);
    (focusable()[0] ?? dialog)?.focus();

    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const openDialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (openDialogs[openDialogs.length - 1] !== dialog) return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keepFocusInside);
    return () => {
      document.removeEventListener('keydown', keepFocusInside);
      previousFocus?.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
