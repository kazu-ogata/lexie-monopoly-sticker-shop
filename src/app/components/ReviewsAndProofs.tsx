'use client';

import { useState } from 'react';

interface Review {
  id: number;
  username: string;
  rating: number;
  date: string;
  orderInfo: string;
  comment: string;
}

export default function ReviewsAndProofs() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'proofs'>('reviews');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  // Generates alternating mock reviews based on current page
  const getReviewsForPage = (page: number): Review[] => {
    const isEven = page % 2 === 0;
    return Array.from({ length: 12 }, (_, i) => ({
      id: page * 100 + i,
      username: isEven ? `BUYER_${page}_${i + 1}` : `USER_${page}_${i + 1}`,
      rating: isEven ? (i % 2 === 0 ? 5 : 4) : 5,
      date: `2026-07-${10 + (page % 10)} | ${10 + i}:${15 + i}`,
      orderInfo: isEven
        ? `Order: ${i + 1}x 5-star sticker`
        : `Order: 2x 6-star stickers`,
      comment: isEven
        ? 'Super fast transfer, highly recommended! 🌟'
        : 'Fast & Easy!! Received instantly!',
    }));
  };

  // Generates alternating mock proofs per page (18 cards = 6 cols x 3 rows)
  const getProofsForPage = (page: number) => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: page * 100 + i,
      text: page % 2 === 0 ? `ORDER #${page}0${i + 1} SENT!` : `STICKER SENT!`,
    }));
  };

  const reviews = getReviewsForPage(currentPage);
  const proofs = getProofsForPage(currentPage);

  // Fixed pagination bar logic with circular ellipsis rings
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];

    if (currentPage <= 4) {
      // Near start: 1, 2, 3, 4, 5, ..., 10
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= 7) {
      // Near end: 1, ..., 6, 7, 8, 9, 10
      pages.push(1, '...', 6, 7, 8, 9, totalPages);
    } else {
      // Middle pages (5, 6): 1, ..., prev, current, next, ..., 10
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages.map((page, idx) => (
      <button
        key={idx}
        onClick={() => typeof page === 'number' && setCurrentPage(page)}
        disabled={typeof page === 'string'}
        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors border border-gray-300 ${
          currentPage === page
            ? 'bg-[#FFB6C1] text-gray-900 border-pink-300 shadow-sm'
            : page === '...'
            ? 'text-gray-400 cursor-default bg-gray-50/50'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {page}
      </button>
    ));
  };

  return (
    <section id="reviews" className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Tab Switcher Pills */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-200/80 p-1 rounded-full flex space-x-1 shadow-inner">
          <button
            onClick={() => {
              setActiveTab('reviews');
              setCurrentPage(1);
            }}
            className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${
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
            className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === 'proofs'
                ? 'bg-[#FFB6C1] text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Proofs
          </button>
        </div>
      </div>

      {/* Main Grid Content Area with Identical Height Bounds */}
      <div className="min-h-[430px] flex items-center justify-center">
        {activeTab === 'reviews' ? (
          /* Reviews Grid: 4 columns x 3 rows */
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-32 hover:border-pink-300 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-800 tracking-wider">
                      {review.username}
                    </span>
                  </div>
                  <div className="text-pink-500 text-xs mt-1">
                    {'⭐'.repeat(review.rating)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {review.date} | {review.orderInfo}
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-800 mt-2 line-clamp-2">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          /* Proofs Grid: 6 columns x 3 rows with exact matching height (h-32) */
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="bg-white border border-gray-200 rounded-2xl h-32 flex items-center justify-center shadow-sm p-3 hover:scale-105 hover:border-pink-300 transition-all"
              >
                <span className="text-xs font-extrabold text-gray-800 tracking-tight text-center">
                  {proof.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked Bottom Pagination Bar */}
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          &lt;
        </button>

        {renderPaginationButtons()}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          &gt;
        </button>
      </div>
    </section>
  );
}