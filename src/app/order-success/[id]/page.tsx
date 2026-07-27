'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.id as string;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} />

        <main className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
          <div className="w-16 h-16 bg-pink-100 text-[#EC4899] rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-sm">
            🎉
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-gray-500">
              Your order reference number is:
            </p>
            <span className="inline-block bg-gray-100 border border-gray-200 px-4 py-1.5 rounded-lg text-xs font-mono font-bold text-[#EC4899]">
              #{orderId || 'LX-982341'}
            </span>
          </div>

          <div className="bg-[#F9F9FB] border border-gray-200/80 rounded-2xl p-6 text-left text-xs space-y-3 leading-relaxed">
            <h3 className="font-extrabold text-sm text-black">What Happens Next?</h3>
            <ul className="list-disc list-inside space-y-1.5 text-gray-600">
              <li>
                Our team has received your order details and in-game invite link.
              </li>
              <li>
                In-game sticker transfers are processed within <strong>15 to 30 minutes</strong>.
              </li>
              <li>
                Check your Monopoly GO app—accept our friend request to receive your sticker instantly!
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-block bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold px-8 py-3 rounded-xl text-xs transition-colors shadow-md uppercase tracking-wider"
            >
              Return to Storefront
            </Link>
          </div>
        </main>
      </div>

      <Footer isMinimal={true} />
    </div>
  );
}