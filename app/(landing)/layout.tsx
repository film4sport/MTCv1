import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mono Tennis Club',
  description: 'A not-for-profit community tennis club promoting the game of tennis in Mono, Ontario.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
