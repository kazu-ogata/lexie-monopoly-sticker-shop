'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { createClient } from '../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/profile';

  const { totalCount } = useCart();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const supabase = createClient();

    try {
      if (isForgotPassword) {
        // Reset Password Flow
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/profile`,
        });
        if (error) throw error;

        setSuccessMessage('Password reset link sent! Please check your email inbox.');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Sign Up Flow
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (error) throw error;
      } else {
        // Log In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      setLoading(false);
      // Redirect back to Checkout (or Profile) automatically
      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your details.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <Navbar hideSubNav={true} cartCount={totalCount} />

      <main className="max-w-md w-full mx-auto px-6 py-4 flex-1 flex flex-col justify-center">
        <div className="bg-[#F9F9FB] border border-gray-200/80 rounded-2xl p-7 space-y-5 shadow-xs">
          
          {/* Card Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-[#EC4899] tracking-tight">
              {isForgotPassword
                ? 'Reset Your Password'
                : isSignUp
                ? 'Create an Account'
                : 'Welcome Back'}
            </h1>
            <p className="text-xs text-gray-500">
              {isForgotPassword
                ? 'Enter your account email to receive a password recovery link'
                : isSignUp
                ? 'Sign up to track your sticker orders and manage your account'
                : 'Log in to access your profile and order history'}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs p-3 rounded-xl text-center">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 font-bold text-xs p-3 rounded-xl text-center">
              ✓ {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username Input (Sign Up Only) */}
            {isSignUp && !isForgotPassword && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Username / Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LexieFan123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Password Input (Hidden in Forgot Password mode) */}
            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] font-semibold text-[#EC4899] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold py-3 rounded-xl transition-colors text-xs tracking-wider uppercase cursor-pointer shadow-sm mt-1"
            >
              {loading
                ? 'Processing...'
                : isForgotPassword
                ? 'Send Reset Link'
                : isSignUp
                ? 'Sign Up'
                : 'Log In'}
            </button>
          </form>

          {/* Bottom View Switchers */}
          <div className="text-center pt-2 border-t border-gray-200/80 space-y-2">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs font-semibold text-gray-600 hover:text-[#EC4899] transition-colors cursor-pointer"
              >
                ← Back to Log In
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs font-semibold text-gray-600 hover:text-[#EC4899] transition-colors cursor-pointer"
              >
                {isSignUp
                  ? 'Already have an account? Log In'
                  : "Don't have an account? Sign Up"}
              </button>
            )}
          </div>

        </div>
      </main>

      <Footer isMinimal={true} />
    </div>
  );
}