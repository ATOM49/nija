import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nija Admin Console',
  description: 'Moderation and administration console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
