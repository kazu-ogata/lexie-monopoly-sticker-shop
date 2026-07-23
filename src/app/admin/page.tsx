'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { createClient } from '../lib/supabase/client';
import { Sticker } from '../types/sticker';

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'stickers'>('orders');

  // Admin Check State
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(true);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);

  // Sticker Inventory State
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Sticker Form State
  const [newStickerName, setNewStickerName] = useState('');
  const [newStickerPrice, setNewStickerPrice] = useState('');
  const [newStickerRarity, setNewStickerRarity] = useState('6-Star');
  const [newStickerStock, setNewStickerStock] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [addingSticker, setAddingSticker] = useState(false);

  // 1. Verify User Session & Load Initial Data
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
    }

    initAdmin();
  }, [router]);

  // Fetch all customer orders
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

  // Fetch all sticker listings
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

  /// Generate a Test Order with ALL possible field names
  const handleCreateTestOrder = async () => {
    setCreatingTestOrder(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const mockOrder = {
      user_id: user?.id || null,
      buyer_email: user?.email || 'admin@email.com',
      ign: 'LexieGamer99',
      invite_link: 'https://mply.io/sample-invite-123',
      amount_paid: 9.98,
      total_amount: 9.98,
      payment_method: 'Credit Card',
      status: 'pending',
      items: [
        {
          id: 'mock-1',
          name: 'Golden Blitz',
          quantity: 1,
          price: 4.99,
          ign: 'LexieGamer99',
          inviteLink: 'https://mply.io/sample-invite-123',
        },
        {
          id: 'mock-2',
          name: 'Dice Tycoon',
          quantity: 1,
          price: 4.99,
          ign: 'LexieGamer99',
          inviteLink: 'https://mply.io/sample-invite-123',
        },
      ],
    };

    const { data, error } = await supabase.from('orders').insert([mockOrder]).select();

    if (error) {
      console.error('Error creating test order:', error);
      alert(`Failed to generate test order: ${error.message}`);
    } else if (data) {
      setOrders((prev) => [data[0], ...prev]);
    }
    setCreatingTestOrder(false);
  };

  // Update Order Status
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
    }
    setUpdatingOrderId(null);
  };

  // Add New Sticker Listing with File Upload
  const handleAddSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please select an image file (JPG or PNG).');
      return;
    }

    setAddingSticker(true);
    const supabase = createClient();

    try {
      // 1. Upload File to Supabase Storage
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

      // 2. Insert Sticker Record in Table
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
    } catch (err: any) {
      console.error('Error adding sticker:', err);
      alert(err.message || 'Failed to add sticker.');
    } finally {
      setAddingSticker(false);
    }
  };

  // Adjust Stock (+ / -)
  const handleUpdateStock = async (stickerId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, (currentStock || 0) + delta);
    const supabase = createClient();

    const { error } = await supabase
      .from('stickers')
      .update({ stock: newStock })
      .eq('id', stickerId);

    if (error) {
      console.error('Error updating stock:', error);
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === stickerId ? { ...s, stock: newStock } : s))
      );
    }
  };

  // Toggle Active / Hidden Status
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

  // Remove Sticker Entirely
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
                Manage incoming orders, update delivery statuses, and adjust sticker inventory listings.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-3">
              {activeTab === 'orders' && (
                <button
                  onClick={handleCreateTestOrder}
                  disabled={creatingTestOrder}
                  className="bg-black hover:bg-gray-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {creatingTestOrder ? 'Creating...' : '⚡ Create Test Order'}
                </button>
              )}

              {activeTab === 'stickers' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#EC4899] hover:bg-pink-600 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  + Add New Sticker
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-3 mb-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer flex items-center space-x-2 ${
                activeTab === 'orders'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>📋 Manage Orders</span>
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
              <span>🏷️ Sticker Inventory</span>
              <span className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {stickers.length}
              </span>
            </button>
          </div>

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
                    Click "⚡ Create Test Order" above to generate a sample order for preview!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-xs"
                    >
                      {/* Order Header info */}
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

                        {/* Status Change Selector */}
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

                      {/* Items & Delivery Details */}
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

                      {/* Total Bar */}
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Image Preview */}
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

                          {!sticker.is_active && (
                            <span className="absolute top-2 right-2 bg-gray-900/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase backdrop-blur-xs">
                              Hidden
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

                      {/* Stock Adjuster & Action Controls */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        {/* Stock Counter Pill */}
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

                        {/* Hide / Show Toggle Button */}
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

                        {/* Remove Button */}
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
        </main>
      </div>

      <Footer isMinimal={true} />

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

              {/* Strict File Upload Input */}
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