'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { Sticker } from '@/types/sticker';

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
  buyer_email?: string;
  ign?: string;
  invite_link?: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

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
  caption: string;
  created_at: string;
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'stickers' | 'feedback' | 'messages'>('overview');

  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Stickers State
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Reviews & Proofs State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // Manual Add Review/Proof Modal State
  const [showManualFeedbackModal, setShowManualFeedbackModal] = useState(false);
  const [manualType, setManualType] = useState<'review' | 'proof'>('proof');
  const [manualUsername, setManualUsername] = useState('');
  const [manualRating, setManualRating] = useState(5);
  const [manualComment, setManualComment] = useState('');
  const [manualCaption, setManualCaption] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Contact Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [replyingMsgId, setReplyingMsgId] = useState<string | null>(null);
  const [msgReplyText, setMsgReplyText] = useState('');
  const [sendingMsgReply, setSendingMsgReply] = useState(false);

  // Admin Reply Input State for Reviews
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Add Sticker Form State
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerPrice, setNewStickerPrice] = useState('');
  const [newStickerRarity, setNewStickerRarity] = useState('6-Star');
  const [newStickerStock, setNewStickerStock] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [addingSticker, setAddingSticker] = useState(false);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  const fetchStickers = async () => {
    setLoadingStickers(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stickers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stickers:', error);
    } else {
      setStickers(data || []);
    }
    setLoadingStickers(false);
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    const supabase = createClient();

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: proofsData } = await supabase
      .from('proofs')
      .select('*')
      .order('created_at', { ascending: false });

    setReviews(reviewsData || []);
    setProofs(proofsData || []);
    setLoadingFeedback(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoadingMessages(false);
  };

  useEffect(() => {
    async function initAdmin() {
      setLoadingAdminCheck(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setLoadingAdminCheck(false);
      fetchOrders();
      fetchStickers();
      fetchFeedback();
      fetchMessages();
    }

    initAdmin();
  }, [router]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrderId(orderId);
    const supabase = createClient();

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status.');
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      fetchStickers();
    }
    setUpdatingOrderId(null);
  };

  const handleAddSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please select an image file (JPG or PNG).');
      return;
    }

    setAddingSticker(true);
    const supabase = createClient();

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `stickers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sticker-images')
        .upload(filePath, imageFile);

      let publicImageUrl = '';
      if (uploadError) {
        console.warn('Storage bucket upload failed, using local fallback:', uploadError.message);
        publicImageUrl = URL.createObjectURL(imageFile);
      } else {
        const { data: urlData } = supabase.storage
          .from('sticker-images')
          .getPublicUrl(filePath);
        publicImageUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('stickers')
        .insert([
          {
            name: newStickerName.trim(),
            price: parseFloat(newStickerPrice) || 1.99,
            rarity: newStickerRarity,
            stock: parseInt(newStickerStock) || 0,
            image_url: publicImageUrl,
            is_active: true,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setStickers((prev) => [data[0], ...prev]);
        setShowAddModal(false);
        setNewStickerName('');
        setNewStickerPrice('');
        setNewStickerStock('10');
        setImageFile(null);
      }
    } catch (err: unknown) {
      console.error('Error adding sticker:', err);
      const message = err instanceof Error ? err.message : 'Failed to add sticker.';
      alert(message);
    } finally {
      setAddingSticker(false);
    }
  };

  const handleManualFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setSubmittingManual(true);

    try {
      if (manualType === 'review') {
        if (!manualUsername.trim() || !manualComment.trim()) {
          alert('Please fill in all review fields.');
          setSubmittingManual(false);
          return;
        }

        const { error } = await supabase.from('reviews').insert([
          {
            username: manualUsername.trim(),
            rating: manualRating,
            order_info: 'Social Media / Direct Customer',
            comment: manualComment.trim(),
          },
        ]);
        if (error) throw error;
      } else {
        if (!manualFile) {
          alert('Please upload a proof image.');
          setSubmittingManual(false);
          return;
        }

        const fileExt = manualFile.name.split('.').pop();
        const fileName = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sticker-images')
          .upload(filePath, manualFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('sticker-images')
          .getPublicUrl(filePath);

        const { error: proofError } = await supabase.from('proofs').insert([
          {
            image_url: urlData.publicUrl,
            caption: manualCaption.trim(),
          },
        ]);
        if (proofError) throw proofError;
      }

      setShowManualFeedbackModal(false);
      setManualUsername('');
      setManualComment('');
      setManualCaption('');
      setManualFile(null);
      fetchFeedback();
    } catch (err) {
      console.error('Error adding manual feedback:', err);
      alert('Failed to add. Please try again.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleUpdateStock = async (stickerId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, (currentStock || 0) + delta);
    const supabase = createClient();

    const { error } = await supabase
      .from('stickers')
      .update({ stock: newStock, is_active: newStock > 0 })
      .eq('id', stickerId);

    if (error) {
      console.error('Error updating stock:', error);
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === stickerId ? { ...s, stock: newStock, is_active: newStock > 0 } : s))
      );
    }
  };

  const handleToggleStickerActive = async (stickerId: string, currentStatus: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('stickers')
      .update({ is_active: !currentStatus })
      .eq('id', stickerId);

    if (error) {
      console.error('Error toggling sticker status:', error);
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === stickerId ? { ...s, is_active: !currentStatus } : s))
      );
    }
  };

  const handleRemoveSticker = async (stickerId: string) => {
    if (!confirm('Are you sure you want to permanently remove this sticker listing?')) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('stickers').delete().eq('id', stickerId);

    if (error) {
      console.error('Error removing sticker:', error);
      alert('Failed to remove sticker.');
    } else {
      setStickers((prev) => prev.filter((s) => s.id !== stickerId));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review.');
    } else {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  const handleSaveAdminReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('reviews')
      .update({
        admin_reply: replyText.trim(),
        admin_reply_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to save reply.');
    } else {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, admin_reply: replyText.trim(), admin_reply_at: new Date().toISOString() }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyText('');
    }
    setSubmittingReply(false);
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!confirm('Are you sure you want to delete this delivery proof screenshot?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('proofs').delete().eq('id', proofId);

    if (error) {
      console.error('Error deleting proof:', error);
      alert('Failed to delete proof.');
    } else {
      setProofs((prev) => prev.filter((p) => p.id !== proofId));
    }
  };

  const handleSendContactReply = async (msgId: string) => {
    if (!msgReplyText.trim()) return;
    setSendingMsgReply(true);
    const supabase = createClient();

    const { error } = await supabase.from('contact_messages').update({
      admin_reply: msgReplyText.trim(),
      admin_reply_at: new Date().toISOString(),
      status: 'replied'
    }).eq('id', msgId);

    if (error) {
      console.error('Error saving contact reply:', error);
      alert('Failed to save reply.');
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, admin_reply: msgReplyText.trim(), status: 'replied' } : m))
      );
      setReplyingMsgId(null);
      setMsgReplyText('');
    }
    setSendingMsgReply(false);
  };

  const handleUpdateMessageStatus = async (msgId: string, newStatus: string) => {
    const supabase = createClient();
    await supabase.from('contact_messages').update({ status: newStatus }).eq('id', msgId);
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, status: newStatus } : m)));
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this contact message?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('contact_messages').delete().eq('id', msgId);

    if (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message.');
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  };

  // CALCULATE DASHBOARD METRICS
  const totalRevenue = orders
    .filter((o) => o.status === 'completed' || o.status === 'processing')
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const unreadMessagesCount = messages.filter((m) => m.status === 'unread').length;
  const lowStockCount = stickers.filter((s) => (s.stock || 0) <= 3).length;

  if (loadingAdminCheck) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between font-sans">
        <Navbar hideSubNav={true} />
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
        </div>
        <Footer isMinimal={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col justify-between font-sans text-gray-900">
      <div>
        <Navbar hideSubNav={true} />

        <main className="max-w-7xl mx-auto px-6 py-8 md:px-12">
          {/* Header Bar */}
          <div className="flex flex-wrap justify-between items-center pb-6 border-b border-gray-200 mb-8 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-extrabold text-[#EC4899] tracking-tight">
                  Admin Control Panel
                </h1>
                <span className="bg-pink-100 text-[#EC4899] text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Manage incoming orders, update delivery statuses, adjust inventory, and review messages.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                + Add New Sticker
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'orders'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Manage Orders</span>
              <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('stickers')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'stickers'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Sticker Inventory</span>
              <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {stickers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'feedback'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Reviews &amp; Proofs</span>
              <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {reviews.length + proofs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'messages'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>Customer Messages</span>
              <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {unreadMessagesCount}
              </span>
            </button>
          </div>

          {/* TAB 0: OVERVIEW / DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Revenue Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-2">
                  <span className="text-2xl block">💰</span>
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Total Revenue</h3>
                  <p className="text-2xl font-black text-black">${totalRevenue.toFixed(2)} USD</p>
                </div>

                {/* Total Orders Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-2">
                  <span className="text-2xl block">📦</span>
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Total Orders</h3>
                  <p className="text-2xl font-black text-black">{orders.length}</p>
                  <p className="text-[11px] text-amber-600 font-bold">{pendingOrdersCount} pending orders</p>
                </div>

                {/* Active Inventory Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-2">
                  <span className="text-2xl block">🏷️</span>
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Stickers Listed</h3>
                  <p className="text-2xl font-black text-black">{stickers.length}</p>
                  <p className="text-[11px] text-red-500 font-bold">{lowStockCount} items low in stock</p>
                </div>

                {/* Customer Inquiries Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-2">
                  <span className="text-2xl block">📬</span>
                  <h3 className="text-xs font-bold text-gray-500 uppercase">Support Inquiries</h3>
                  <p className="text-2xl font-black text-black">{messages.length}</p>
                  <p className="text-[11px] text-pink-600 font-bold">{unreadMessagesCount} unread messages</p>
                </div>
              </div>

              {/* Quick Actions Panel with 3 Distinct Control Boxes */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <h3 className="text-sm font-extrabold text-black uppercase">Quick Control Shortcuts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="p-4 bg-[#F9F9FB] hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs block text-black">View Pending Orders</span>
                    <span className="text-[11px] text-gray-500">Check and update fulfillment statuses</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('messages')}
                    className="p-4 bg-[#F9F9FB] hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs block text-black">Reply to Inquiries</span>
                    <span className="text-[11px] text-gray-500">Respond directly to customer messages</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('stickers')}
                    className="p-4 bg-[#F9F9FB] hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs block text-black">View / Add Stock</span>
                    <span className="text-[11px] text-gray-500">Manage inventory and sticker stock counts</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {loadingOrders ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-3">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-4xl block">📦</span>
                  <h3 className="text-sm font-bold text-gray-800">No Orders Found</h3>
                  <p className="text-xs text-gray-400">
                    Incoming customer purchases will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-4 gap-3 text-xs">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-black text-sm">
                              Order #{order.id.slice(0, 8)}
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="font-semibold text-gray-700">
                              {order.buyer_email || (order.user_id ? `User: ${order.user_id.slice(0, 8)}` : 'Guest Buyer')}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(order.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-xs text-gray-500 uppercase">
                            Status:
                          </span>
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                            }
                            className="bg-[#F4F4F6] border border-gray-300 text-gray-900 font-extrabold text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="pending">🕒 Pending</option>
                            <option value="processing">⏳ Processing</option>
                            <option value="completed">✓ Completed</option>
                            <option value="cancelled">✕ Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                          Purchased Items ({order.items?.length || 0})
                        </h4>

                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-[#F9F9FB] rounded-xl p-3 flex flex-wrap justify-between items-center text-xs gap-2"
                            >
                              <div className="space-y-1">
                                <p className="font-extrabold text-black uppercase">
                                  {item.name} <span className="text-pink-500">x{item.quantity}</span>
                                </p>
                                {(item.ign || order.ign) && (
                                  <p className="text-[11px] text-gray-600">
                                    IGN: <span className="font-bold text-black">{item.ign || order.ign}</span>
                                  </p>
                                )}
                                {(item.inviteLink || order.invite_link) && (
                                  <p className="text-[11px] text-gray-600">
                                    Invite:{' '}
                                    <a
                                      href={item.inviteLink || order.invite_link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-bold text-pink-600 underline hover:text-pink-700"
                                    >
                                      {item.inviteLink || order.invite_link}
                                    </a>
                                  </p>
                                )}
                              </div>

                              <span className="font-black text-gray-900">
                                ${(Number(item.price) * item.quantity).toFixed(2)} USD
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs font-extrabold">
                        <span className="text-gray-500 uppercase">Total Paid</span>
                        <span className="text-sm text-black">${Number(order.total_amount).toFixed(2)} USD</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STICKER INVENTORY */}
          {activeTab === 'stickers' && (
            <div className="space-y-6">
              {loadingStickers ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-3">Loading inventory...</p>
                </div>
              ) : stickers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-4xl block">🏷️</span>
                  <h3 className="text-sm font-bold text-gray-800">No Stickers in Storefront</h3>
                  <p className="text-xs text-gray-400">
                    Click &quot;+ Add New Sticker&quot; above to list your first sticker for sale!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="w-full h-36 bg-[#F9F9FB] rounded-xl flex items-center justify-center p-2 border border-gray-100 overflow-hidden relative">
                          {sticker.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={sticker.image_url}
                              alt={sticker.name}
                              className="h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">No Image</span>
                          )}

                          {(!sticker.is_active || sticker.stock === 0) && (
                            <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase backdrop-blur-xs">
                              {sticker.stock === 0 ? 'Out of Stock' : 'Hidden'}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-amber-500 uppercase">
                            {sticker.rarity}
                          </span>
                          <h3 className="font-extrabold text-sm text-black uppercase">
                            {sticker.name}
                          </h3>
                          <p className="font-black text-xs text-gray-800">
                            ${Number(sticker.price).toFixed(2)} USD
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between bg-[#F9F9FB] border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
                          <span className="font-extrabold text-gray-600 text-[11px] uppercase">
                            Stock:
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateStock(sticker.id, sticker.stock || 0, -1)}
                              className="w-6 h-6 bg-white border border-gray-300 rounded-lg text-black font-extrabold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="font-black text-black min-w-[20px] text-center">
                              {sticker.stock ?? 0}
                            </span>
                            <button
                              onClick={() => handleUpdateStock(sticker.id, sticker.stock || 0, 1)}
                              className="w-6 h-6 bg-white border border-gray-300 rounded-lg text-black font-extrabold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleStickerActive(sticker.id, sticker.is_active)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            sticker.is_active
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          {sticker.is_active ? '👁️ Hide Listing' : '👁️ Show Listing'}
                        </button>

                        <button
                          onClick={() => handleRemoveSticker(sticker.id)}
                          className="w-full py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer border border-red-100"
                        >
                          🗑️ Remove Sticker
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS & PROOFS MODERATION */}
          {activeTab === 'feedback' && (
            <div className="space-y-8">
              {loadingFeedback ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-3">Loading customer feedback...</p>
                </div>
              ) : (
                <>
                  {/* Reviews Section */}
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-black uppercase tracking-wider">
                      💬 Customer Reviews ({reviews.length})
                    </h3>

                    {reviews.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                        No reviews submitted yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-extrabold text-xs text-black block">
                                    {review.username}
                                  </span>
                                  <div className="text-amber-400 text-xs">
                                    {'★'.repeat(review.rating)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="text-red-500 hover:bg-red-50 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-100 cursor-pointer"
                                >
                                  🗑️ Delete
                                </button>
                              </div>

                              <p className="text-[10px] text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()} | {review.order_info}
                              </p>

                              <p className="text-xs text-gray-800 font-medium">
                                &quot;{review.comment}&quot;
                              </p>

                              {review.admin_reply && (
                                <div className="bg-pink-50/80 border border-pink-200 rounded-xl p-3 text-[11px] space-y-1">
                                  <span className="text-[#EC4899] font-black block">
                                    💬 Admin Reply:
                                  </span>
                                  <p className="text-gray-700 italic">{review.admin_reply}</p>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                              {replyingReviewId === review.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    rows={2}
                                    placeholder="Type your response to customer..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="w-full bg-[#F9F9FB] border border-pink-200 rounded-xl p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-pink-500"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingReviewId(null);
                                        setReplyText('');
                                      }}
                                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={submittingReply}
                                      onClick={() => handleSaveAdminReply(review.id)}
                                      className="flex-1 bg-[#EC4899] text-white font-extrabold py-1.5 rounded-lg text-[10px] cursor-pointer shadow-xs"
                                    >
                                      {submittingReply ? 'Saving...' : 'Send Reply'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setReplyingReviewId(review.id);
                                    setReplyText(review.admin_reply || '');
                                  }}
                                  className="w-full bg-pink-50 hover:bg-pink-100 text-[#EC4899] font-extrabold text-xs py-2 rounded-xl border border-pink-200 transition-colors cursor-pointer"
                                >
                                  {review.admin_reply ? '✏️ Edit Response' : 'Reply'}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Proofs Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-base font-extrabold text-black uppercase tracking-wider">
                      📸 Delivery Proofs ({proofs.length})
                    </h3>

                    {proofs.length === 0 ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                        No delivery proof screenshots uploaded yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {proofs.map((proof) => (
                          <div
                            key={proof.id}
                            className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex flex-col items-center justify-between space-y-2"
                          >
                            {proof.image_url ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={proof.image_url}
                                alt={proof.caption}
                                className="h-24 w-auto object-contain rounded-lg"
                              />
                            ) : null}
                            <span className="text-[10px] font-bold text-gray-700 text-center line-clamp-1">
                              {proof.caption}
                            </span>
                            <button
                              onClick={() => handleDeleteProof(proof.id)}
                              className="w-full text-red-500 hover:bg-red-50 text-[10px] font-bold py-1 rounded-lg border border-red-100 cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOMER MESSAGES (CONTACT INQUIRIES) */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <h3 className="text-base font-extrabold text-black uppercase tracking-wider">
                📬 Customer Support Inquiries ({messages.length})
              </h3>

              {loadingMessages ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-3">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-400">
                  No contact messages received yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex flex-wrap justify-between items-center text-xs gap-2">
                        <div>
                          <span className="font-extrabold text-black text-sm">{msg.email}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={msg.status}
                            onChange={(e) => handleUpdateMessageStatus(msg.id, e.target.value)}
                            className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase outline-none cursor-pointer ${
                              msg.status === 'replied'
                                ? 'bg-green-100 text-green-700'
                                : msg.status === 'closed'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <option value="unread">🕒 Unread</option>
                            <option value="replied">💬 Replied</option>
                            <option value="closed">🔒 Closed / Resolved</option>
                          </select>

                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-red-500 hover:bg-red-50 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-100 cursor-pointer"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-800 bg-[#F9F9FB] p-3.5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>

                      {msg.admin_reply && (
                        <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-xs space-y-1">
                          <span className="text-[#EC4899] font-black block">💬 Admin Reply:</span>
                          <p className="text-gray-700 italic">{msg.admin_reply}</p>
                        </div>
                      )}

                      {/* Reply Input Box */}
                      <div className="pt-2">
                        {replyingMsgId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={3}
                              placeholder={`Type response to ${msg.email}...`}
                              value={msgReplyText}
                              onChange={(e) => setMsgReplyText(e.target.value)}
                              className="w-full bg-[#F9F9FB] border border-pink-200 rounded-xl p-2.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => setReplyingMsgId(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={sendingMsgReply}
                                onClick={() => handleSendContactReply(msg.id)}
                                className="bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold px-5 py-1.5 rounded-xl text-xs cursor-pointer shadow-xs"
                              >
                                {sendingMsgReply ? 'Saving...' : 'Save & Send Reply to Profile'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingMsgId(msg.id);
                              setMsgReplyText(msg.admin_reply || '');
                            }}
                            className="bg-pink-50 hover:bg-pink-100 text-[#EC4899] font-extrabold text-xs px-4 py-2 rounded-xl border border-pink-200 transition-colors cursor-pointer"
                          >
                            {msg.admin_reply ? '✏️ Edit Reply' : '💬 Reply to Inquiry'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer isMinimal={true} />

      {/* MANUAL ADD REVIEW OR PROOF MODAL */}
      {showManualFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">Add Social Media Feedback</h3>
              <button onClick={() => setShowManualFeedbackModal(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>

            <form onSubmit={handleManualFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as 'review' | 'proof')}
                  className="w-full bg-[#F9F9FB] border rounded-xl p-2 text-xs font-bold"
                >
                  <option value="proof">📸 Delivery Proof Screenshot</option>
                  <option value="review">⭐ Customer Review</option>
                </select>
              </div>

              {manualType === 'review' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name</label>
                    <input type="text" required placeholder="e.g. Sarah M." value={manualUsername} onChange={(e) => setManualUsername(e.target.value)} className="w-full bg-[#F9F9FB] border rounded-xl p-2 text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rating (1 to 5 Stars)</label>
                    <select value={manualRating} onChange={(e) => setManualRating(parseInt(e.target.value))} className="w-full bg-[#F9F9FB] border rounded-xl p-2 text-xs">
                      <option value="5">5 Stars ★★★★★</option>
                      <option value="4">4 Stars ★★★★☆</option>
                      <option value="3">3 Stars ★★★☆☆</option>
                      <option value="2">2 Stars ★★☆☆☆</option>
                      <option value="1">1 Stars ★☆☆☆☆</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Review Comment</label>
                    <textarea required rows={3} placeholder="Super fast transaction via FB!" value={manualComment} onChange={(e) => setManualComment(e.target.value)} className="w-full bg-[#F9F9FB] border rounded-xl p-2 text-xs" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Proof Screenshot (JPG / PNG)</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-pink-300 rounded-xl cursor-pointer bg-pink-50/50 hover:bg-pink-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                        <span className="text-2xl mb-1">📁</span>
                        <p className="text-xs font-bold text-gray-700">
                          {manualFile ? manualFile.name : 'Click to browse or drag & drop image'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        required
                        accept="image/png, image/jpeg"
                        onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Caption (Optional)</label>
                    <input type="text" placeholder="Delivered successfully!" value={manualCaption} onChange={(e) => setManualCaption(e.target.value)} className="w-full bg-[#F9F9FB] border rounded-xl p-2 text-xs" />
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setShowManualFeedbackModal(false)} className="flex-1 bg-gray-100 font-bold py-2 rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={submittingManual} className="flex-1 bg-[#EC4899] text-white font-extrabold py-2 rounded-xl text-xs cursor-pointer">
                  {submittingManual ? 'Uploading...' : 'Publish to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Sticker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold text-gray-900">Add New Sticker</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSticker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sticker Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spot Rebel"
                  value={newStickerName}
                  onChange={(e) => setNewStickerName(e.target.value)}
                  className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1.99"
                    value={newStickerPrice}
                    onChange={(e) => setNewStickerPrice(e.target.value)}
                    className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={newStickerStock}
                    onChange={(e) => setNewStickerStock(e.target.value)}
                    className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Rarity
                  </label>
                  <select
                    value={newStickerRarity}
                    onChange={(e) => setNewStickerRarity(e.target.value)}
                    className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl px-2 py-2 text-xs text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="6-Star">6 ⭐</option>
                    <option value="5-Star">5 ⭐</option>
                    <option value="4-Star">4 ⭐</option>
                    <option value="3-Star">3 ⭐</option>
                    <option value="2-Star">2 ⭐</option>
                    <option value="1-Star">1 ⭐</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sticker Image (JPG / PNG Required)
                </label>
                <input
                  type="file"
                  required
                  accept="image/png, image/jpeg"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-[#F9F9FB] border border-gray-200 rounded-xl p-2 text-xs text-gray-600 outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#EC4899] file:text-white hover:file:bg-pink-600 cursor-pointer"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSticker}
                  className="flex-1 bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm uppercase tracking-wider"
                >
                  {addingSticker ? 'Uploading...' : 'Add Sticker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}