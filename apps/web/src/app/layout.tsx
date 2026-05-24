import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nija — ForwardCheck',
  description: 'A platform to flag content that has dubious sources',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
