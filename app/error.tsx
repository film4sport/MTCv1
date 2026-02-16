'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging (could send to analytics in production)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1f12',
        color: '#e8e4d9',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '2px solid #6b7a3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <svg
          width="32"
          height="32"
          fill="none"
          stroke="#d4e157"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1
        style={{
          fontFamily: "'Gotham Rounded', sans-serif",
          fontSize: '2rem',
          fontWeight: 500,
          marginBottom: '0.75rem',
          color: '#e8e4d9',
        }}
      >
        Something Went Wrong
      </h1>

      <p style={{ color: '#a0a090', maxWidth: 400, marginBottom: '2rem', lineHeight: 1.6 }}>
        We hit a fault on the court. Please try again, or head back to the home page.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7a3d',
            color: '#fff',
            borderRadius: '0.75rem',
            fontWeight: 600,
            fontSize: '0.9375rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          Try Again
        </button>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#d4e157',
            border: '1px solid rgba(212, 225, 87, 0.3)',
            borderRadius: '0.75rem',
            fontWeight: 600,
            fontSize: '0.9375rem',
            textDecoration: 'none',
            transition: 'border-color 0.2s',
          }}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
