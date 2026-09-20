import React, { useState, useMemo } from 'react';
import { Comment } from '../../types';
import {
  MessageSquare,
  Search,
  CheckCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldAlert,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminCommentsTabProps {
  comments: Comment[];
  onRefresh: () => void;
}

export const AdminCommentsTab: React.FC<AdminCommentsTabProps> = ({ comments, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'flagged'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesUser = (c.user_name || '').toLowerCase().includes(q);
        const matchesSong = (c.song_title || '').toLowerCase().includes(q);
        if (!matchesContent && !matchesUser && !matchesSong) return false;
      }

      if (statusFilter !== 'all') {
        if (c.status !== statusFilter) return false;
      }

      return true;
    });
  }, [comments, searchQuery, statusFilter]);

  // Moderate Status (visible, hidden, flagged)
  const handleSetStatus = async (id: string, status: 'visible' | 'hidden' | 'flagged') => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/comments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Comment Permanently
  const handleDeleteComment = async () => {
    if (!deleteId) return;
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/comments/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Search & Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>Gucunga Ibitekerezo (Comments Moderation)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Gusuzuma, kwemeza, guhisha cyangwa gusiba ibitekerezo byatanzwe ku ndirimbo
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl self-start sm:self-auto"
            title="Vugurura"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Shakisha igitekerezo, umunyamuryango, cyangwa indirimbo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Imimerere yose ({comments.length})</option>
            <option value="visible">Ibyemewe (Visible)</option>
            <option value="hidden">Ibyahishwe (Hidden)</option>
            <option value="flagged">Ibyatunzwe urutoki (Flagged)</option>
          </select>
        </div>
      </div>

      {/* Comment List */}
      <div className="space-y-2">
        {filteredComments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
            Nta bitekerezo bihuye n'ibyo ushakishije
          </div>
        ) : (
          filteredComments.map(c => {
            const isVisible = c.status === 'visible';
            const isFlagged = c.status === 'flagged';

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  {/* User info & Song */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {(c.user_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-extrabold text-xs text-slate-900">{c.user_name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                      {c.user_role || 'member'}
                    </span>
                    {c.song_title && (
                      <span className="text-[11px] text-blue-950 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                        ku ndirimbo: {c.song_title}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-800'
                          : isFlagged
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Comment text */}
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                    "{c.content}"
                  </p>

                  <div className="text-[10px] text-slate-400">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {isVisible ? (
                    <button
                      onClick={() => handleSetStatus(c.id, 'hidden')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      title="Hisha iki gitekerezo"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hisha</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSetStatus(c.id, 'visible')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      title="Emeza kugaragara"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Emeza (Approve)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Siba burundu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Gusiba iki gitekerezo burundu?"
        message="Uremeza ko ushaka gusiba iki gitekerezo? Ntabwo kigaruka."
        confirmText="Yego, Siba"
        cancelText="Reka"
        isDestructive={true}
        isLoading={isUpdating}
        onConfirm={handleDeleteComment}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
