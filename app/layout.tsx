import './globals.css'
import type { Viewport, Metadata } from 'next'

const SITE_URL = 'https://monotennisclub.ca';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Mono Tennis Club | Tennis in Caledon, Dufferin & Mono, Ontario',
    template: '%s | Mono Tennis Club',
  },
  description:
    'Mono Tennis Club — a not-for-profit community tennis club in Mono, Ontario serving Caledon, Dufferin County, and the GTA since 1980.',
  applicationName: 'Mono Tennis Club',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/tennis-ball-clean.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mono Tennis',
  },
  openGraph: {
    title: 'Mono Tennis Club',
    description:
      'A community tennis club in Mono, Ontario — tournaments, leagues, coaching, and more since 1980.',
    url: SITE_URL,
    siteName: 'Mono Tennis Club',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Mono Tennis Club',
    description:
      'Community tennis in Mono, Ontario — tournaments, leagues, coaching & more.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1a1f12',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD is in app/(landing)/layout.tsx — richer version with @graph */}
        {/* Preconnect to external origins for faster resource loading */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#1a1f12' }}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && location.hostname === 'localhost') {
                // Dev mode: unregister any existing SW to prevent stale cache issues
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
                });
              } else if ('serviceWorker' in navigator) {
                // Reload when a new SW takes control (covers all pages)
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) { refreshing = true; window.location.reload(); }
                });
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then(function(reg) {
                      // Immediate update check on load
                      reg.update();
                      // Check for SW updates when user returns to the tab
                      document.addEventListener('visibilitychange', function() {
                        if (document.visibilityState === 'visible') {
                          reg.update();
                        }
                      });
                      // Periodic update check every 30s (catches long-open tabs)
                      setInterval(function() { reg.update(); }, 30 * 1000);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
