'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const { cart, buyNowItem, setBuyNowItem, totalCount, totalCost, clearCart } = useCart();

  const isDirect = mode === 'direct' && buyNowItem !== null;
  const itemsToCheckout = isDirect ? [buyNowItem] : cart;

  const checkoutTotalCost = isDirect
    ? buyNowItem.price * buyNowItem.quantity
    : totalCost;

  const checkoutTotalCount = isDirect
    ? buyNowItem.quantity
    : totalCount;

  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('paypal'); // PayPal default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Instruction Modal State
  const [pendingOrder, setPendingOrder] = useState<{ id: string; total: number; method: string } | null>(null);

  // Auto-fill logged-in user email and ID if available
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.email) setEmail(user.email);
        setUserId(user.id);
      }
    }
    loadUser();
  }, []);

  // Config for Admin Payment Handles
  const paymentDetails: Record<string, { name: string; handle: string; note: string; image: string }> = {
    paypal: {
      name: 'PayPal',
      handle: 'paypal.me/lexiestickers',
      note: 'Please send via Friends & Family to avoid holds or delays.',
      image: '/check-paypal.png',
    },
    cashapp: {
      name: 'Cash App',
      handle: '$LexieStickers',
      note: 'Include your Order # in the Cash App note!',
      image: '/check-cashapp.png',
    },
    applepay: {
      name: 'Apple Pay',
      handle: '+1 (555) 019-2831',
      note: 'Send via iMessage / Apple Cash.',
      image: '/check-applepay.png',
    },
    venmo: {
      name: 'Venmo',
      handle: '@LexieStickers',
      note: 'Please do NOT select "Turn on for purchases" to avoid hold.',
      image: '/check-venmo.png',
    },
    chime: {
      name: 'Chime',
      handle: '$LexieStickers',
      note: 'Chime-to-Chime instant transfer.',
      image: '/check-chime.png',
    },
  };

  // SWAPPED: PayPal is now first!
  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', image: '/check-paypal.png', desc: 'Fast and secure transfer via PayPal' },
    { id: 'cashapp', name: 'Cash App', image: '/check-cashapp.png', desc: 'Direct payment via $Cashtag' },
    { id: 'applepay', name: 'Apple Pay', image: '/check-applepay.png', desc: 'Instant checkout with Apple Cash' },
    { id: 'venmo', name: 'Venmo', image: '/check-venmo.png', desc: 'Pay smoothly with your Venmo handle' },
    { id: 'chime', name: 'Chime', image: '/check-chime.png', desc: 'Bank transfer via Chime' },
  ];

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address for your order confirmation.');
      return;
    }

    if (itemsToCheckout.length === 0) {
      setErrorMessage('No items found to checkout.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const supabase = createClient();

      // Extract primary IGN and Invite Link from first item as top-level fallback
      const primaryIgn = itemsToCheckout[0]?.ign || '';
      const primaryInvite = itemsToCheckout[0]?.inviteLink || '';

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId || null,
            buyer_email: email.trim(),
            ign: primaryIgn,
            invite_link: primaryInvite,
            items: itemsToCheckout,
            total_amount: checkoutTotalCost,
            payment_method: selectedPayment,
            status: 'pending',
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Database Error placing order:', error.message, error.details);
        setErrorMessage('Failed to place your order. Please try again or contact support.');
        setIsSubmitting(false);
        return;
      }

      // Order created successfully -> Open Instruction Modal
      setPendingOrder({
        id: data.id,
        total: checkoutTotalCost,
        method: selectedPayment,
      });

      // Clear relevant cart state
      if (isDirect) {
        setBuyNowItem(null);
      } else {
        clearCart();
      }
    } catch (err: unknown) {
      console.error('Unexpected error:', err);
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishOrder = () => {
    if (pendingOrder) {
      router.push(`/order-success/${pendingOrder.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900 relative">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-[1400px] mx-auto px-6 py-10 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Checkout Inputs */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center space-x-3 border-b border-gray-200 pb-6">
              <button
                onClick={() => router.back()}
                className="text-2xl font-bold text-gray-800 hover:text-black transition-colors cursor-pointer"
              >
                ‹
              </button>
              <h1 className="text-3xl font-extrabold text-[#EC4899] tracking-tight">
                Checkout
              </h1>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Step 1: Contact Information */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                  1. Contact Information
                </h2>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#E5E7EB]/50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    We&apos;ll send your receipt and in-game delivery updates here.
                  </p>
                </div>
              </div>

              {/* Step 2: Select Payment Method */}
              <div className="space-y-4 pt-2">
                <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider">
                  2. Select Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedPayment === method.id
                          ? 'border-[#EC4899] bg-pink-50/30 ring-1 ring-[#EC4899]'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={method.image} alt={method.name} className="h-7 w-auto object-contain" />
                        <div>
                          <h3 className="font-extrabold text-xs text-gray-900">
                            {method.name}
                          </h3>
                          <p className="text-[10px] text-gray-500">
                            {method.desc}
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={selectedPayment === method.id}
                        onChange={() => setSelectedPayment(method.id)}
                        className="accent-[#EC4899] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || itemsToCheckout.length === 0}
                className="w-full bg-[#EC4899] hover:bg-[#db2777] disabled:bg-gray-300 text-white font-extrabold py-4 rounded-xl transition-colors text-xs tracking-wider uppercase cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Generating Order...' : `Proceed to Pay $${checkoutTotalCost.toFixed(2)} USD`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Details */}
          <div className="lg:col-span-5 bg-[#F4F4F6] rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-extrabold text-[#EC4899] tracking-tight border-b border-gray-300 pb-4">
              Order Details
            </h2>

            {/* Cart / Direct Item List */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {itemsToCheckout.map((item) => {
                if (!item) return null;

                return (
                  <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-200/80">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full bg-[#FFA2B6] rounded text-[7px] text-white font-bold flex items-center justify-center text-center px-0.5">
                            {item.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-black uppercase">{item.name}</h4>
                        <p className="text-[10px] text-gray-500">
                          IGN: <span className="font-semibold text-gray-800">{item.ign || 'N/A'}</span>
                        </p>
                        <p className="text-[9px] text-gray-400 line-clamp-1">
                          {item.inviteLink || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <span className="font-black text-black text-xs">
                      ${(Number(item.price) * item.quantity).toFixed(2)} USD
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary Totals */}
            <div className="space-y-2.5 text-xs font-bold text-gray-700 border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center uppercase">
                <span>TOTAL ITEMS</span>
                <span className="text-black font-extrabold">{checkoutTotalCount}</span>
              </div>
              <div className="flex justify-between items-center uppercase">
                <span>DELIVERY FEE</span>
                <span className="text-green-600 font-extrabold">FREE</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4 flex justify-between items-center text-sm font-extrabold text-black uppercase">
              <span>TOTAL COST</span>
              <span className="text-base font-black text-[#EC4899]">${checkoutTotalCost.toFixed(2)} USD</span>
            </div>
          </div>
        </main>
      </div>

      <Footer isMinimal={true} />

      {/* Manual Payment Instructions Modal */}
      {pendingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl border border-pink-200">
            <div className="w-12 h-12 bg-pink-100 text-[#EC4899] rounded-full flex items-center justify-center mx-auto text-xl font-black">
              📲
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-gray-900">Complete Your Payment</h3>
              <p className="text-xs text-gray-500">
                Order Reference: <strong className="text-[#EC4899]">#{pendingOrder.id.slice(0, 8)}</strong>
              </p>
            </div>

            {/* Payment Details Box */}
            <div className="bg-[#F9F9FB] border border-gray-200 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-gray-600">Selected Method:</span>
                <span className="text-xs font-black text-black uppercase">
                  {paymentDetails[pendingOrder.method]?.name}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Send Payment To:</span>
                <span className="text-sm font-black text-[#EC4899] bg-pink-50 px-2 py-0.5 rounded border border-pink-200 select-all">
                  {paymentDetails[pendingOrder.method]?.handle}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="text-xs font-bold text-gray-600">Amount Due:</span>
                <span className="text-sm font-black text-black">
                  ${pendingOrder.total.toFixed(2)} USD
                </span>
              </div>

              <p className="text-[10px] text-gray-500 italic pt-1">
                * Note: {paymentDetails[pendingOrder.method]?.note}
              </p>
            </div>

            <button
              onClick={handleFinishOrder}
              className="w-full bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold py-3 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer shadow-md"
            >
              I Have Sent the Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}