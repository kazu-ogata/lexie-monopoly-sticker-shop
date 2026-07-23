'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { createClient } from '../lib/supabase/client';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, totalCount, totalCost } = useCart();
  
  // State to track which item is selected for deletion modal
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(null);

  const handleCheckout = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // User is not logged in -> redirect to login with return URL
      router.push('/login?redirect=/checkout');
    } else {
      // User is logged in -> proceed to checkout
      router.push('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900 relative">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-[1400px] mx-auto px-6 py-10 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Shopping Cart Table */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex justify-between items-baseline border-b border-gray-200 pb-6">
              <h1 className="text-3xl font-extrabold text-[#EC4899] tracking-tight">
                Shopping Cart
              </h1>
              <span className="text-2xl font-extrabold text-[#EC4899]">
                {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <span className="text-5xl block">🛒</span>
                <h2 className="text-lg font-bold text-gray-800">Your cart is empty</h2>
                <p className="text-xs text-gray-500">Looks like you haven't added any stickers yet.</p>
                <Link
                  href="/"
                  className="inline-block bg-[#EC4899] text-white font-bold px-6 py-2.5 rounded-lg text-xs hover:bg-pink-600 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Table Header */}
                <div className="grid grid-cols-12 text-[11px] font-black text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                  <div className="col-span-6">PRODUCT DETAILS</div>
                  <div className="col-span-2 text-center">QUANTITY</div>
                  <div className="col-span-2 text-center">PRICE</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                </div>

                {/* Cart Rows */}
                <div className="space-y-8">
                  {cart.map((item) => {
                    const starCount = parseInt(item.rarity || '6', 10) || 6;

                    return (
                      <div key={item.id} className="grid grid-cols-12 items-center text-xs">
                        {/* Product Detail Box */}
                        <div className="col-span-6 flex items-center space-x-4">
                          <div className="w-20 h-28 bg-[#F9F9FB] border border-gray-200/80 rounded-xl flex flex-col items-center justify-between p-1.5 flex-shrink-0 overflow-hidden">
                            <div className="flex justify-center space-x-0.5 w-full pt-0.5">
                              {Array.from({ length: starCount }).map((_, i) => (
                                <span key={i} className="text-[8px] text-yellow-400 leading-none">
                                  ⭐
                                </span>
                              ))}
                            </div>

                            <div className="w-full h-full my-1 bg-[#FFA2B6] rounded-md flex items-center justify-center text-[9px] text-white font-bold text-center px-1 overflow-hidden">
                              {item.image_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span>{item.name}</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h3 className="font-extrabold text-sm text-black uppercase">
                              {item.name}
                            </h3>
                            <p className="text-[10px] text-gray-500">
                              IGN: <span className="font-semibold text-gray-800">{item.ign || 'N/A'}</span>
                            </p>
                            <p className="text-[10px] text-gray-500 line-clamp-1">
                              Invite: <span className="font-semibold text-gray-800">{item.inviteLink || 'N/A'}</span>
                            </p>

                            <button
                              onClick={() => setDeleteItem({ id: item.id, name: item.name })}
                              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider block cursor-pointer pt-1"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>

                        {/* Quantity Incrementer */}
                        <div className="col-span-2 flex justify-center">
                          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 font-bold text-xs text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 text-center font-bold text-black">
                          ${Number(item.price).toFixed(2)} USD
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 text-right font-extrabold text-black">
                          ${(Number(item.price) * item.quantity).toFixed(2)} USD
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Continue Shopping Link */}
                <div className="pt-10">
                  <Link
                    href="/"
                    className="inline-flex items-center space-x-2 text-sm font-bold text-[#EC4899] hover:underline cursor-pointer"
                  >
                    <span>←</span>
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-4 bg-[#F4F4F6] rounded-xl p-8 space-y-6">
            <h2 className="text-2xl font-extrabold text-[#EC4899] tracking-tight border-b border-gray-300 pb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs font-bold text-gray-700">
              <div className="flex justify-between items-center uppercase">
                <span>TOTAL ITEMS</span>
                <span className="text-black font-extrabold">{totalCount}</span>
              </div>
              <div className="flex justify-between items-center uppercase">
                <span>SUBTOTAL</span>
                <span className="text-black font-extrabold">${totalCost.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="border-t border-gray-300 pt-4 space-y-4">
              <div className="flex justify-between items-center text-sm font-extrabold text-black uppercase">
                <span>TOTAL COST</span>
                <span>${totalCost.toFixed(2)} USD</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-[#F3B8CD] hover:bg-[#eb9bb6] disabled:bg-gray-300 text-black font-extrabold py-3.5 rounded-md transition-colors text-xs tracking-wider uppercase cursor-pointer"
              >
                CHECKOUT
              </button>
            </div>
          </div>
        </main>
      </div>

      <Footer isMinimal={true} />

      {/* Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 bg-pink-100 text-[#EC4899] rounded-full flex items-center justify-center mx-auto text-xl font-black">
              🗑️
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-gray-900">
                Remove Item?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-800 uppercase">{deleteItem.name}</span> from your cart?
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeFromCart(deleteItem.id);
                  setDeleteItem(null);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}