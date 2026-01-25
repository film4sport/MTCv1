'use client'

export default function LandingPage() {
  return (
    <iframe 
      src="/public/landing.html" 
      title="Mono Tennis Club"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
      }}
    />
  )
}
