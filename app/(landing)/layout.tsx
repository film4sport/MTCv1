import { Metadata } from 'next';
import { ErrorBoundary } from '../dashboard/components/ErrorBoundary';

const SITE_URL = 'https://www.monotennisclub.com';
const CDN = 'https://cdn.jsdelivr.net/gh/film4sport/my-webapp-images@main/mtc-images';

export const metadata: Metadata = {
  title: {
    absolute: 'Mono Tennis Club | Premier Tennis in Caledon, Dufferin & Mono, Ontario',
  },
  description:
    'Mono Tennis Club is a not-for-profit community tennis club in Mono, Ontario — serving Orangeville, Caledon, Shelburne, Bolton, Brampton, Dufferin County, and the GTA since 1980. 4 outdoor courts, tournaments, summer camps, coaching, and social round robins for all skill levels.',
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
  authors: [{ name: 'Mono Tennis Club' }],
  creator: 'Mono Tennis Club',
  publisher: 'Mono Tennis Club',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: 'Mono Tennis Club',
    title: 'Mono Tennis Club | Premier Tennis in Caledon, Dufferin & Mono, Ontario',
    description:
      'Join Mono Tennis Club — the heart of community tennis in Mono, Caledon, and Dufferin County since 1980. Tournaments, camps, social events, and beautiful courts in an amazing natural setting.',
    images: [
      {
        url: `${CDN}/hero-aerial-court.png`,
        width: 1200,
        height: 630,
        alt: 'Aerial view of Mono Tennis Club courts surrounded by nature in Mono, Ontario',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mono Tennis Club | Premier Tennis in Caledon, Dufferin & Mono, Ontario',
    description:
      'Join Mono Tennis Club — the heart of community tennis in Mono, Caledon, and Dufferin County since 1980.',
    images: [`${CDN}/hero-aerial-court.png`],
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

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SportsActivityLocation',
      '@id': `${SITE_URL}/#organization`,
      name: 'Mono Tennis Club',
      alternateName: 'MTC',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.png`,
      image: `${CDN}/hero-aerial-court.png`,
      description:
        'A not-for-profit community tennis club located in Mono, Ontario, serving Orangeville, Caledon, Bolton, Shelburne, Brampton, Dufferin County, the Headwaters region, and the GTA since 1980. 4 outdoor courts with lights, tournaments, summer camps, coaching, and social round robins.',
      telephone: '',
      email: 'info@monotennisclub.com',
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
        // Season: May through October, daily
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '09:30', closes: '22:00', validFrom: '2026-05-01', validThrough: '2026-10-31' },
      ],
      hasMap: 'https://www.google.com/maps?q=754483+Mono+Centre+Rd,+Mono,+ON',
      priceRange: '$',
      foundingDate: '1980',
      nonprofitStatus: 'Nonprofit501c3',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Mono Tennis Club',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-CA',
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: 'Mono Tennis Club | Premier Tennis in Caledon, Dufferin & Mono, Ontario',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      description:
        'Mono Tennis Club is a not-for-profit community tennis club in Mono, Ontario — serving Orangeville, Caledon, Bolton, Shelburne, Brampton, Dufferin County, and the GTA since 1980.',
      inLanguage: 'en-CA',
    },
    {
      '@type': 'SportsEvent',
      name: '95+ Mixed Doubles Tournament',
      description: '$180/Team — 2 Matches Guaranteed. A+B Draw, Over 95 Mixed Doubles. Includes lunches at Mono Cliffs Inn and great prizes!',
      startDate: '2026-07-18',
      endDate: '2026-07-19',
      location: { '@id': `${SITE_URL}/#organization` },
      sport: 'Tennis',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
      offers: {
        '@type': 'Offer',
        price: '180',
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/#events`,
      },
    },
    {
      '@type': 'SportsEvent',
      name: 'Summer Tennis Camp',
      description: '8:30am - 3:30pm daily. Make memories, build skills, gain confidence and have fun! Perfect for young players.',
      startDate: '2026-07-28',
      endDate: '2026-08-01',
      location: { '@id': `${SITE_URL}/#organization` },
      sport: 'Tennis',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Event',
      name: 'Euchre Tournament',
      description: 'Pre-season Euchre tournament at Mono Tennis Club. Open to members and guests. Prizes for top teams.',
      startDate: '2026-03-14',
      location: { '@id': `${SITE_URL}/#organization` },
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
      isAccessibleForFree: true,
    },
    {
      '@type': 'SportsEvent',
      name: 'Opening Day BBQ & Round Robin',
      description: 'Kick off the 2026 tennis season with a BBQ and round robin at Mono Tennis Club. Meet fellow members, enjoy food, and hit the courts.',
      startDate: '2026-05-09T12:30:00-04:00',
      endDate: '2026-05-09T15:00:00-04:00',
      location: { '@id': `${SITE_URL}/#organization` },
      sport: 'Tennis',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
      isAccessibleForFree: true,
    },
    {
      '@type': 'SportsEvent',
      name: 'French Open Round Robin Social',
      description: 'Celebrate the French Open with a themed round robin social at Mono Tennis Club. Mixed doubles, prizes, and refreshments.',
      startDate: '2026-06-07T13:00:00-04:00',
      endDate: '2026-06-07T16:00:00-04:00',
      location: { '@id': `${SITE_URL}/#organization` },
      sport: 'Tennis',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
      isAccessibleForFree: true,
    },
    {
      '@type': 'SportsEvent',
      name: 'Wimbledon Open Round Robin',
      description: 'Wimbledon-themed round robin at Mono Tennis Club. Mixed doubles play, strawberries & cream, and great prizes.',
      startDate: '2026-07-12T13:00:00-04:00',
      endDate: '2026-07-12T16:00:00-04:00',
      location: { '@id': `${SITE_URL}/#organization` },
      sport: 'Tennis',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@id': `${SITE_URL}/#organization` },
      isAccessibleForFree: true,
    },
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
