'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StickerCard from '@/components/StickerCard';
import ReviewsAndProofs from '@/components/ReviewsAndProofs';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { Sticker } from '@/types/sticker';
import { useCart } from '@/context/CartContext';

export const dynamic = 'force-dynamic';

function StorefrontContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { totalCount } = useCart();

  const categoryParam = searchParams.get('category');
  const searchQueryParam = searchParams.get('search') || '';
  const activeCategory = categoryParam || 'Home';

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSelectCategory = (category: string) => {
    if (category === 'Home') {
      router.push('/', { scroll: false });
    } else {
      router.push(`/?category=${encodeURIComponent(category)}`, { scroll: false });
    }
  };

  useEffect(() => {
    async function fetchStickers() {
      setLoading(true);
      const supabase = createClient();

      let query = supabase
        .from('stickers')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0);

      if (activeCategory !== 'Home') {
        const starNum = activeCategory.replace('★', '').replace('⭐', '').trim();
        query = query.eq('rarity', `${starNum}-Star`).order('price', { ascending: false });
      } else {
        // HOME TAB: Sort from 6-star down to 1-star (Highest price to lowest price)
        query = query.order('price', { ascending: false });
      }

      if (searchQueryParam.trim()) {
        query = query.ilike('name', `%${searchQueryParam.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching stickers:', error);
        setStickers([]);
      } else {
        setStickers(data || []);
      }
      setLoading(false);
    }

    fetchStickers();
  }, [activeCategory, searchQueryParam]);

  return (
    <div>
      <Navbar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        cartCount={totalCount}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {searchQueryParam
              ? `Search Results for "${searchQueryParam}"`
              : activeCategory === 'Home'
              ? 'All Stickers'
              : `${activeCategory} Stickers`}
          </h1>
          <span className="text-xs font-medium text-gray-500">
            Showing {stickers.length} items
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200/80 shadow-sm max-w-lg mx-auto my-8">
            <span className="text-4xl mb-2 block">📭</span>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              No Stickers Available
            </h3>
            <p className="text-xs text-gray-500">
              There are currently no active in-stock stickers matching this view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {stickers.map((sticker) => (
              <StickerCard key={sticker.id} sticker={sticker} />
            ))}
          </div>
        )}

        {activeCategory === 'Home' && !searchQueryParam && (
          <div className="mt-16 border-t border-gray-200/80 pt-12">
            <ReviewsAndProofs />
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        }
      >
        <StorefrontContent />
      </Suspense>
      <Footer />
    </div>
  );
}