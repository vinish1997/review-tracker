import { useEffect, useLayoutEffect, useRef } from "react";

export default function Modal({ open, title, children, onClose }) {
  const dialogRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus management: trap focus and restore
  useLayoutEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement;
    const dlg = dialogRef.current;
    dlg?.focus();
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = dlg?.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    dlg?.addEventListener('keydown', onKeyDown);
    return () => dlg?.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const prev = lastActiveRef.current;
    if (prev && typeof prev.focus === 'function') prev.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center" aria-modal="true" role="dialog" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} className="relative w-full max-w-lg mx-4 rounded bg-white text-gray-900 shadow-lg outline-none">
        <div id="modal-title" className="px-4 py-3 border-b font-semibold">{title}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
