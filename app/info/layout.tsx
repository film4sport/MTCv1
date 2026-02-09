import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Club Info | Mono Tennis Club',
  description: 'Membership details, fees, facilities, and news from Mono Tennis Club.',
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
