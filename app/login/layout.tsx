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
  return <>{children}</>;
}
