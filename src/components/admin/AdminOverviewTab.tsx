import React from 'react';
import {
  Music,
  FileText,
  Users,
  MessageSquare,
  HeartHandshake,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Lock,
  Unlock,
  Plus,
  ArrowRight,
  Clock,
  Shield,
  FileCheck,
} from 'lucide-react';
import { AdminMetrics, ActivityLog } from '../../types';

interface AdminOverviewTabProps {
  metrics: AdminMetrics | null;
  isLoading: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenAddSong: () => void;
  onOpenAddAnnouncement: () => void;
  onOpenAddEvent: () => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  metrics,
  isLoading,
  onNavigateTab,
  onOpenAddSong,
  onOpenAddAnnouncement,
  onOpenAddEvent,
}) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 space-y-2">
        <div className="w-8 h-8 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Gushyira imibare n'amakuru y'ibanze mu nyandiko...</p>
      </div>
    );
  }

  const m = metrics || {
    totalUsers: 0,
    adminUsers: 0,
    disabledUsers: 0,
    totalSongs: 0,
    publishedSongs: 0,
    draftSongs: 0,
    releasedSongs: 0,
    unreleasedSongs: 0,
    deletedSongs: 0,
    totalAudio: 0,
    totalImages: 0,
    totalComments: 0,
    pendingComments: 0,
    totalAnnouncements: 0,
    totalEvents: 0,
    totalDocuments: 0,
    totalArticles: 0,
    successfulDonationsCount: 0,
    totalDonationsAmount: 0,
    pendingDonationsCount: 0,
    recentActivity: [],
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Quick Action Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ibikorwa Byihuse (Quick Admin Actions)</span>
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={onOpenAddSong}
            className="p-3 bg-blue-50/70 hover:bg-blue-100 text-blue-950 rounded-2xl text-xs font-bold flex items-center gap-2 border border-blue-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>Injiza Indirimbo</span>
          </button>

          <button
            onClick={() => onNavigateTab('media')}
            className="p-3 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 rounded-2xl text-xs font-bold flex items-center gap-2 border border-indigo-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-900 text-white flex items-center justify-center shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <span>Shyiraho Majwi (Audio)</span>
          </button>

          <button
            onClick={onOpenAddAnnouncement}
            className="p-3 bg-amber-50/70 hover:bg-amber-100 text-amber-950 rounded-2xl text-xs font-bold flex items-center gap-2 border border-amber-200/60 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <span>Itangazo Rishya</span>
          </button>

          <button
            onClick={onOpenAddEvent}
            className="p-3 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Igikorwa (Event)</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Songs Stats */}
        <div
          onClick={() => onNavigateTab('songs')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between text-blue-900 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Indirimbo (Songs)</span>
            <Music className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{m.totalSongs}</p>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
              <Unlock className="w-3 h-3" /> {m.releasedSongs} released
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
              <Lock className="w-3 h-3" /> {m.unreleasedSongs} unreleased
            </span>
          </div>
        </div>

        {/* Audio Tracks */}
        <div
          onClick={() => onNavigateTab('media')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between text-indigo-900 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Amajwi (Audio)</span>
            <Music className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{m.totalAudio}</p>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">
            {m.totalImages} amafoto & ibirango
          </p>
        </div>

        {/* Users Stats */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between text-blue-950 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Abakoresha (Users)</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{m.totalUsers}</p>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">
            {m.adminUsers} abayobozi • {m.disabledUsers} bahagaritswe
          </p>
        </div>

        {/* Comments Stats */}
        <div
          onClick={() => onNavigateTab('comments')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Ibitekerezo (Comments)</span>
            <MessageSquare className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-slate-900">{m.totalComments}</p>
          <p className="mt-2 text-[10px] text-slate-500 font-medium">
            {m.pendingComments > 0 ? (
              <span className="text-rose-600 font-bold">{m.pendingComments} bisaba kwemezwa</span>
            ) : (
              'Byose byarebwe'
            )}
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Content articles & announcements */}
        <div
          onClick={() => onNavigateTab('content')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Amatangazo</span>
            <FileText className="w-4 h-4 text-blue-800" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{m.totalAnnouncements}</p>
          <p className="text-[10px] text-slate-500 mt-1">{m.totalArticles} inkuru & inyandiko</p>
        </div>

        {/* Events */}
        <div
          onClick={() => onNavigateTab('content')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Ibikorwa (Events)</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{m.totalEvents}</p>
          <p className="text-[10px] text-slate-500 mt-1">Giterane, imyitozo & concerts</p>
        </div>

        {/* Solfa & Documents */}
        <div
          onClick={() => onNavigateTab('content')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Inyandiko & Solfa</span>
            <FileCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{m.totalDocuments}</p>
          <p className="text-[10px] text-slate-500 mt-1">Sheet music & guides</p>
        </div>

        {/* Donations */}
        <div
          onClick={() => onNavigateTab('donations')}
          className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-purple-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Inkunga (MoMo)</span>
            <HeartHandshake className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {m.totalDonationsAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">RWF</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {m.successfulDonationsCount} ibyemejwe neza
          </p>
        </div>
      </div>

      {/* Recent Admin Actions Activity Feed */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Ibikorwa Biheruka mu Buyobozi (Recent Admin Activity)
              </h3>
              <p className="text-[11px] text-slate-500">
                Ubugenzuzi n'amakuru y'ibikorwa byakozwe n'abayobozi
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('logs')}
            className="text-xs font-bold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Reba Byose</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {!m.recentActivity || m.recentActivity.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Nta gikorwa cy'ubuyobozi kiremezwa muri log
            </div>
          ) : (
            m.recentActivity.slice(0, 6).map((log: ActivityLog) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    <Shield className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      <span className="font-bold text-blue-950">{log.user_name || 'Admin'}</span>{' '}
                      <span className="text-slate-600 font-normal">({log.action})</span>
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
