'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

interface NavbarProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  cartCount?: number;
  hideSubNav?: boolean;
}

export default function Navbar({
  activeCategory = 'Home',
  onSelectCategory,
  cartCount = 0,
  hideSubNav = false,
}: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCategory, setSelectedSearchCategory] = useState('All');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const categories = [
    { label: 'Home', value: 'Home' },
    { label: '6 ⭐', value: '6 ★' },
    { label: '5 ⭐', value: '5 ★' },
    { label: '4 ⭐', value: '4 ★' },
    { label: '3 ⭐', value: '3 ★' },
    { label: '2 ⭐', value: '2 ★' },
    { label: '1 ⭐', value: '1 ★' },
  ];

  const searchCategories = ['All', '6★', '5★', '4★', '3★', '2★', '1★'];

  // Check user session & read admin role
  useEffect(() => {
    async function checkUserSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsLoggedIn(true);

        // Read JWT role injected by the hook OR check direct email
        const userRole = session.user.app_metadata?.user_role || session.user.user_metadata?.user_role;
        const isEmailAdmin = session.user.email === 'admin@email.com';

        if (userRole === 'admin' || isEmailAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    }
    checkUserSession();
  }, []);

  const handleLogoClick = () => {
    if (onSelectCategory) {
      onSelectCategory('Home');
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="w-full font-sans">
      {/* Top Pink Header Bar */}
      <div className="bg-[#FFB6C1] px-4 py-3 md:px-8 flex items-center justify-between shadow-sm">
        {/* Brand Logo - Clickable Home Link */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center h-10 overflow-visible cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Lexie Stickers Logo"
            className="h-16 w-auto object-contain scale-[1.8] transform origin-center hover:scale-[1.9] transition-transform"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="flex-1 max-w-md mx-4 hidden md:flex items-center bg-[#F4F4F5] rounded-md border border-gray-200 overflow-hidden px-2 py-1">
          <select
            value={selectedSearchCategory}
            onChange={(e) => setSelectedSearchCategory(e.target.value)}
            className="text-xs bg-transparent border-r border-gray-300 pr-2 py-1 outline-none text-gray-700 font-bold cursor-pointer"
          >
            {searchCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search Stickers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <button className="text-gray-500 hover:text-black px-2 cursor-pointer">🔍</button>
        </div>

        {/* Right Icons */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="flex md:hidden text-2xl text-gray-800 hover:text-black cursor-pointer p-1"
            aria-label="Toggle Search"
          >
            🔍
          </button>

          <Link href="/cart" className="relative p-1 text-gray-800 hover:text-black">
            <span className="text-2xl">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Dynamic Profile/Login Link */}
          <button
            onClick={handleProfileClick}
            className="p-1 text-gray-800 hover:text-black cursor-pointer"
            aria-label="User Profile"
          >
            <span className="text-2xl">👤</span>
          </button>

          {/* ⚙️ ADMIN BUTTON: ONLY VISIBLE TO admin@email.com */}
          {isAdmin && (
            <Link
              href="/admin"
              className="bg-black text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>⚙️ Admin</span>
            </Link>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showMobileSearch && (
        <div className="block md:hidden px-4 py-2 bg-[#FFB6C1] border-t border-pink-300">
          <div className="flex items-center bg-[#F4F4F5] rounded-md border border-gray-200 overflow-hidden px-2 py-1">
            <select
              value={selectedSearchCategory}
              onChange={(e) => setSelectedSearchCategory(e.target.value)}
              className="text-xs bg-transparent border-r border-gray-300 pr-1 py-1 outline-none text-gray-700 font-bold"
            >
              {searchCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search Stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
            <button className="text-gray-500 hover:text-black px-1.5">🔍</button>
          </div>
        </div>
      )}

      {/* Sub-Navbar Category Tabs */}
      {!hideSubNav && (
        <nav className="bg-white border-b border-pink-200 px-4 md:px-12 overflow-x-auto">
          <ul className="max-w-7xl mx-auto flex justify-between items-center text-sm font-bold text-gray-800 min-w-max">
            {categories.map((cat) => {
              const isActive =
                activeCategory === cat.value ||
                activeCategory.trim() === cat.label.replace('⭐', '★').trim();

              return (
                <li key={cat.value} className="flex-1 text-center">
                  <button
                    onClick={() => onSelectCategory && onSelectCategory(cat.value)}
                    className={`w-full py-3.5 transition-all relative inline-flex items-center justify-center space-x-1 cursor-pointer ${
                      isActive
                        ? 'text-black font-extrabold border-b-4 border-[#EC4899]'
                        : 'text-gray-700 hover:text-black border-b-4 border-transparent'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}