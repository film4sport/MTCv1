import type { MetadataRoute } from 'next';

const SITE_URL = 'https://monotennisclub.ca';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/info?tab=about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/info?tab=membership`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/info?tab=coaching`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/info?tab=faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/info?tab=rules`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/info?tab=privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/info?tab=terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
