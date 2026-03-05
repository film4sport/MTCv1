import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Login',
  description:
    'Log in to your Mono Tennis Club member dashboard to book courts, view schedules, and manage your membership.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Preload Bebas Neue so the phone mockup doesn't flash on hydration */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      {children}
    </>
  );
}
