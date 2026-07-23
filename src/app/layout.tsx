import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from './context/CartContext';

export const metadata: Metadata = {
  title: 'Lexie Stickers - Monopoly GO Digital Stickers',
  description: 'Buy Monopoly GO stickers fast and securely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}