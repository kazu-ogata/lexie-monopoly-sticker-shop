'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
      <div>
        <Navbar hideSubNav={true} />

        <main className="max-w-4xl mx-auto px-6 py-8 relative">
          {/* Back Arrow Link */}
          <Link
            href="/"
            className="absolute left-6 top-8 text-2xl font-bold text-black hover:opacity-70 transition-opacity"
          >
            ‹
          </Link>

          {/* Centered Pink Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#EC4899] text-center mb-10">
            Terms of Service
          </h1>

          <div className="space-y-6 text-xs md:text-sm text-gray-700 leading-relaxed max-w-3xl mx-auto">
            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                1. Agreement to Terms
              </h2>
              <p>
                By entering, browsing, or purchasing from our website (the &quot;Site&quot;), you confirm that you accept and agree to follow these Terms of Service. If you do not agree to all of these rules, you are strictly prohibited from using our services or purchasing our digital items.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                2. Scope of Digital Goods
              </h2>
              <p>
                Our platform specializes exclusively in the sale and distribution of digital goods, explicitly consisting of in-game collectibles and virtual stickers for mobile gaming platforms. Because these are digital items, no physical products will ever be shipped to your address.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                3. Accepted Payment Methods &amp; Pricing
              </h2>
              <p className="mb-2">
                We offer a variety of secure, encrypted digital checkout options. We officially accept the following payment gateways:
              </p>
              <ul className="list-disc list-inside font-semibold text-gray-800 space-y-0.5 pl-2 mb-2">
                <li>PayPal</li>
                <li>Cash App</li>
                <li>Apple Pay</li>
                <li>Venmo</li>
                <li>Chime</li>
                <li>Zelle</li>
              </ul>
              <p>
                All prices listed on the site are final and must be paid in full before order processing begins. We reserve the absolute right to adjust our sticker prices at any time to reflect market changes without providing advance notice.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                4. Direct In-Game Delivery
              </h2>
              <p className="mb-2">
                Your purchased digital items will be sent directly via the standard in-game gifting mechanism using the <strong>Monopoly Go Invite Link</strong> and <strong>In-Game Name (IGN)</strong> provided by you during the checkout process.
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>It is completely your responsibility to ensure that the invite link and IGN entered are 100% accurate.</li>
                <li>We cannot be held responsible for missing items, lost delivery, or sticker transfers sent to the wrong account due to typographical errors or incorrectly pasted links made by the buyer.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                5. Strict No-Refund Policy
              </h2>
              <p>
                Due to the instant, consumable, and irreversible nature of digital peer-to-peer transfers, <strong>all sales are final</strong>. Once an order has been successfully processed and sent to the provided in-game link, absolutely no refunds, partial refunds, returns, or order exchanges will be issued under any circumstances. Please double-check your cart selection carefully before finalizing your payment.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                6. Disclaimer &amp; Limitation of Liability
              </h2>
              <p>
                Our services are provided on an &quot;as-is&quot; basis. In no event shall this website, its owners, or its team be held liable for any direct, indirect, unexpected, or consequential damages, operational errors, account restrictions, or game-side updates resulting from the use or delivery of our digital assets.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                7. Modifications &amp; Termination
              </h2>
              <p>
                We reserve the right to modify, pause, change, or completely terminate access to our digital storefront or services at any given time, for any reason, without prior warning or liability.
              </p>
            </section>

            <section>
              <h2 className="text-sm md:text-base font-bold text-[#EC4899] mb-1">
                8. Contact Support
              </h2>
              <p>
                If you have any questions, delivery issues, or concerns regarding these Terms of Service, please do not hesitate to reach out to our team at <strong>support.lexiestickers@gmail.com</strong>.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* Minimal Footer matching Figma design */}
      <Footer isMinimal={true} />
    </div>
  );
}