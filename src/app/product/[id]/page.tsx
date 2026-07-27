'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StickerCard from '@/components/StickerCard';
import { createClient } from '@/lib/supabase/client';
import { Sticker } from '@/types/sticker';
import { useCart } from '@/context/CartContext';

export const dynamic = 'force-dynamic';

function ProductDetailContent() {
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
        setQuantity(data.stock > 0 ? 1 : 0);

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

  const availableStock = product?.stock ?? 0;

  const isValidMonopolyLink = (url: string): boolean => {
    const cleanUrl = url.trim();
    const monopolyRegex = /^https?:\/\/(mply\.io|s\.scope\.ly)\/[a-zA-Z0-9_-]+/i;
    return monopolyRegex.test(cleanUrl);
  };

  const handleCategoryNavigate = (rarity: string) => {
    const starNum = rarity.replace('-Star', '').replace('★', '').replace('⭐', '').trim();
    router.push(`/?category=${encodeURIComponent(`${starNum} ★`)}`);
  };

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      setErrorMessage('Sorry, this sticker is currently out of stock.');
      return;
    }

    if (quantity > availableStock) {
      setErrorMessage(`Only ${availableStock} pieces available in stock.`);
      return;
    }

    if (!ign.trim()) {
      setErrorMessage('Please enter your In-Game Name before proceeding.');
      return;
    }

    if (!inviteLink.trim()) {
      setErrorMessage('Please enter your Monopoly GO Invite Link before proceeding.');
      return;
    }

    if (!isValidMonopolyLink(inviteLink)) {
      setErrorMessage(
        'Invalid Invite Link! Your link must start with "https://mply.io/" or "https://s.scope.ly/"'
      );
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
    if (availableStock <= 0) {
      setErrorMessage('Sorry, this sticker is currently out of stock.');
      return;
    }

    if (quantity > availableStock) {
      setErrorMessage(`Only ${availableStock} pieces available in stock.`);
      return;
    }

    if (!ign.trim()) {
      setErrorMessage('Please enter your In-Game Name before proceeding.');
      return;
    }

    if (!inviteLink.trim()) {
      setErrorMessage('Please enter your Monopoly GO Invite Link before proceeding.');
      return;
    }

    if (!isValidMonopolyLink(inviteLink)) {
      setErrorMessage(
        'Invalid Invite Link! Your link must start with "https://mply.io/" or "https://s.scope.ly/"'
      );
      return;
    }

    setErrorMessage('');

    if (product) {
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
        router.push('/login?redirect=/checkout?mode=direct');
      } else {
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

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-7xl mx-auto px-6 py-6 md:px-12">
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

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-16">
            <div className="md:col-span-6 bg-[#F9F9FB] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] shadow-sm">
              <div className="w-full max-w-xs aspect-[4/5] bg-[#FFC0CB]/40 border border-pink-200/60 rounded-2xl flex items-center justify-center p-4 shadow-sm">
                {product.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-center text-pink-500 font-semibold text-lg drop-shadow-sm">
                    {product.name}
                  </span>
                )}
              </div>
            </div>

            <div className="md:col-span-6 space-y-6 pt-2">
              <div>
                <h1 className="text-3xl font-extrabold text-black tracking-tight mb-1">
                  {product.name}
                </h1>
                <p className="text-2xl font-black text-black">
                  ${Number(product.price).toFixed(2)} USD
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-gray-500 font-semibold">Quantity</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(availableStock > 0 ? 1 : 0, q - 1))}
                      disabled={quantity <= 1 || availableStock === 0}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-gray-800">
                      {availableStock === 0 ? 0 : quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      disabled={quantity >= availableStock || availableStock === 0}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className={`text-xs font-bold ${availableStock === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {availableStock === 0 ? 'Out of Stock' : `${availableStock} pieces available`}
                  </span>
                </div>
              </div>

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
                    const inputVal = e.target.value;
                    const extractedMatch = inputVal.match(/https?:\/\/(mply\.io|s\.scope\.ly)\/[a-zA-Z0-9_-]+/i);
                    
                    if (extractedMatch) {
                      setInviteLink(extractedMatch[0]);
                    } else {
                      setInviteLink(inputVal);
                    }

                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full bg-[#E5E7EB]/60 rounded-md px-3 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 border border-transparent"
                />
              </div>

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

              {errorMessage && (
                <p className="text-xs font-bold text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">
                  ⚠️ {errorMessage}
                </p>
              )}

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

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={availableStock === 0}
                  className="w-full bg-[#EC4899] hover:bg-[#db2777] disabled:bg-gray-300 text-white font-bold py-3 rounded-md transition-colors text-xs tracking-wide cursor-pointer disabled:cursor-not-allowed"
                >
                  {availableStock === 0 ? 'Out of Stock' : 'Add to cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={availableStock === 0}
                  className="w-full bg-[#FBCFE8] hover:bg-[#f472b6] disabled:bg-gray-200 disabled:text-gray-400 text-gray-900 font-bold py-3 rounded-md transition-colors text-xs tracking-wide cursor-pointer disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>

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

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}