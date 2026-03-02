'use client';

import { useEffect, useRef, useCallback } from 'react';

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ src, alt, caption, isOpen, onClose }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap: cycle through all focusable elements inside the lightbox
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) { onClose(); return; }
    if (e.key === 'Tab' && isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  // Move focus to close button when lightbox opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      ref={dialogRef}
      className={`lightbox${isOpen ? ' active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <button ref={closeRef} className="lightbox-close" onClick={onClose} aria-label="Close lightbox">
        &times;
      </button>
      {src && <img src={src} alt={alt} />}
      {caption && <div className="lightbox-caption">{caption}</div>}
    </div>
  );
}
