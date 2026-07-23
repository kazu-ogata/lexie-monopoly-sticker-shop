'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StickerCard from '../../components/StickerCard';
import { createClient } from '../../lib/supabase/client';
import { Sticker } from '../../types/sticker';
import { useCart } from '../../context/CartContext';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, setBuyNowItem, totalCount } = useCart();

  const [product, setProduct] = useState<Sticker | null>(null);
  const [relatedCards, setRelatedCards] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [inviteLink, setInviteLink] = useState('');
  const [ign, setIgn] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    async function fetchProductDetails() {
      if (!params.id) return;
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } else {
        setProduct(data);

        const { data: relatedData } = await supabase
          .from('stickers')
          .select('*')
          .eq('rarity', data.rarity)
          .neq('id', data.id)
          .order('name', { ascending: true });

        setRelatedCards(relatedData || []);
      }
      setLoading(false);
    }

    fetchProductDetails();
  }, [params.id]);

  const handleCategoryNavigate = (rarity: string) => {
    const starNum = rarity.replace('-Star', '').replace('★', '').replace('⭐', '').trim();
    router.push(`/?category=${encodeURIComponent(`${starNum} ★`)}`);
  };

  const handleAddToCart = () => {
    if (!inviteLink.trim() || !ign.trim()) {
      setErrorMessage('Please enter both your Invite Link and In-Game Name before proceeding.');
      return;
    }

    setErrorMessage('');

    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        rarity: product.rarity,
        image_url: product.image_url,
        quantity,
        ign: ign.trim(),
        inviteLink: inviteLink.trim(),
      });

      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  const handleBuyNow = async () => {
    if (!inviteLink.trim() || !ign.trim()) {
      setErrorMessage('Please enter both your Invite Link and In-Game Name before proceeding.');
      return;
    }

    setErrorMessage('');

    if (product) {
      // Set direct checkout item
      setBuyNowItem({
        id: product.id,
        name: product.name,
        price: product.price,
        rarity: product.rarity,
        image_url: product.image_url,
        quantity,
        ign: ign.trim(),
        inviteLink: inviteLink.trim(),
      });

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in -> go to login first, then return to direct checkout
        router.push('/login?redirect=/checkout?mode=direct');
      } else {
        // Logged in -> go straight to checkout
        router.push('/checkout?mode=direct');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
        <Navbar hideSubNav={true} cartCount={totalCount} />
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
        <Navbar hideSubNav={true} cartCount={totalCount} />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sticker Not Found</h2>
          <p className="text-xs text-gray-500 mb-6">The sticker you requested could not be found.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#EC4899] text-white font-bold px-6 py-2 rounded-xl text-xs"
          >
            Return to Storefront
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const starCount = parseInt(product.rarity || '6', 10) || 6;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-7xl mx-auto px-6 py-6 md:px-12">
          {/* Breadcrumbs Navigation */}
          <div className="flex items-center space-x-3 mb-8 text-xs text-gray-600 font-medium">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-1 text-gray-800 hover:text-black font-bold bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <span>‹</span>
              <span>Back</span>
            </button>

            <span className="text-gray-300">|</span>

            <nav className="flex items-center space-x-1.5">
              <button onClick={() => router.push('/')} className="hover:underline">
                Home
              </button>
              <span>&gt;</span>
              <button
                onClick={() => handleCategoryNavigate(product.rarity)}
                className="hover:underline font-semibold"
              >
                {product.rarity.replace('-Star', '⭐')}
              </button>
              <span>&gt;</span>
              <span className="text-[#EC4899] font-bold">{product.name}</span>
            </nav>
          </div>

          {/* Product Detail Main Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-16">
            
            {/* Left Box: Card Display */}
            <div className="md:col-span-6 bg-[#F9F9FB] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] shadow-sm">
              <div className="flex justify-center space-x-1 mb-4">
                {Array.from({ length: starCount }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">
                    ⭐
                  </span>
                ))}
              </div>

              <div className="w-full max-w-xs aspect-[4/5] bg-[#FFA2B6] rounded-2xl flex items-center justify-center p-4 shadow-sm">
                {product.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-center text-white font-semibold text-lg drop-shadow-sm">
                    {product.name}
                  </span>
                )}
              </div>
            </div>

            {/* Right Form */}
            <div className="md:col-span-6 space-y-6 pt-2">
              <div>
                <h1 className="text-3xl font-extrabold text-black tracking-tight mb-1">
                  {product.name}
                </h1>
                <p className="text-2xl font-black text-black">
                  ${Number(product.price).toFixed(2)} USD
                </p>
              </div>

              {/* Quantity Selector + Stock Info */}
              <div className="space-y-1.5">
                <label className="block text-[11px] text-gray-500 font-semibold">Quantity</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-gray-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {product.stock ?? 10} pieces available
                  </span>
                </div>
              </div>

              {/* Invite Link Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Invite Link<span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://mply.io/..."
                  value={inviteLink}
                  onChange={(e) => {
                    setInviteLink(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#E5E7EB]/60 rounded-md px-3 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 border border-transparent"
                />
              </div>

              {/* In-Game Name Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  In-Game Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JohnDoe123"
                  value={ign}
                  onChange={(e) => {
                    setIgn(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#E5E7EB]/60 rounded-md px-3 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 border border-transparent"
                />
              </div>

              {/* Error / Validation Feedback */}
              {errorMessage && (
                <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">
                  ⚠️ {errorMessage}
                </p>
              )}

              {/* Success Feedback */}
              {addedSuccess && (
                <p className="text-xs font-bold text-green-700 bg-green-50 p-2.5 rounded-md border border-green-200 flex justify-between items-center">
                  <span>✓ Item added to cart!</span>
                  <button
                    onClick={() => router.push('/cart')}
                    className="underline text-xs text-green-800 hover:text-black font-extrabold cursor-pointer"
                  >
                    View Cart
                  </button>
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#EC4899] hover:bg-[#db2777] text-white font-bold py-3 rounded-md transition-colors text-xs tracking-wide cursor-pointer"
                >
                  Add to cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#FBCFE8] hover:bg-[#f472b6] text-gray-900 font-bold py-3 rounded-md transition-colors text-xs tracking-wide cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

          {/* Delivery & Support Guarantee Box */}
          <div className="bg-[#F9F9FB] rounded-2xl p-8 md:p-10 mb-16 space-y-6">
            <h2 className="text-2xl font-extrabold text-[#EC4899] text-center mb-6">
              Delivery &amp; Support Guarantee
            </h2>

            <div className="space-y-6 text-xs text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-bold text-sm text-black mb-1">
                  How to Receive Your Stickers
                </h3>
                <p className="text-gray-600 mb-2">
                  Dear Valued Customers, thank you for choosing <strong>Lexie Stickers</strong>! To ensure your Monopoly GO! stickers arrive safely and smoothly, please follow these quick steps:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                  <li>
                    <strong>Before Checkout:</strong> When adding items to your cart, please make sure to fill in your Monopoly GO! Friend <strong>Invite Link</strong> and <strong>In-Game Name</strong>. We require this information to process your delivery!
                  </li>
                  <li>
                    <strong>Add &amp; Send:</strong> Once your purchase is complete, our team will add you in-game and send your ordered stickers directly to your account.
                  </li>
                  <li>
                    <strong>Check In-Game:</strong> After your order is marked complete, you will receive a prompt notification via Email. Simply open your game to claim your new stickers!
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sm text-black mb-1">
                  Fast Delivery &amp; Support Guarantee
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-1">
                  <li>
                    <strong>30-Minute Delivery:</strong> Because these are digital items, we prioritize speed! 95% of our orders are processed and completed within <strong>15 to 30 minutes</strong>.
                  </li>
                  <li>
                    <strong>Need Help?</strong> If you haven't received your sticker after 30 minutes, please don't hesitate to reach out! Check your email inbox (and junk folder)—we might be missing your invite link or need extra details. You can also contact us instantly via our website's Live Chat or email us at <strong>support@lexiestickers.com</strong>.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sm text-black mb-1">
                  1-Day Limited Product Warranty
                </h3>
                <p className="text-gray-600">
                  Due to the nature of digital products, your purchase is fully backed by a <strong>1-Day Limited Warranty</strong>. If there is any issue with your delivery or an oversight on our end, please contact our support channels within 24 hours of purchase so we can resolve it immediately or process your refund. Your satisfaction is our top priority!
                </p>
              </div>
            </div>
          </div>

          {/* Related Cards Grid */}
          {relatedCards.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-black mb-6">
                Other {product.rarity.replace('-Star', '⭐')} Cards ({relatedCards.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {relatedCards.map((card) => (
                  <StickerCard key={card.id} sticker={card} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}