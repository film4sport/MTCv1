import Link from 'next/link';

export default function NotFound() {
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
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d4e157' }}>404</span>
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
        Page Not Found
      </h1>

      <p style={{ color: '#a0a090', maxWidth: 400, marginBottom: '2rem', lineHeight: 1.6 }}>
        Looks like this ball went out of bounds. The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
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
            textDecoration: 'none',
            transition: 'background-color 0.2s',
          }}
        >
          Back to Home
        </Link>
        <Link
          href="/info"
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
          Club Info
        </Link>
      </div>
    </div>
  );
}
