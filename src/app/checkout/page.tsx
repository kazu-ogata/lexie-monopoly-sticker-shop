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

  // Payment Instruction Modal State (For manual methods like Venmo, Chime, Zelle)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

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

  const paymentDetails: Record<string, { name: string; handle: string; note: string; image: string }> = {
    paypal: {
      name: 'PayPal',
      handle: 'Automated Checkout',
      note: 'Instant payment via PayPal SDK.',
      image: '/check-paypal.png',
    },
    cashapp: {
      name: 'Cash App',
      handle: 'Automated Checkout',
      note: 'Instant payment via Stripe / Cash App Pay.',
      image: '/check-cashapp.png',
    },
    applepay: {
      name: 'Apple Pay',
      handle: 'Automated Checkout',
      note: 'Instant 1-click payment via Apple Pay.',
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
    zelle: {
      name: 'Zelle',
      handle: 'support.lexiestickers@gmail.com',
      note: 'Direct bank transfer via Zelle using email or phone.',
      image: '/check-zelle.png',
    },
  };

  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', image: '/check-paypal.png', desc: 'Instant automated checkout via PayPal' },
    { id: 'cashapp', name: 'Cash App', image: '/check-cashapp.png', desc: 'Instant automated checkout via Cash App Pay' },
    { id: 'applepay', name: 'Apple Pay', image: '/check-applepay.png', desc: 'Instant 1-click checkout with Apple Pay' },
    { id: 'venmo', name: 'Venmo', image: '/check-venmo.png', desc: 'Pay smoothly with your Venmo handle (Manual)' },
    { id: 'chime', name: 'Chime', image: '/check-chime.png', desc: 'Bank transfer via Chime (Manual)' },
    { id: 'zelle', name: 'Zelle', image: '/check-zelle.png', desc: 'Direct bank transfer via Zelle (Manual)' },
  ];

  // Handle Form Submission & Routing based on Payment Type
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

    // PayPal is handled directly by its own SDK button below
    if (selectedPayment === 'paypal') {
      return;
    }

    // If Apple Pay or Cash App is selected, trigger Stripe Checkout session
    if (selectedPayment === 'applepay' || selectedPayment === 'cashapp') {
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/checkout_sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsToCheckout,
            email: email.trim(),
            userId: userId,
            paymentMethod: selectedPayment,
            isDirect: isDirect,
          }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to secure Stripe Checkout page
        } else {
          throw new Error(data.error || 'Failed to initialize checkout session');
        }
      } catch (err: unknown) {
        console.error('Stripe redirect error:', err);
        setErrorMessage('Failed to connect to Stripe payment gateway.');
        setIsSubmitting(false);
      }
      return;
    }

    // Otherwise, open the manual proof upload modal for Venmo, Chime, Zelle
    setShowPaymentModal(true);
  };

  // Function to save order to Supabase after successful automated PayPal payment
  const handleSuccessfulPayPalPayment = async () => {
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
            payment_method: 'paypal',
            status: 'completed',
            admin_message: 'Paid automatically via PayPal',
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

  // Finalize Manual Order (For Venmo, Chime, Zelle)
  const handleConfirmManualPayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      let proofUrl = '';

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sticker-images')
          .upload(filePath, proofFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('sticker-images')
            .getPublicUrl(filePath);
          proofUrl = urlData.publicUrl;
        }
      }

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
            admin_message: proofUrl ? `Payment Proof Uploaded: ${proofUrl}` : '',
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Database Error placing order:', error.message, error.details);
        setErrorMessage('Failed to place your order. Please try again.');
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
    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '', currency: 'USD' }}>
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
                            <h3 className="font-extrabold text-xs text-gray-900">{method.name}</h3>
                            <p className="text-[10px] text-gray-500">{method.desc}</p>
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

                {errorMessage && (
                  <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">
                    ⚠️ {errorMessage}
                  </div>
                )}

                {/* Conditional Button Render: PayPal shows SDK Buttons, Apple Pay/Cash App/Manual show submit button */}
                {selectedPayment === 'paypal' ? (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-gray-700">Complete Payment via PayPal:</p>
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
                          await handleSuccessfulPayPalPayment();
                        }
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={itemsToCheckout.length === 0 || isSubmitting}
                    className="w-full bg-[#EC4899] hover:bg-[#db2777] disabled:bg-gray-300 text-white font-extrabold py-4 rounded-xl transition-colors text-xs tracking-wider uppercase cursor-pointer shadow-md"
                  >
                    {isSubmitting ? 'Redirecting to Stripe...' : `Proceed to Pay $${checkoutTotalCost.toFixed(2)} USD`}
                  </button>
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

        {/* Manual Payment Instructions Modal (For Venmo, Chime, Zelle) */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-pink-200 relative max-h-[90vh] overflow-y-auto">
              
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-black font-bold text-sm w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="w-12 h-12 bg-pink-100 text-[#EC4899] rounded-full flex items-center justify-center mx-auto text-xl font-black mt-2">
                📲
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-900">Complete Your Payment</h3>
                <p className="text-xs text-gray-500">Scan QR code or send payment directly.</p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-[11px] font-bold text-gray-700 mb-2">Scan QR Code to Pay</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qrcode.png"
                  alt="Payment QR Code"
                  className="w-36 h-36 object-contain rounded-lg border border-gray-200 bg-white"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {/* Payment Details Box */}
              <div className="bg-[#F9F9FB] border border-gray-200 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-600">Selected Method:</span>
                  <span className="font-black text-black uppercase">{paymentDetails[selectedPayment]?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600">Send Payment To:</span>
                  <span className="font-black text-[#EC4899] bg-pink-50 px-2 py-0.5 rounded border border-pink-200 select-all">
                    {paymentDetails[selectedPayment]?.handle}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-600">Email Contact:</span>
                  <span className="font-semibold text-black select-all">support.lexiestickers@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600">Phone Contact:</span>
                  <span className="font-semibold text-black select-all">09123456789</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-600">Amount Due:</span>
                  <span className="font-black text-black">${checkoutTotalCost.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Proof of Payment Upload */}
              <div className="text-left space-y-1">
                <label className="block text-xs font-bold text-gray-700">Upload Proof of Payment (Screenshot)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl p-2 text-xs text-gray-600 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#EC4899] file:text-white cursor-pointer"
                />
              </div>

              <button
                onClick={handleConfirmManualPayment}
                disabled={isSubmitting}
                className="w-full bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold py-3 rounded-xl transition-colors text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Placing Order...' : 'I Have Sent the Payment'}
              </button>
            </div>
          </div>
        )}
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