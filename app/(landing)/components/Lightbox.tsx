'use client';

import { useEffect, useRef } from 'react';

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ src, alt, caption, isOpen, onClose }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
      // Focus trap: keep focus inside lightbox
      if (e.key === 'Tab' && isOpen) {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

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
