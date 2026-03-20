import { Metadata } from 'next';
import { SITE_METADATA } from '../lib/site-metadata';

export const metadata: Metadata = {
  title: SITE_METADATA.signupTitle,
  description: SITE_METADATA.signupDescription,
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: SITE_METADATA.signupTitle,
    description: SITE_METADATA.signupDescription,
    url: `${SITE_METADATA.siteUrl}/signup`,
    images: [
      {
        url: SITE_METADATA.heroImage,
        width: 1200,
        height: 630,
        alt: `${SITE_METADATA.organizationName} - Join Now`,
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
