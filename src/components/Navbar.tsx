import React, { useState, useEffect } from 'react';
import { ChoirLogo } from './ChoirLogo';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { Search, Bell, User as UserIcon, Shield, X, Check } from 'lucide-react';
import { NotificationItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAuth,
}) => {
  const { user, isAdmin } = useAuth();
  const { choirInfo } = useBranding();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n: NotificationItem) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Failed to load notifications');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('lalumiere_token');
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Choir Logo and Title */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <ChoirLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-extrabold text-slate-900 tracking-tight text-base leading-tight font-serif">
              {choirInfo.choir_name}
            </span>
            <span className="text-[10px] text-blue-900 font-semibold uppercase tracking-wider">
              ADEPR Nyanza • Rwanda
            </span>
          </div>
        </button>

        {/* Right: Actions (Search, Notifications, Profile) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
            title="Shakisha indirimbo (Search songs & lyrics)"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative active:scale-90"
                title="Amatangazo n'amakuru (Notifications)"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-bold text-sm text-slate-800">Amatangazo & Amakuru</span>
                    <button
                      onClick={() => setShowNotifs(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Nta makuru mashya ahari</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border text-xs transition-colors ${
                            n.is_read
                              ? 'bg-slate-50 border-slate-100 text-slate-600'
                              : 'bg-blue-50/60 border-blue-200 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-blue-950">{n.title}</span>
                            {!n.is_read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 p-0.5"
                                title="Soma"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-slate-700">{n.body}</p>
                          <span className="text-[9px] text-slate-400 block mt-1">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile / Login */}
          {user ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors active:scale-95 text-xs font-semibold"
            >
              <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-[10px]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
              {isAdmin && (
                <span title="Ubuyobozi (Admin)">
                  <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full text-xs font-semibold shadow-xs transition-all active:scale-95 flex items-center gap-1"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Injira</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
