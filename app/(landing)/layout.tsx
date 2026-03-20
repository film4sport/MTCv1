import { Metadata } from 'next';
import { ErrorBoundary } from '../dashboard/components/ErrorBoundary';
import { getJsonLdEvents } from '../lib/events';
import { SITE_METADATA } from '../lib/site-metadata';
import { SUPPORT_EMAIL } from '../lib/site';

const SITE_URL = SITE_METADATA.siteUrl;
const CDN = SITE_METADATA.cdnImageBase;

export const metadata: Metadata = {
  title: {
    absolute: SITE_METADATA.landingTitle,
  },
  description: SITE_METADATA.landingDescription,
  keywords: [
    'Mono Tennis Club',
    'tennis Mono Ontario',
    'tennis Caledon',
    'tennis Dufferin County',
    'tennis Orangeville',
    'tennis club GTA',
    'tennis club near me Ontario',
    'community tennis Ontario',
    'tennis courts Mono',
    'tennis courts Caledon',
    'tennis courts Dufferin',
    'tennis tournaments Dufferin',
    'summer tennis camp Ontario',
    'social tennis round robin',
    'Mono Centre Road tennis',
    'not-for-profit tennis club',
    'tennis lessons Caledon Dufferin',
    'court booking Ontario tennis',
    'tennis Bolton Ontario',
    'tennis Brampton north',
    'tennis Shelburne Ontario',
    'tennis Alliston Ontario',
    'tennis Tottenham Ontario',
    'tennis Headwaters region',
    'outdoor tennis courts near Brampton',
    'tennis club Hockley Valley',
    'tennis Adjala-Tosorontio',
    'tennis Erin Ontario',
    'tennis Grand Valley Ontario',
    'tennis Amaranth Ontario',
    'tennis Mono Cliffs',
    'tennis Belfountain Ontario',
    'tennis Caledon Village',
    'tennis Palgrave Ontario',
  ],
  authors: [{ name: SITE_METADATA.organizationName }],
  creator: SITE_METADATA.organizationName,
  publisher: SITE_METADATA.organizationName,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: SITE_METADATA.organizationName,
    title: SITE_METADATA.landingTitle,
    description: SITE_METADATA.landingOgDescription,
    images: [
      {
        url: SITE_METADATA.heroImage,
        width: 1200,
        height: 630,
        alt: `Aerial view of ${SITE_METADATA.organizationName} courts surrounded by nature in Mono, Ontario`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_METADATA.landingTitle,
    description: SITE_METADATA.landingOgDescription,
    images: [SITE_METADATA.heroImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'geo.region': 'CA-ON',
    'geo.placename': 'Mono, Ontario',
    'geo.position': '44.0316;-80.0671',
    ICBM: '44.0316, -80.0671',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SportsActivityLocation',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_METADATA.organizationName,
      alternateName: 'MTC',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      image: SITE_METADATA.heroImage,
      description: SITE_METADATA.landingDescription,
      email: SUPPORT_EMAIL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '754483 Mono Centre Rd',
        addressLocality: 'Mono',
        addressRegion: 'ON',
        postalCode: 'L9W 5W9',
        addressCountry: 'CA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 44.0316,
        longitude: -80.0671,
      },
      areaServed: [
        { '@type': 'City', name: 'Mono', containedInPlace: { '@type': 'AdministrativeArea', name: 'Dufferin County' } },
        { '@type': 'City', name: 'Orangeville' },
        { '@type': 'City', name: 'Caledon' },
        { '@type': 'City', name: 'Bolton' },
        { '@type': 'City', name: 'Brampton' },
        { '@type': 'City', name: 'Shelburne' },
        { '@type': 'City', name: 'Alliston' },
        { '@type': 'City', name: 'Tottenham' },
        { '@type': 'City', name: 'Erin' },
        { '@type': 'City', name: 'Grand Valley' },
        { '@type': 'Place', name: 'Belfountain' },
        { '@type': 'Place', name: 'Caledon Village' },
        { '@type': 'Place', name: 'Palgrave' },
        { '@type': 'AdministrativeArea', name: 'Dufferin County' },
        { '@type': 'AdministrativeArea', name: 'Headwaters Region' },
        { '@type': 'AdministrativeArea', name: 'Greater Toronto Area' },
      ],
      sport: 'Tennis',
      amenityFeature: [
        { '@type': 'LocationFeatureSpecification', name: 'Tennis Courts', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Clubhouse', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Free Parking', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Wheelchair Accessible', value: true },
        { '@type': 'LocationFeatureSpecification', name: 'Court Lighting', value: true },
      ],
      numberOfCourts: 4,
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '09:30',
          closes: '22:00',
          validFrom: '2026-05-01',
          validThrough: '2026-10-31',
        },
      ],
      hasMap: 'https://www.google.com/maps?q=754483+Mono+Centre+Rd,+Mono,+ON',
      priceRange: '$',
      foundingDate: '1980',
      nonprofitStatus: 'Nonprofit',
      sameAs: [
        'https://facebook.com/monotennisclub',
        'https://instagram.com/monotennisclub',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_METADATA.organizationName,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-CA',
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: SITE_METADATA.landingTitle,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      description: SITE_METADATA.landingDescription,
      inLanguage: 'en-CA',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
      ],
    },
    ...getJsonLdEvents(),
  ],
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#1a1f12', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  );
}
