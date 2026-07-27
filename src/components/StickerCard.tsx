'use client';

import Link from 'next/link';
import { Sticker } from '@/types/sticker';

interface StickerCardProps {
  sticker: Sticker;
}

export default function StickerCard({ sticker }: StickerCardProps) {
  const starCount = parseInt(sticker.rarity || '6', 10) || 6;

  // Perfected arch layout math for 1 to 6 stars
  const getStarTransform = (index: number, total: number) => {
    if (total === 1) return { transform: 'translate(0px, 0px) rotate(0deg)' };

    const centerIndex = (total - 1) / 2;
    const offset = index - centerIndex;
    
    // Horizontal spacing and vertical arc curve drop-off
    const spacing = total >= 5 ? 13 : 15;
    const x = offset * spacing;
    const y = Math.pow(Math.abs(offset), 1.4) * 2.2; 
    const rotation = offset * 6;

    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      zIndex: total - Math.abs(Math.round(offset)),
    };
  };

  return (
    <Link
      href={`/product/${sticker.id}`}
      className="group bg-white rounded-2xl p-4 pt-5 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-200 flex flex-col justify-between cursor-pointer w-full h-full"
    >
      {/* Card Image / Holder Box with top margin to give stars breathing room */}
      <div className="w-full bg-[#FFC0CB]/35 rounded-xl aspect-[4/5] flex flex-col items-center justify-between p-2 mb-3 mt-2 overflow-visible relative border border-pink-200/50 group-hover:scale-[1.02] transition-transform duration-200">
        
        {/* Curved Star Arch Container anchored precisely to the top border */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-20">
          <div className="relative flex items-center justify-center">
            {Array.from({ length: starCount }).map((_, i) => (
              <span
                key={i}
                style={getStarTransform(i, starCount)}
                className="absolute text-base md:text-lg text-yellow-400 drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.35)] select-none"
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        {/* Top Spacer */}
        <div className="h-3"></div>

        {/* Sticker Image Container */}
        <div className="w-full flex-1 flex items-center justify-center p-1 overflow-hidden">
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