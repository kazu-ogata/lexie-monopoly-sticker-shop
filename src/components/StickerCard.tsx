'use client';

import Link from 'next/link';
import { Sticker } from '@/types/sticker';

interface StickerCardProps {
  sticker: Sticker;
}

export default function StickerCard({ sticker }: StickerCardProps) {
  const starCount = parseInt(sticker.rarity || '6', 10) || 6;

  // Helper to position and rotate stars in an arch format (like the reference images)
  const getStarStyle = (index: number, total: number) => {
    if (total === 1) return { transform: 'translate(0px, 0px) rotate(0deg)' };

    const center = (total - 1) / 2;
    const offset = index - center; // distance from center
    
    // Adjust spacing (X), arch depth (Y curve), and fan rotation (deg) based on total star count
    const spacing = total >= 5 ? 12 : 14;
    const x = offset * spacing;
    const y = Math.pow(Math.abs(offset), 1.5) * (total >= 5 ? 2.5 : 1.8); 
    const rotation = offset * (total >= 5 ? 7 : 9);

    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      zIndex: total - Math.abs(Math.round(offset)), // Ensures center stars overlap correctly
    };
  };

  return (
    <Link
      href={`/product/${sticker.id}`}
      className="group bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-pink-300 transition-all duration-200 flex flex-col justify-between cursor-pointer w-full h-full"
    >
      {/* Card Image / Holder Box */}
      <div className="w-full bg-[#FFC0CB]/35 rounded-xl aspect-[4/5] flex flex-col items-center justify-between p-2 mb-3 overflow-visible relative border border-pink-200/50 group-hover:scale-[1.02] transition-transform duration-200">
        
        {/* Curved Star Arch Container */}
        <div className="absolute -top-3 left-0 right-0 flex justify-center items-center pointer-events-none">
          <div className="flex items-center justify-center relative">
            {Array.from({ length: starCount }).map((_, i) => (
              <span
                key={i}
                style={getStarStyle(i, starCount)}
                className="absolute text-base md:text-lg text-yellow-400 drop-shadow-[0_1.5px_1px_rgba(0,0,0,0.25)] transition-all"
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        {/* Spacer to push image down slightly away from the arch */}
        <div className="h-4"></div>

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