'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  username: string;
  rating: number;
  created_at: string;
  order_info: string;
  comment: string;
  admin_reply?: string;
  admin_reply_at?: string;
}

interface Proof {
  id: string;
  image_url?: string;
}

// Skeleton loader for Reviews tab
function ReviewGridSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 h-32 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/5" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function ProofGridSkeleton() {
  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-start animate-pulse">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl h-32 p-3 flex flex-col items-center justify-center">
          <div className="w-full h-full bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function ReviewsAndProofs() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'proofs'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  
  const reviewItemsPerPage = 12;
  const proofItemsPerPage = 18;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      if (activeTab === 'reviews') {
        const { data } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        setReviews(data || []);
      } else {
        const { data } = await supabase
          .from('proofs')
          .select('*')
          .order('created_at', { ascending: false });
        setProofs(data || []);
      }
      setLoading(false);
    }

    fetchData();
  }, [activeTab]);

  const currentLimit = activeTab === 'reviews' ? reviewItemsPerPage : proofItemsPerPage;
  const currentItems = activeTab === 'reviews' ? reviews : proofs;
  
  const totalPages = Math.ceil(currentItems.length / currentLimit) || 1;
  const indexOfLastItem = currentPage * currentLimit;
  const indexOfFirstItem = indexOfLastItem - currentLimit;

  const paginatedReviews = reviews.slice(indexOfFirstItem, indexOfLastItem);
  const paginatedProofs = proofs.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <section id="reviews" className="w-full max-w-7xl mx-auto px-4 pt-6 pb-2 space-y-4">
      {/* 1. Tab Switcher Pills */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-200/80 p-1 rounded-full flex space-x-1 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('reviews');
              setCurrentPage(1);
            }}
            className={`px-8 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#FFB6C1] text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => {
              setActiveTab('proofs');
              setCurrentPage(1);
            }}
            className={`px-8 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'proofs'
                ? 'bg-[#FFB6C1] text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Proofs
          </button>
        </div>
      </div>

      {/* 2. Grid Display Area */}
      <div className="w-full min-h-0">
        {loading ? (
          activeTab === 'reviews' ? <ReviewGridSkeleton /> : <ProofGridSkeleton />
        ) : activeTab === 'reviews' ? (
          paginatedReviews.length === 0 ? (
            <div className="w-full text-center py-8 space-y-2">
              <span className="text-4xl block">💬</span>
              <p className="text-sm font-bold text-gray-700">No Reviews Yet</p>
              <p className="text-xs text-gray-400">
                Customer feedback will be displayed here after completed orders!
              </p>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
              {paginatedReviews.map((review) => (
                <div
                  key={review.id}
                  className="group relative bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between h-32 hover:border-pink-300 transition-all overflow-hidden cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-800 tracking-wider">
                        {review.username}
                      </span>
                      {review.admin_reply && (
                        <span className="text-[10px] bg-pink-100 text-[#EC4899] font-black px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                          <span>Replied</span>
                        </span>
                      )}
                    </div>
                    <div className="text-pink-500 text-xs">
                      {'⭐'.repeat(review.rating)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()} | {review.order_info}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 pt-1 leading-relaxed line-clamp-2">
                      &quot;{review.comment}&quot;
                    </p>
                  </div>

                  {review.admin_reply && (
                    <div className="absolute inset-0 bg-pink-50/95 border border-pink-300 rounded-2xl p-3.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 backdrop-blur-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#EC4899] uppercase tracking-wider block border-b border-pink-200/80 pb-1">
                          LEXIE STICKER ADMIN
                        </span>
                        <p className="text-xs text-gray-800 font-semibold italic pt-1 leading-relaxed line-clamp-3">
                          &quot;{review.admin_reply}&quot;
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : paginatedProofs.length === 0 ? (
          <div className="w-full text-center py-8 space-y-2">
            <span className="text-4xl block">📸</span>
            <p className="text-sm font-bold text-gray-700">No Delivery Proofs Uploaded</p>
            <p className="text-xs text-gray-400">Proof screenshots will be visible here.</p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-start">
            {paginatedProofs.map((proof) => (
              <div
                key={proof.id}
                className="bg-white border border-gray-200 rounded-2xl h-32 flex flex-col items-center justify-center shadow-xs p-3 hover:scale-105 hover:border-pink-300 transition-all overflow-hidden"
              >
                {proof.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={proof.image_url}
                    alt="Delivery Proof"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <span className="text-xs text-gray-400 font-bold">Image Missing</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white font-bold text-xs flex items-center justify-center hover:bg-pink-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
          >
            &lt;
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#FFB6C1] border-pink-300 text-gray-900 font-extrabold shadow-xs'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-full border border-gray-300 bg-white font-bold text-xs flex items-center justify-center hover:bg-pink-50 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
          >
            &gt;
          </button>
        </div>
      )}
    </section>
  );
}