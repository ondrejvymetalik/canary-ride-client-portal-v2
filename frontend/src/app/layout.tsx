import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Canary Ride - Customer Portal',
  description: 'Manage your motorcycle rental booking with Canary Ride',
  keywords: 'motorcycle rental, canary islands, gran canaria, tenerife, booking portal',
  authors: [{ name: 'Canary Ride', url: 'https://canaryride.com' }],
  robots: 'noindex, nofollow', // Private customer portal
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="root" className="min-h-screen bg-gray-50">
          {children}
        </div>
        <div id="modal-root" />
        <div id="toast-root" />
      </body>
    </html>
  );
} 