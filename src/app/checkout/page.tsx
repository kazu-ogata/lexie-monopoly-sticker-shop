'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { createClient } from '../lib/supabase/client';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const { cart, buyNowItem, setBuyNowItem, totalCount, totalCost, clearCart } = useCart();

  // Determine if this is a direct single-item checkout or standard full-cart checkout
  const isDirect = mode === 'direct' && buyNowItem !== null;
  const itemsToCheckout = isDirect ? [buyNowItem] : cart;

  const checkoutTotalCost = isDirect
    ? buyNowItem.price * buyNowItem.quantity
    : totalCost;

  const checkoutTotalCount = isDirect
    ? buyNowItem.quantity
    : totalCount;

  const [email, setEmail] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('paypal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const paymentMethods = [
    { id: 'paypal', name: 'PayPal', icon: '🅿️', desc: 'Fast and secure checkout via PayPal' },
    { id: 'cashapp', name: 'Cash App', icon: '💵', desc: 'Direct payment via $Cashtag' },
    { id: 'applepay', name: 'Apple Pay', icon: '🍎', desc: 'Instant checkout with Apple Pay' },
    { id: 'venmo', name: 'Venmo', icon: '📱', desc: 'Pay smoothly with your Venmo handle' },
    { id: 'chime', name: 'Chime', icon: '🏦', desc: 'Bank transfer via Chime' },
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

      // Insert order into Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            buyer_email: email.trim(),
            items: itemsToCheckout,
            total_amount: checkoutTotalCost,
            payment_method: selectedPayment,
            status: 'pending',
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Error placing order:', error);
        setErrorMessage('Failed to place order. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Cleanup
      if (isDirect) {
        setBuyNowItem(null); // Clear instant item, keep regular cart safe!
      } else {
        clearCart(); // Clear full cart if purchased via Cart
      }

      router.push(`/order-success/${data.id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMessage('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-[1400px] mx-auto px-6 py-10 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form Details */}
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
                    We'll send your receipt and in-game delivery updates here.
                  </p>
                </div>
              </div>

              {/* Step 2: Payment Method */}
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
                        <span className="text-2xl">{method.icon}</span>
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

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isSubmitting || itemsToCheckout.length === 0}
                className="w-full bg-[#EC4899] hover:bg-[#db2777] disabled:bg-gray-300 text-white font-extrabold py-4 rounded-xl transition-colors text-xs tracking-wider uppercase cursor-pointer shadow-md"
              >
                {isSubmitting ? 'Processing Order...' : `Pay $${checkoutTotalCost.toFixed(2)} USD`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Details */}
          <div className="lg:col-span-5 bg-[#F4F4F6] rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-extrabold text-[#EC4899] tracking-tight border-b border-gray-300 pb-4">
              Order Details
            </h2>

            {/* Cart / Direct Items List */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {itemsToCheckout.map((item) => {
                if (!item) return null;
                const starCount = parseInt(item.rarity || '6', 10) || 6;

                return (
                  <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-200/80">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-14 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center p-1 flex-shrink-0">
                        <div className="flex space-x-0.5 mb-0.5">
                          {Array.from({ length: starCount }).map((_, i) => (
                            <span key={i} className="text-[7px] text-yellow-400 leading-none">
                              ⭐
                            </span>
                          ))}
                        </div>
                        <div className="w-full h-full bg-[#FFA2B6] rounded text-[7px] text-white font-bold flex items-center justify-center text-center px-0.5">
                          {item.name}
                        </div>
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

            {/* Price Calculations */}
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
    </div>
  );
}