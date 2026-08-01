'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export const dynamic = 'force-dynamic';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const { cart, buyNowItem, setBuyNowItem, totalCount, totalCost, clearCart } = useCart();

  // Hydration safety mount check
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const isDirect = mode === 'direct' || (cart.length === 0 && buyNowItem !== null);
  
  // Prevent server/client HTML mismatch by returning empty arrays/zeros until mounted
  const itemsToCheckout = isMounted ? (isDirect ? (buyNowItem ? [buyNowItem] : []) : cart) : [];

  const checkoutTotalCost = isMounted 
    ? (isDirect && buyNowItem ? buyNowItem.price * buyNowItem.quantity : totalCost) 
    : 0;

  const checkoutTotalCount = isMounted 
    ? (isDirect && buyNowItem ? buyNowItem.quantity : totalCount) 
    : 0;

  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', image: '/check-paypal.png', desc: 'Instant automated checkout via PayPal', available: true },
    { id: 'venmo', name: 'Venmo', image: '/check-venmo.png', desc: 'Instant automated checkout via Venmo', available: true },
    { id: 'cashapp', name: 'Cash App', image: '/check-cashapp.png', desc: 'Coming Soon', available: false },
    { id: 'applepay', name: 'Apple Pay', image: '/check-applepay.png', desc: 'Coming Soon', available: false },
    { id: 'chime', name: 'Chime', image: '/check-chime.png', desc: 'Coming Soon', available: false },
    { id: 'zelle', name: 'Zelle', image: '/check-zelle.png', desc: 'Coming Soon', available: false },
  ];

  // Handle Form Submission
  const handleProceedClick = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address for your order confirmation.');
      return;
    }

    if (itemsToCheckout.length === 0) {
      setErrorMessage('No items found to checkout.');
      return;
    }

    setErrorMessage('');
  };

  // Function to save order to Supabase after successful automated PayPal / Venmo payment
  const handleSuccessfulPayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
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
            status: 'completed',
            admin_message: `Paid automatically via ${selectedPayment === 'venmo' ? 'Venmo' : 'PayPal'}`,
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Database Error placing order:', error.message, error.details);
        setErrorMessage('Failed to save your order. Please contact support.');
        setIsSubmitting(false);
        return;
      }

      if (isDirect) {
        setBuyNowItem(null);
      } else {
        clearCart();
      }

      router.push(`/order-success/${data.id}`);
    } catch (err: unknown) {
      console.error('Unexpected error:', err);
      setErrorMessage('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', currency: 'USD', components: 'buttons,funding-eligibility' }}>
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900 relative">
        <div>
          <Navbar hideSubNav={true} cartCount={checkoutTotalCount} />

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

              <form onSubmit={handleProceedClick} className="space-y-8">
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
                        onClick={() => {
                          if (method.available) {
                            setSelectedPayment(method.id);
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          !method.available 
                            ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed' 
                            : selectedPayment === method.id
                              ? 'border-[#EC4899] bg-pink-50/30 ring-1 ring-[#EC4899] cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={method.image} alt={method.name} className="h-7 w-auto object-contain" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-extrabold text-xs text-gray-900">{method.name}</h3>
                              {!method.available && (
                                <span className="bg-gray-200 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500">{method.desc}</p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment"
                          disabled={!method.available}
                          checked={selectedPayment === method.id}
                          onChange={() => {
                            if (method.available) setSelectedPayment(method.id);
                          }}
                          className="accent-[#EC4899] w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* PayPal & Venmo SDK Checkout Buttons */}
                {(selectedPayment === 'paypal' || selectedPayment === 'venmo') && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-gray-700">Complete Payment via PayPal / Venmo:</p>
                    <PayPalButtons
                      style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                      disabled={itemsToCheckout.length === 0 || !email.trim()}
                      createOrder={(data, actions) => {
                        if (!email.trim()) {
                          setErrorMessage('Please enter your email address first.');
                          throw new Error('Email is required');
                        }
                        return actions.order.create({
                          intent: 'CAPTURE',
                          purchase_units: [
                            {
                              amount: {
                                currency_code: 'USD',
                                value: checkoutTotalCost.toFixed(2),
                              },
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        if (actions.order) {
                          await actions.order.capture();
                          await handleSuccessfulPayment();
                        }
                      }}
                    />
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: Order Details */}
            <div className="lg:col-span-5 bg-[#F4F4F6] rounded-2xl p-8 space-y-6">
              <h2 className="text-2xl font-extrabold text-[#EC4899] tracking-tight border-b border-gray-300 pb-4">
                Order Details
              </h2>

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
                          <p className="text-[10px] text-gray-500">IGN: <span className="font-semibold text-gray-800">{item.ign || 'N/A'}</span></p>
                        </div>
                      </div>
                      <span className="font-black text-black text-xs">
                        ${(Number(item.price) * item.quantity).toFixed(2)} USD
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-300 pt-4 flex justify-between items-center text-sm font-extrabold text-black uppercase">
                <span>TOTAL COST</span>
                <span className="text-base font-black text-[#EC4899]">${checkoutTotalCost.toFixed(2)} USD</span>
              </div>
            </div>
          </main>
        </div>

        <Footer isMinimal={true} />
      </div>
    </PayPalScriptProvider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}