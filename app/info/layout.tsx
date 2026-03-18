import { Metadata } from 'next';

const SITE_URL = 'https://www.monotennisclub.com';
const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

export const metadata: Metadata = {
  title: 'Club Info — Membership, FAQ & About',
  description:
    'Everything you need to know about Mono Tennis Club: membership fees, facilities, club history since 1980, FAQ, directions to 754483 Mono Centre Rd, and how to join the Caledon-Dufferin tennis community.',
  alternates: {
    canonical: '/info',
  },
  openGraph: {
    title: 'Club Info — Membership, FAQ & About | Mono Tennis Club',
    description:
      'Membership details, facilities, FAQ, and directions. Join the Caledon-Dufferin tennis community at Mono Tennis Club.',
    url: `${SITE_URL}/info`,
    images: [
      {
        url: `${CDN}/hero-aerial-court.png`,
        width: 1200,
        height: 630,
        alt: 'Mono Tennis Club — Club Information',
      },
    ],
  },
};

// BreadcrumbList helps Google show navigation hierarchy in search results
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Club Info', item: `${SITE_URL}/info` },
  ],
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
