'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { createClient } from '../lib/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  ign?: string;
  inviteLink?: string;
}

interface Order {
  id: string;
  created_at: string;
  buyer_email: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export default function ProfilePage() {
  const router = useRouter();
  const { totalCount } = useCart();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'support'>('orders');

  // Account State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Support Chat State
  const [supportMessage, setSupportMessage] = useState('');
  const [chatSent, setChatSent] = useState(false);

  useEffect(() => {
    async function loadUserDataAndOrders() {
      setLoadingOrders(true);
      const supabase = createClient();

      // 1. Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not logged in -> send to login page
        router.push('/login');
        return;
      }

      setEmail(user.email || '');
      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'User');

      // 2. Fetch orders specific to this logged in user
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_email', user.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
      } else {
        setOrders(data || []);
      }
      setLoadingOrders(false);
    }

    loadUserDataAndOrders();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    const supabase = createClient();

    try {
      // Update metadata (username)
      const { error: updateError } = await supabase.auth.updateUser({
        data: { username },
      });

      if (updateError) throw updateError;

      // If new password field is filled, update password
      if (newPassword.trim()) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passError) throw passError;
        setNewPassword('');
        setCurrentPassword('');
      }

      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setChatSent(true);
    setSupportMessage('');
    setTimeout(() => setChatSent(false), 4000);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="bg-green-100 text-green-700 font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase">
            ✓ Completed
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-100 text-blue-700 font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase">
            ⏳ Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-600 font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase">
            ✕ Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-700 font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase">
            🕒 Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-[1200px] mx-auto px-6 py-10 md:px-12">
          {/* Page Heading */}
          <div className="border-b border-gray-200 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold text-[#EC4899] tracking-tight">
              My Account
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your profile credentials, track sticker orders, and reach support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar Navigation */}
            <div className="lg:col-span-3 bg-[#F9F9FB] border border-gray-200/80 rounded-2xl p-4 space-y-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'orders'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>📦 Order History</span>
                <span className="text-[10px] opacity-80">{orders.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'profile'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>👤 Profile & Password</span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'support'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>💬 Live Support & Chat</span>
              </button>

              <div className="pt-4 border-t border-gray-200/80">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  🚪 Log Out
                </button>
              </div>
            </div>

            {/* Right Main Panel */}
            <div className="lg:col-span-9 bg-white border border-gray-200/80 rounded-2xl p-6 md:p-8">
              
              {/* TAB 1: ORDER HISTORY */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-extrabold text-black">Order History</h2>
                    <p className="text-xs text-gray-500">Track and view past sticker transactions.</p>
                  </div>

                  {loadingOrders ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                      <p className="text-xs text-gray-400 mt-3">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <span className="text-4xl block">📦</span>
                      <p className="text-sm font-bold text-gray-700">No orders found</p>
                      <p className="text-xs text-gray-400">You haven't purchased any stickers yet.</p>
                      <button
                        onClick={() => router.push('/')}
                        className="mt-2 bg-[#EC4899] text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-pink-600 transition-colors"
                      >
                        Browse Store
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-xl p-5 space-y-4 hover:border-pink-300 transition-colors bg-[#F9F9FB]/50"
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-200/60 pb-3 text-xs">
                            <div>
                              <span className="font-extrabold text-black uppercase">
                                Order #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-gray-400 text-[10px] block">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(order.status)}
                              <span className="font-black text-black text-sm">
                                ${Number(order.total_amount).toFixed(2)} USD
                              </span>
                            </div>
                          </div>

                          {/* Purchased Items List */}
                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-xs py-1 text-gray-700"
                              >
                                <div>
                                  <span className="font-bold text-black uppercase">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-500 text-[11px] ml-2">
                                    x{item.quantity}
                                  </span>
                                  {item.ign && (
                                    <p className="text-[10px] text-gray-400">
                                      Delivered to IGN: <span className="text-gray-700 font-semibold">{item.ign}</span>
                                    </p>
                                  )}
                                </div>
                                <span className="font-bold text-gray-900">
                                  ${(Number(item.price) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PROFILE & CREDENTIALS */}
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-extrabold text-black">Profile Information</h2>
                    <p className="text-xs text-gray-500">Update your username, email, and security password.</p>
                  </div>

                  {profileSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 font-bold text-xs p-3 rounded-xl">
                      ✓ {profileSuccess}
                    </div>
                  )}

                  {profileError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs p-3 rounded-xl">
                      ⚠️ {profileError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Username / Nickname
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#E5E7EB]/50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full bg-[#E5E7EB]/80 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                    <h3 className="text-sm font-extrabold text-black">Change Password</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#E5E7EB]/50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: LIVE CHAT & SUPPORT */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-extrabold text-black">Live Chat &amp; Support</h2>
                    <p className="text-xs text-gray-500">
                      Need help with a sticker order or delivery delay? Send us a quick message!
                    </p>
                  </div>

                  <div className="bg-[#F9F9FB] border border-gray-200/80 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-extrabold text-black">Support Team is Online</span>
                      <span>(Average response time: &lt; 5 mins)</span>
                    </div>

                    {chatSent && (
                      <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold p-3 rounded-xl">
                        ✓ Support ticket created! Our team will reply to your email shortly.
                      </div>
                    )}

                    <form onSubmit={handleSendSupport} className="space-y-3">
                      <textarea
                        rows={4}
                        required
                        placeholder="Describe your issue or include your order number..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <button
                        type="submit"
                        className="bg-[#EC4899] hover:bg-[#db2777] text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Send Message
                      </button>
                    </form>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 pt-2">
                    <p>
                      Direct Email Support: <strong>support@lexiestickers.com</strong>
                    </p>
                    <p>Operating Hours: 24/7 Priority Delivery &amp; Support</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      <Footer isMinimal={true} />
    </div>
  );
}