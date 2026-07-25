'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  isAdmin?: boolean;
}

export default function NotificationBell({ isAdmin = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (isAdmin) {
        query = query.eq('target_role', 'admin');
      } else if (user) {
        query = query.eq('user_id', user.id);
      } else {
        return;
      }

      const { data } = await query;
      if (data) setNotifications(data);
    }

    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // Remove a single notification
  const handleRemoveNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    await supabase.from('notifications').delete().eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all notifications for this view
  const handleClearAll = async () => {
    const idsToRemove = notifications.map((n) => n.id);
    if (idsToRemove.length === 0) return;

    const supabase = createClient();
    await supabase.from('notifications').delete().in('id', idsToRemove);

    setNotifications([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead();
        }}
        className="relative p-1 text-gray-800 hover:text-black cursor-pointer text-2xl flex items-center justify-center"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="bg-[#FFB6C1] px-4 py-3 font-extrabold text-gray-900 flex justify-between items-center">
            <span>Notifications</span>
            <div className="flex items-center space-x-3">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] text-gray-700 hover:text-black font-bold underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-700 font-bold hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* List Items */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 font-semibold">
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 space-y-1 relative group transition-colors ${
                    n.is_read ? 'bg-white' : 'bg-pink-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start pr-4">
                    <h4 className="font-extrabold text-gray-900">{n.title}</h4>
                    {/* Delete Individual Button */}
                    <button
                      onClick={(e) => handleRemoveNotification(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs font-bold transition-opacity cursor-pointer ml-2"
                      title="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-[11px]">{n.message}</p>
                  <span className="text-[9px] text-gray-400 block pt-0.5">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}