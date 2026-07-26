'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';

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
  user_id?: string;
  buyer_email: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  has_reviewed?: boolean;
  admin_message?: string;
  user_reply?: string;
}

interface ContactMessage {
  id: string;
  email: string;
  message: string;
  admin_reply?: string;
  admin_reply_at?: string;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { totalCount } = useCart();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'support'>('orders');

  // Account State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Per-Order Chat Modal State for User
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [userReplyText, setUserReplyText] = useState('');
  const [sendingUserReply, setSendingUserReply] = useState(false);

  // Support Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Review Modal State
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    async function loadUserDataAndOrders() {
      setLoadingOrders(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const userEmail = user.email || '';
      setEmail(userEmail);
      const userDisplayName = user.user_metadata?.username || userEmail.split('@')[0] || 'Customer';
      setUsername(userDisplayName);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${user.id},buyer_email.eq.${userEmail}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
      } else {
        setOrders(data || []);
      }
      setLoadingOrders(false);

      if (userEmail) {
        setLoadingMessages(true);
        const { data: msgData } = await supabase
          .from('contact_messages')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false });
        setMessages(msgData || []);
        setLoadingMessages(false);
      }
    }

    loadUserDataAndOrders();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsUpdating(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        data: { username },
      });

      if (updateError) throw updateError;

      if (newPassword.trim()) {
        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passError) throw passError;
        setNewPassword('');
      }

      setProfileSuccess('Profile details updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const message = err instanceof Error ? err.message : 'Failed to update profile details.';
      setProfileError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResetPasswordEmail = async () => {
    setProfileSuccess('');
    setProfileError('');
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });

      if (error) throw error;

      setProfileSuccess(`Password reset email sent to ${email}!`);
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err: unknown) {
      console.error('Error sending reset email:', err);
      const message = err instanceof Error ? err.message : 'Failed to send reset email.';
      setProfileError(message);
    }
  };

  const handleSendOrderReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatOrder || !userReplyText.trim()) return;

    setSendingUserReply(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('orders')
        .update({ user_reply: userReplyText.trim() })
        .eq('id', chatOrder.id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === chatOrder.id ? { ...o, user_reply: userReplyText.trim() } : o))
      );
      setChatOrder(null);
      setUserReplyText('');
      showToast('Reply sent to admin successfully!');
    } catch (err) {
      console.error('Error sending reply to admin:', err);
      showToast('Failed to send reply.', 'error');
    } finally {
      setSendingUserReply(false);
    }
  };

  const handleSendUserFollowup = async (msgId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    const supabase = createClient();

    const currentMsg = messages.find(m => m.id === msgId);
    const updatedMessageText = `${currentMsg?.message}\n\n[User Follow-up]: ${replyText.trim()}`;

    const { error } = await supabase
      .from('contact_messages')
      .update({ message: updatedMessageText, status: 'unread' })
      .eq('id', msgId);

    if (error) {
      console.error('Error sending follow-up:', error);
      showToast('Failed to send message.', 'error');
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, message: updatedMessageText, status: 'unread' } : m))
      );
      setReplyText('');
      showToast('Follow-up sent successfully!');
    }
    setSubmittingReply(false);
  };

  const markOrderReviewed = async (orderId: string) => {
    const supabase = createClient();
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, has_reviewed: true } : o))
    );

    const { error } = await supabase
      .from('orders')
      .update({ has_reviewed: true })
      .eq('id', orderId);

    if (error) {
      console.error('Failed to update has_reviewed in DB:', error);
    }
  };

  const handleSkipReview = async () => {
    if (selectedOrderForReview) {
      await markOrderReviewed(selectedOrderForReview.id);
      setSelectedOrderForReview(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForReview || !comment.trim()) return;

    setIsSubmittingReview(true);
    const supabase = createClient();

    try {
      let proofPublicUrl = '';

      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sticker-images')
          .upload(filePath, proofFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('sticker-images')
            .getPublicUrl(filePath);
          proofPublicUrl = urlData.publicUrl;
        }
      }

      const orderSummaryText =
        selectedOrderForReview.items
          ?.map((item) => `${item.quantity}x ${item.name}`)
          .join(', ') || 'Sticker Purchase';

      const { error: reviewError } = await supabase.from('reviews').insert([
        {
          username: username || 'Verified Buyer',
          rating,
          order_info: orderSummaryText,
          comment: comment.trim(),
        },
      ]);

      if (reviewError) throw reviewError;

      if (proofPublicUrl) {
        await supabase.from('proofs').insert([
          {
            image_url: proofPublicUrl,
            caption: '',
          },
        ]);
      }

      await markOrderReviewed(selectedOrderForReview.id);

      setReviewSuccess(true);
      setTimeout(() => {
        setReviewSuccess(false);
        setSelectedOrderForReview(null);
        setComment('');
        setProofFile(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit review:', err);
      showToast('Failed to submit review. Please try again.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
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
    <div className="min-h-screen bg-white flex flex-col justify-between font-sans text-gray-900 relative">
      {/* Centered Modal Toast Notification */}
      {toast && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-pink-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto text-xl font-black ${
              toast.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-pink-100 text-[#EC4899]'
            }`}>
              {toast.type === 'error' ? '⚠️' : '✨'}
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {toast.type === 'error' ? 'Notice' : 'Success'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="w-full bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm uppercase tracking-wider"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div>
        <Navbar hideSubNav={true} cartCount={totalCount} />

        <main className="max-w-[1200px] mx-auto px-6 py-10 md:px-12">
          <div className="border-b border-gray-200 pb-6 mb-8">
            <h1 className="text-3xl font-extrabold text-[#EC4899] tracking-tight">
              My Account
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage your profile credentials, track orders, and view support messages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar */}
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
                <span>👤 Profile &amp; Password</span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === 'support'
                    ? 'bg-[#EC4899] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>💬 Support Messages</span>
                <span className="text-[10px] opacity-80">{messages.length}</span>
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

            {/* Main Content Pane */}
            <div className="lg:col-span-9 bg-white border border-gray-200/80 rounded-2xl p-6 md:p-8">
              {/* ORDER HISTORY TAB */}
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
                      <button
                        onClick={() => router.push('/')}
                        className="mt-2 bg-[#EC4899] text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-pink-600 transition-colors cursor-pointer"
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
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              {/* Order Chat Button positioned right next to order status */}
                              <button
                                onClick={() => {
                                  setChatOrder(order);
                                  setUserReplyText(order.user_reply || '');
                                }}
                                className={`font-bold text-xs px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center space-x-1 ${
                                  order.admin_message && !order.user_reply
                                    ? 'bg-pink-100 text-[#EC4899] border-pink-300 animate-pulse'
                                    : 'bg-white hover:bg-pink-50 text-gray-700 border-gray-300'
                                }`}
                              >
                                <span>💬 {order.admin_message ? 'Admin Message' : 'Order Chat'}</span>
                              </button>

                              {getStatusBadge(order.status)}
                              <span className="font-black text-black text-sm">
                                ${Number(order.total_amount).toFixed(2)} USD
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs py-1 text-gray-700">
                                <div>
                                  <span className="font-bold text-black uppercase">{item.name}</span>
                                  <span className="text-gray-500 text-[11px] ml-2">x{item.quantity}</span>
                                </div>
                                <span className="font-bold text-gray-900">
                                  ${(Number(item.price) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.status === 'completed' && !order.has_reviewed && (
                            <div className="pt-2 border-t border-gray-100 flex justify-end">
                              <button
                                onClick={() => setSelectedOrderForReview(order)}
                                className="bg-[#EC4899] text-white hover:bg-pink-600 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                              >
                                ⭐ Leave Review / Proof
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPORT MESSAGES TAB */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-extrabold text-black">Support Messages &amp; Inquiries</h2>
                    <p className="text-xs text-gray-500">View your general contact messages and admin responses.</p>
                  </div>

                  {loadingMessages ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <span className="text-4xl block">💬</span>
                      <p className="text-sm font-bold text-gray-700">No support messages found</p>
                      <p className="text-xs text-gray-400">Use the Contact form in the footer if you need help!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="border border-gray-200 rounded-2xl p-5 space-y-3 bg-[#F9F9FB]/50">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-semibold">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              msg.status === 'replied' ? 'bg-green-100 text-green-700' : msg.status === 'closed' ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {msg.status}
                            </span>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800">
                            <span className="font-bold text-gray-500 block text-[10px] mb-1">Your Message:</span>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>

                          {msg.admin_reply && (
                            <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-xs space-y-1">
                              <span className="text-[#EC4899] font-black block">Lexie Sticker Admin:</span>
                              <p className="text-gray-700 italic">{msg.admin_reply}</p>
                            </div>
                          )}

                          {msg.status === 'closed' ? (
                            <div className="pt-2 border-t border-gray-200 text-center text-xs font-bold text-gray-500 bg-gray-100 p-3 rounded-xl">
                              🔒 This support conversation has been closed.
                            </div>
                          ) : (
                            <div className="pt-2">
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  placeholder="Type a reply or follow-up..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-pink-500"
                                />
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    disabled={submittingReply}
                                    onClick={() => handleSendUserFollowup(msg.id)}
                                    className="bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold px-4 py-1.5 rounded-xl text-xs cursor-pointer shadow-xs"
                                  >
                                    {submittingReply ? 'Sending...' : 'Send Follow-up'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EDITABLE PROFILE & PASSWORD TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-extrabold text-black">Profile Information</h2>
                      <p className="text-xs text-gray-500">Update your account username, email, and password settings.</p>
                    </div>

                    {!isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1"
                      >
                        <span>✏️ Edit Profile</span>
                      </button>
                    )}
                  </div>

                  {profileSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3.5 rounded-xl font-bold">
                      ✓ {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3.5 rounded-xl font-bold">
                      ⚠️ {profileError}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Username */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Username / Nickname
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isEditingProfile}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none transition-colors ${
                            isEditingProfile
                              ? 'bg-white border-pink-300 focus:ring-2 focus:ring-pink-500'
                              : 'bg-[#F9F9FB] border-gray-200 text-gray-600 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          disabled={!isEditingProfile}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none transition-colors ${
                            isEditingProfile
                              ? 'bg-white border-pink-300 focus:ring-2 focus:ring-pink-500'
                              : 'bg-[#F9F9FB] border-gray-200 text-gray-600 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>

                    {/* New Password Input (When Editing) */}
                    {isEditingProfile && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Change Password (Optional)
                        </label>
                        <input
                          type="password"
                          placeholder="Type new password..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white border border-pink-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          Leave empty if you don&apos;t want to change your current password.
                        </span>
                      </div>
                    )}

                    {/* Action Buttons when in Edit Mode */}
                    {isEditingProfile ? (
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setNewPassword('');
                            setProfileError('');
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs uppercase tracking-wider"
                        >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    ) : (
                      /* Standalone Reset Password Trigger Button */
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-gray-800">Need a Password Reset Link?</h4>
                          <p className="text-[11px] text-gray-400">Send a recovery link directly to your inbox.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendResetPasswordEmail}
                          className="bg-gray-100 hover:bg-pink-50 text-gray-700 hover:text-[#EC4899] border border-gray-200 hover:border-pink-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          🔐 Reset Password via Email
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer isMinimal={true} />

      {/* PER-ORDER CHAT MODAL FOR USER */}
      {chatOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-pink-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">Support Chat for Order #{chatOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setChatOrder(null)} className="text-gray-400 hover:text-black font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {chatOrder.admin_message ? (
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-[#EC4899] block">💬 Lexie Sticker Admin:</span>
                  <p className="text-gray-800 italic">{chatOrder.admin_message}</p>
                </div>
              ) : (
                <p className="text-gray-400 italic">No messages from admin for this order yet.</p>
              )}

              {chatOrder.user_reply && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-extrabold text-blue-700 block">Your Reply:</span>
                  <p className="text-gray-800">{chatOrder.user_reply}</p>
                </div>
              )}

              <form onSubmit={handleSendOrderReply} className="space-y-3 pt-2">
                <label className="block font-bold text-gray-700">Send Reply to Admin</label>
                <textarea
                  required
                  rows={3}
                  value={userReplyText}
                  onChange={(e) => setUserReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full bg-[#F9F9FB] border border-pink-200 rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-pink-500 resize-none"
                />
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setChatOrder(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 font-bold py-2 rounded-xl cursor-pointer">Close</button>
                  <button type="submit" disabled={sendingUserReply} className="flex-1 bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold py-2 rounded-xl cursor-pointer shadow-sm">
                    {sendingUserReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-pink-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">
                🎉 Leave Feedback &amp; Proof
              </h3>
              <button
                onClick={handleSkipReview}
                className="text-gray-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-xs font-bold">
                ✓ Thank you for your review! It is now live on our storefront.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex space-x-2 text-2xl cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => setRating(star)}
                        className={star <= rating ? 'text-amber-400' : 'text-gray-300'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Fast delivery, received my sticker in game! Highly recommend!"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl p-3 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Upload Screenshot Proof (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl p-2 text-xs text-gray-600 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#EC4899] file:text-white cursor-pointer"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSkipReview}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer shadow-sm uppercase tracking-wider"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}