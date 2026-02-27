import { Metadata } from 'next';

const SITE_URL = 'https://www.monotennisclub.com';
const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

export const metadata: Metadata = {
  title: 'Join Mono Tennis Club — Become a Member',
  description:
    'Register for Mono Tennis Club membership. Season runs May through October with 4 courts, coaching, tournaments, and a welcoming community in Mono, Ontario. Fees from $50/year.',
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Join Mono Tennis Club — Become a Member',
    description:
      'Register for membership at Mono Tennis Club. Season May–October, 4 courts, coaching, tournaments, and community tennis in Mono, Ontario.',
    url: `${SITE_URL}/signup`,
    images: [
      {
        url: `${CDN}/hero-aerial-court.png`,
        width: 1200,
        height: 630,
        alt: 'Mono Tennis Club — Join Now',
      },
    ],
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
