import { Metadata } from 'next';
import { SITE_METADATA } from '../lib/site-metadata';

export const metadata: Metadata = {
  title: SITE_METADATA.infoTitle,
  description: SITE_METADATA.infoDescription,
  alternates: {
    canonical: '/info',
  },
  openGraph: {
    title: SITE_METADATA.infoTitle,
    description: SITE_METADATA.infoDescription,
    url: `${SITE_METADATA.siteUrl}/info`,
    images: [
      {
        url: SITE_METADATA.heroImage,
        width: 1200,
        height: 630,
        alt: `${SITE_METADATA.organizationName} - Club Information`,
      },
    ],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_METADATA.siteUrl },
    { '@type': 'ListItem', position: 2, name: 'Club Info', item: `${SITE_METADATA.siteUrl}/info` },
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
