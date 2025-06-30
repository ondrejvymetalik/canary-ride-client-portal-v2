import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Canary Ride - Customer Portal',
  description: 'Customer web portal for Canary Ride motorcycle rentals',
  robots: 'noindex, nofollow', // Prevent indexing for customer portal
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
    <html lang="en" className={inter.variable}>
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