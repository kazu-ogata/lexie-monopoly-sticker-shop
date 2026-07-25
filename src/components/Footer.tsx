'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface FooterProps {
  isMinimal?: boolean;
}

export default function Footer({ isMinimal = false }: FooterProps) {
  const [showFAQ, setShowFAQ] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const faqItems = [
    {
      question: 'What payment methods do you accept?',
      answer: (
        <span>
          We accept a variety of secure digital payment options at checkout, including{' '}
          <strong>PayPal</strong>, <strong>Cash App</strong>, <strong>Apple Pay</strong>,{' '}
          <strong>Venmo</strong>, and <strong>Chime</strong>.
        </span>
      ),
    },
    {
      question: 'How long does it take to receive my stickers?',
      answer: (
        <span>
          Delivery usually takes between <strong>15 to 30 minutes</strong>. If your stickers haven’t arrived within this timeframe, please reach out to us immediately at{' '}
          <a href="mailto:support@lexiestickers.com" className="underline font-bold text-gray-900">support@lexiestickers.com</a> so we can look into it right away.
        </span>
      ),
    },
    {
      question: 'How do I make a purchase?',
      answer: (
        <span>
          Simply click on the sticker you need and select <strong>Buy Now</strong> or <strong>Add to Cart</strong>. During checkout, you will be prompted to fill in your <strong>In-Game Name (IGN)</strong> and your <strong>Monopoly Go Invite Link</strong> so we know exactly where to send your sticker.
        </span>
      ),
    },
    {
      question: 'How do I find my Monopoly Go invite link?',
      answer: (
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Launch Monopoly Go and tap the <strong>Friends</strong> icon in the bottom right corner.</li>
          <li>Select the <strong>Invite</strong> option.</li>
          <li>Tap the <strong>yellow Invite button</strong> and choose <strong>Copy</strong> to save the link to your clipboard.</li>
          <li><em>Paste the link directly into the required field at checkout. Please use the copy-paste method instead of typing it out manually to avoid delivery errors!</em></li>
        </ol>
      ),
    },
  ];

  const handleToggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          email: contactEmail.trim(),
          message: contactMessage.trim(),
          status: 'unread',
        },
      ]);

      if (error) throw error;

      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setContactEmail('');
        setContactMessage('');
        setShowContact(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending contact message:', err);
      alert('Failed to send message. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.location.href = '/';
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const renderFAQModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowFAQ(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          ✕
        </button>
        <h3 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-6">
          Frequently Asked Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-[#F8C8DC]/40 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 self-start shadow-sm"
              >
                <button
                  onClick={() => handleToggleFaq(index)}
                  className="w-full p-4 flex justify-between items-center text-xs md:text-sm font-bold text-gray-900 text-left hover:bg-[#F8C8DC]/70 transition-colors cursor-pointer"
                >
                  <span className="pr-2">{item.question}</span>
                  <span className="text-gray-900 font-bold transition-transform duration-200">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-800 border-t border-gray-400/50 leading-relaxed bg-white/70">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* FLOATING CHAT WIDGET CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Pop-up Chat Box */}
        {showContact && (
          <div className="mb-3 w-80 sm:w-96 bg-[#FFC0CB] border border-pink-300 rounded-2xl shadow-2xl p-5 space-y-4 text-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="flex justify-between items-center border-b border-pink-300/80 pb-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Lexie Stickers Support</h3>
                <p className="text-[10px] text-gray-700">We usually reply via your account profile!</p>
              </div>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-700 hover:text-black font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center bg-pink-200 hover:bg-pink-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-500 text-white p-4 rounded-xl text-center text-xs font-bold">
                ✓ Message sent successfully! Check your profile for admin replies.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-800 block mb-1">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sample@email.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl outline-none text-gray-800 focus:ring-2 focus:ring-pink-500 border border-pink-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-800 block mb-1">
                    Your Message <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="How can we help you?"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-white text-xs px-3 py-2 rounded-xl outline-none text-gray-800 focus:ring-2 focus:ring-pink-500 border border-pink-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#EC4899] hover:bg-pink-600 text-white text-xs font-extrabold py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}

            <div className="pt-1 text-[10px] text-gray-700 text-center border-t border-pink-300/50">
              Direct Email:{' '}
              <a
                href="mailto:support@lexiestickers.com?subject=Support%20Inquiry"
                className="font-bold text-gray-900 hover:text-pink-700 underline"
              >
                support@lexiestickers.com
              </a>
            </div>
          </div>
        )}

        {/* Floating Bubble Toggle Button */}
        <button
          onClick={() => setShowContact(!showContact)}
          aria-label="Toggle Support Chat"
          className="bg-[#EC4899] hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-transform hover:scale-110 cursor-pointer border-2 border-white"
        >
          {showContact ? '✕' : '💬'}
        </button>
      </div>

      {/* Minimal Footer */}
      {isMinimal ? (
        <footer className="w-full bg-[#FFB6C1] py-4 px-8 border-t border-pink-300/80 mt-16">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-gray-700 font-medium">
            <div>© 2026 Lexie Stickers. All rights reserved.</div>

            <div className="flex items-center space-x-12">
              <button onClick={() => setShowFAQ(true)} className="hover:underline cursor-pointer">
                FAQ
              </button>
              <Link href="/terms" className="hover:underline">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      ) : (
        /* Full Main Footer */
        <footer className="w-full bg-[#FFB6C1] mt-16 border-t border-pink-300/80">
          <div className="max-w-7xl mx-auto px-6 pt-8 pb-4 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center justify-center md:justify-start h-10 overflow-visible">
              <Link href="/" onClick={handleLogoClick} className="cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Lexie Stickers"
                  className="h-16 w-auto object-contain scale-[1.8] transform origin-center transition-transform hover:scale-[1.9]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Link>
            </div>

            {/* Center: Navigation Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-gray-800">
              <button onClick={() => scrollToSection('top')} className="hover:text-black transition-colors cursor-pointer">
                Products
              </button>
              <button onClick={() => scrollToSection('reviews')} className="hover:text-black transition-colors cursor-pointer">
                Reviews &amp; Proofs
              </button>
              <button onClick={() => setShowContact(true)} className="hover:text-black transition-colors cursor-pointer">
                Contact
              </button>
              <button onClick={() => setShowFAQ(true)} className="hover:text-black transition-colors cursor-pointer">
                FAQ
              </button>
              <Link href="/terms" className="hover:text-black transition-colors">
                Terms
              </Link>
            </nav>

            {/* Right: Payment Icons + Facebook Link */}
            <div className="flex items-center justify-center space-x-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/paypal.png" alt="PayPal" className="h-6 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/cashapp.png" alt="Cash App" className="h-8 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/applepay.png" alt="Apple Pay" className="h-7 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/venmo.png" alt="Venmo" className="h-6 w-auto object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/chime.png" alt="Chime" className="h-6 w-auto object-contain" />

              {/* Facebook Icon placed next to payment methods */}
              <a
                href="https://www.facebook.com/lexie.stickers"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page"
                className="text-[#1877F2] bg-white p-1 rounded-full hover:scale-110 transition-transform shadow-sm flex items-center justify-center ml-2"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="border-t border-pink-300/60 py-3 text-center text-xs text-gray-700 font-medium">
            © 2026 Lexie Stickers. All rights reserved.
          </div>
        </footer>
      )}

      {showFAQ && renderFAQModal()}
    </>
  );
}