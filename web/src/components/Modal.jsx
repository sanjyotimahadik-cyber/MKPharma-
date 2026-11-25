import { useEffect, useLayoutEffect, useRef } from 'react';

// Open modals, newest last, so Escape only closes the topmost one.
const stack = [];

/**
 * Overlay that renders only while open and closes on backdrop click or Escape.
 * Pages keep their own look: pass the page's overlay class as className and the dialog markup as children.
 */
export default function Modal({ open, onClose, className = 'modal-overlay', children }) {
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const entry = () => closeRef.current?.();
    stack.push(entry);
    const onKey = (e) => e.key === 'Escape' && stack.at(-1) === entry && entry();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(entry), 1);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={className} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      {children}
    </div>
  );
}
