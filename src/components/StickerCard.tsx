'use client';

import Link from 'next/link';
import { Sticker } from '@/types/sticker';

interface StickerCardProps {
  sticker: Sticker;
}

export default function StickerCard({ sticker }: StickerCardProps) {
  return (
    <Link
      href={`/product/${sticker.id}`}
      className="group bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-200 flex flex-col justify-between cursor-pointer w-full h-full"
    >
      {/* Card Image Box */}
      <div className="w-full bg-[#FFC0CB]/30 rounded-xl aspect-[4/5] flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:scale-[1.02] transition-transform duration-200 border border-pink-200/50">
        {sticker.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={sticker.image_url}
            alt={sticker.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-center text-pink-400/90 font-bold text-xs tracking-wide">
            Card Image
          </span>
        )}
      </div>

      {/* Card Name and Price */}
      <div className="text-center space-y-1">
        <h3 className="font-bold text-xs md:text-sm text-gray-800 line-clamp-1 group-hover:text-pink-600 transition-colors">
          {sticker.name}
        </h3>
        <p className="font-extrabold text-xs md:text-sm text-gray-900">
          ${Number(sticker.price).toFixed(2)} USD
        </p>
      </div>
    </Link>
  );
}