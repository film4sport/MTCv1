import { Metadata } from 'next';
import { SITE_METADATA } from '../lib/site-metadata';

export const metadata: Metadata = {
  title: SITE_METADATA.loginTitle,
  description: SITE_METADATA.loginDescription,
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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      {children}
    </>
  );
}
