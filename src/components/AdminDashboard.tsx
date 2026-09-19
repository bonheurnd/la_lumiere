import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { ChoirLogo } from './ChoirLogo';
import { Song, SongCategory, AudioTrack, Comment, PaymentTransaction, PaymentProvider } from '../types';
import {
  Shield,
  BookOpen,
  Music,
  HeartHandshake,
  Settings,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  Eye,
  Download,
  AlertTriangle,
  RotateCcw,
  Palette,
  Upload,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectSong: (songId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectSong }) => {
  const { user, isAdmin } = useAuth();
  const { branding, choirInfo, updateBranding, refreshBranding } = useBranding();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'songs' | 'branding' | 'donations' | 'comments' | 'payments'
  >('overview');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Songs
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [isSavingSong, setIsSavingSong] = useState(false);

  // Audio track uploader modal state for a song
  const [addingAudioForSongId, setAddingAudioForSongId] = useState<string | null>(null);
  const [newTrackData, setNewTrackData] = useState({
    title: '',
    track_type: 'full_song',
    audio_url: '',
    duration_seconds: 180,
  });

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);

  // Donations
  const [donations, setDonations] = useState<PaymentTransaction[]>([]);
  const [donationFilter, setDonationFilter] = useState('all');

  // Payment Providers
  const [providers, setProviders] = useState<PaymentProvider[]>([]);

  // Branding Editor State
  const [brandingForm, setBrandingForm] = useState({
    main_logo_url: branding.main_logo_url || '',
    app_icon_url: branding.app_icon_url || '',
    splash_logo_url: branding.splash_logo_url || '',
    light_logo_url: branding.light_logo_url || '',
    dark_logo_url: branding.dark_logo_url || '',
    banner_image_url: branding.banner_image_url || '',
    primary_color: branding.primary_color || '#1e3a8a',
    secondary_color: branding.secondary_color || '#d97706',
    accent_color: branding.accent_color || '#2563eb',
    choir_name: choirInfo.choir_name || 'La Lumiere Choir',
    affiliation: choirInfo.affiliation || 'ADEPR Nyanza, Kicukiro District, Rwanda',
    about_story: choirInfo.about_story || '',
    mission: choirInfo.mission || '',
    vision: choirInfo.vision || '',
    contact_phone: choirInfo.contact_phone || '',
    contact_email: choirInfo.contact_email || '',
  });

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // Load Overview & Initial Data
  const loadDashboardData = async () => {
    try {
      setIsLoadingStats(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, songsRes, catRes, comRes, donRes, provRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/songs?status=all'),
        fetch('/api/songs/categories'),
        fetch('/api/admin/comments', { headers }),
        fetch('/api/admin/donations', { headers }),
        fetch('/api/admin/payment-providers', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (songsRes.ok) setSongs(await songsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (comRes.ok) setComments(await comRes.json());
      if (donRes.ok) setDonations(await donRes.json());
      if (provRes.ok) setProviders(await provRes.json());
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Handle Song Save (Create / Update)
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !editingSong.title) return;

    try {
      setIsSavingSong(true);
      const token = localStorage.getItem('lalumiere_token');
      const isNew = !editingSong.id;
      const url = isNew ? '/api/admin/songs' : `/api/admin/songs/${editingSong.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingSong),
      });

      if (res.ok) {
        setEditingSong(null);
        await loadDashboardData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save song');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSong(false);
    }
  };

  // Handle Delete Song
  const handleDeleteSong = async (id: string) => {
    if (!confirm('Uremeza ko ushaka gusiba iyi ndirimbo burundu? (Confirm delete song)')) return;

    try {
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/songs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Audio Track
  const handleAddAudioTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingAudioForSongId || !newTrackData.title || !newTrackData.audio_url) return;

    try {
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/songs/${addingAudioForSongId}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTrackData),
      });

      if (res.ok) {
        setAddingAudioForSongId(null);
        setNewTrackData({
          title: '',
          track_type: 'full_song',
          audio_url: '',
          duration_seconds: 180,
        });
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Moderate Comment
  const handleModerateComment = async (id: string, status: 'visible' | 'hidden') => {
    try {
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
        await loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBranding(true);
      await updateBranding(brandingForm);
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Export Donations CSV
  const handleExportDonations = () => {
    if (donations.length === 0) return;
    const headers = ['Reference', 'Donor', 'Phone', 'Amount', 'Currency', 'Provider', 'Purpose', 'Status', 'Date'];
    const rows = donations.map(d => [
      d.internal_reference,
      d.donor_name,
      d.donor_phone,
      d.amount,
      d.currency,
      d.provider_slug,
      `"${d.donation_purpose.replace(/"/g, '""')}"`,
      d.status,
      d.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lalumiere_donations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-3">
        <Shield className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900">Uruhushya rwanze (Access Denied)</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Iki gice cyagenewe gusa abayobozi b'itsinda rya La Lumiere Choir (Admins only).
        </p>
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-6 max-w-4xl mx-auto">
      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight font-serif">
                Admin Control Center
              </h1>
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold rounded-md uppercase">
                Secure
              </span>
            </div>
            <p className="text-xs text-slate-400">
              La Lumiere Choir • ADEPR Nyanza, Kicukiro District, Rwanda
            </p>
          </div>
        </div>

        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Vugurura (Refresh)</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-slate-100 p-1.5 rounded-2xl">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'songs', label: 'Songs Management', icon: BookOpen },
          { id: 'branding', label: 'Branding & Logo', icon: Palette },
          { id: 'donations', label: 'Donations (MoMo)', icon: HeartHandshake },
          { id: 'comments', label: 'Comments Moderation', icon: MessageSquare },
          { id: 'payments', label: 'Payment Gateway', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Songs', value: stats?.counts?.total_songs || 0, sub: `${stats?.counts?.released_songs || 0} released`, color: 'text-blue-900' },
              { label: 'Unreleased Songs', value: stats?.counts?.unreleased_songs || 0, sub: 'Protected with PIN', color: 'text-amber-600' },
              { label: 'Audio Tracks', value: stats?.counts?.total_audio_tracks || 0, sub: 'Vocal guides & full', color: 'text-indigo-900' },
              { label: 'Choir Community', value: stats?.counts?.total_users || 0, sub: 'Registered supporters', color: 'text-emerald-700' },
              { label: 'Comments', value: stats?.counts?.total_comments || 0, sub: 'Worship testimonies', color: 'text-purple-700' },
              { label: 'Donation Total', value: `${(stats?.counts?.total_donations_rwf || 0).toLocaleString()} RWF`, sub: 'Rwanda Mobile Money', color: 'text-emerald-900' },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className={`text-xl font-black font-serif mt-1 block ${card.color}`}>
                  {card.value}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{card.sub}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Ibikorwa by'Ibanze (Quick Shortcuts)</h3>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setEditingSong({
                    title: '',
                    song_number: '',
                    composer: 'La Lumiere Choir',
                    release_status: 'released',
                    lyrics: '',
                    solfa_notation: '',
                    category_id: categories[0]?.id || '',
                  });
                  setActiveTab('songs');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-900"
              >
                <Plus className="w-4 h-4" />
                <span>Ongeramo Indirimbo Nshya (Add Song)</span>
              </button>

              <button
                onClick={() => setActiveTab('branding')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                <Palette className="w-4 h-4 text-amber-600" />
                <span>Hindura Ibirango na Logo (Branding)</span>
              </button>

              <button
                onClick={() => setActiveTab('donations')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                <span>Reba Inyemezabwishyu za MoMo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SONGS MANAGEMENT */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-base text-slate-900 font-serif">
              Gucunga Indirimbo (Songs & Audio Management)
            </h3>
            <button
              onClick={() =>
                setEditingSong({
                  title: '',
                  song_number: '',
                  composer: 'La Lumiere Choir',
                  release_status: 'released',
                  lyrics: '',
                  solfa_notation: '',
                  category_id: categories[0]?.id || '',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-900"
            >
              <Plus className="w-4 h-4" />
              <span>Ongeramo Indirimbo</span>
            </button>
          </div>

          {/* Song Creation & Edit Modal */}
          {editingSong && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-extrabold text-base text-slate-900">
                    {editingSong.id ? 'Vugurura Indirimbo (Edit Song)' : 'Ongeramo Indirimbo Nshya (New Song)'}
                  </h4>
                  <button
                    onClick={() => setEditingSong(null)}
                    className="text-slate-400 hover:text-slate-800 font-bold"
                  >
                    Funga
                  </button>
                </div>

                <form onSubmit={handleSaveSong} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Umutwe w'Indirimbo (Title): *</label>
                    <input
                      type="text"
                      required
                      value={editingSong.title || ''}
                      onChange={e => setEditingSong({ ...editingSong, title: e.target.value })}
                      placeholder="Urugero: Nzamuhimbaza"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Umubare (Song Number):</label>
                      <input
                        type="text"
                        value={editingSong.song_number || ''}
                        onChange={e => setEditingSong({ ...editingSong, song_number: e.target.value })}
                        placeholder="Urugero: #04"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Umwanditsi (Composer):</label>
                      <input
                        type="text"
                        value={editingSong.composer || ''}
                        onChange={e => setEditingSong({ ...editingSong, composer: e.target.value })}
                        placeholder="La Lumiere Choir"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Icyiciro (Category):</label>
                      <select
                        value={editingSong.category_id || ''}
                        onChange={e => setEditingSong({ ...editingSong, category_id: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Imimerere (Release Status):</label>
                      <select
                        value={editingSong.release_status || 'released'}
                        onChange={e =>
                          setEditingSong({
                            ...editingSong,
                            release_status: e.target.value as 'released' | 'unreleased',
                          })
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-900"
                      >
                        <option value="released">Released (Yarasohotse)</option>
                        <option value="unreleased">Unreleased (Iteganyijwe - Protected)</option>
                      </select>
                    </div>
                  </div>

                  {editingSong.release_status === 'unreleased' && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl space-y-1">
                      <label className="block font-bold text-amber-900 text-xs">
                        Ijambo ry'Ibanga ryo Kurinda Amagambo (Unreleased Access Password):
                      </label>
                      <input
                        type="text"
                        value={(editingSong as any).access_password || ''}
                        onChange={e =>
                          setEditingSong({ ...editingSong, access_password: e.target.value } as any)
                        }
                        placeholder="Urugero: LUMIERE2026"
                        className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-950"
                      />
                      <span className="text-[10px] text-amber-700 block">
                        Iri jambo ry'ibanga rihabwa abaririmbyi gusa kugira ngo bige indirimbo itarasohoka.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Amagambo y'Indirimbo (Full Lyrics):
                    </label>
                    <textarea
                      rows={6}
                      value={editingSong.lyrics || ''}
                      onChange={e => setEditingSong({ ...editingSong, lyrics: e.target.value })}
                      placeholder="Andika amagambo y'indirimbo hano..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-serif leading-relaxed focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Solfa Notation (Amanota y'Umuziki):
                    </label>
                    <textarea
                      rows={2}
                      value={editingSong.solfa_notation || ''}
                      onChange={e => setEditingSong({ ...editingSong, solfa_notation: e.target.value })}
                      placeholder="Urugero: d:m:s | s:m:d | r:m:f:m | r:-:-"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Ifoto y'Indirimbo (Cover Image URL):
                    </label>
                    <input
                      type="url"
                      value={editingSong.cover_image_url || ''}
                      onChange={e => setEditingSong({ ...editingSong, cover_image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingSong(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                    >
                      Hagarika
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSong}
                      className="px-5 py-2 bg-blue-950 text-white rounded-xl font-bold hover:bg-blue-900 disabled:opacity-50"
                    >
                      {isSavingSong ? 'Kubika...' : 'Bika Indirimbo (Save Song)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Audio Modal */}
          {addingAudioForSongId && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Ongeramo Ijwi/Umuziki (Add Audio Track)
                  </h4>
                  <button onClick={() => setAddingAudioForSongId(null)} className="text-slate-400 font-bold">
                    Funga
                  </button>
                </div>

                <form onSubmit={handleAddAudioTrack} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Umutwe w'Ijwi (Track Title):</label>
                    <input
                      type="text"
                      required
                      value={newTrackData.title}
                      onChange={e => setNewTrackData({ ...newTrackData, title: e.target.value })}
                      placeholder="Urugero: Vocal Guide - Alto"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Ubwoko bw'Ijwi (Track Type):</label>
                    <select
                      value={newTrackData.track_type}
                      onChange={e => setNewTrackData({ ...newTrackData, track_type: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="full_song">Full Song (Indirimbo Yose)</option>
                      <option value="melody">Melody (Ijwi ry'Intangiriro)</option>
                      <option value="vocal_guide">Vocal Guide (Amajwi y'Abaririmbyi)</option>
                      <option value="instrumental">Instrumental (Ibikoresho gusa)</option>
                      <option value="practice_track">Practice Track (Imyitozo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Audio URL (.mp3 / stream):</label>
                    <input
                      type="url"
                      required
                      value={newTrackData.audio_url}
                      onChange={e => setNewTrackData({ ...newTrackData, audio_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setAddingAudioForSongId(null)}
                      className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                    >
                      Hagarika
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-950 text-white rounded-xl font-bold hover:bg-blue-900"
                    >
                      Ongeramo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Songs Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {songs.map(song => (
              <div key={song.id} className="p-3.5 hover:bg-slate-50/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-blue-950 shrink-0 font-mono text-[11px]">
                    {song.song_number || 'LL'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate">
                        {song.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          song.release_status === 'released'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {song.release_status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      {song.composer} • {song.audio_count || 0} audio tracks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setAddingAudioForSongId(song.id)}
                    className="p-2 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Add audio track"
                  >
                    <Music className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setEditingSong(song)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit song"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSong(song.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BRANDING & LOGO SETTINGS */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-serif">
              Gucunga Ibirango na Logo (Choir Branding & Identity)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Iyi porogaramu ikoresha logo yemewe ya La Lumiere Choir. Ushobora gushyiraho cyangwa kuvugurura logo zose, amabara, n'amakuru arambuye y'amateka ya Korali.
            </p>
          </div>

          {brandingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Ibirango na Logo byavuguruwe neza muri porogaramu yose!</span>
            </div>
          )}

          {/* Live Preview Panel before publishing */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Isubiramo ry'Imiterere (Live Branding Preview):
            </span>
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">Choir Logo</span>
                <ChoirLogo size="md" />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">With Title</span>
                <ChoirLogo size="sm" showSubtitle={true} />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">Large Splash</span>
                <ChoirLogo size="lg" variant="splash" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Logo Nkuru (Official Main Logo URL):
                </label>
                <input
                  type="url"
                  value={brandingForm.main_logo_url}
                  onChange={e => setBrandingForm({ ...brandingForm, main_logo_url: e.target.value })}
                  placeholder="https://.../lalumiere-logo.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Niba nta logo irashyirwaho, porogaramu ikoresha ikimenyetso kigaragaza 'La Lumiere Choir Logo'.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  App Icon Logo URL (Agashusho ka Porogaramu):
                </label>
                <input
                  type="url"
                  value={brandingForm.app_icon_url}
                  onChange={e => setBrandingForm({ ...brandingForm, app_icon_url: e.target.value })}
                  placeholder="https://.../app-icon.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Splash Screen Logo URL:
                </label>
                <input
                  type="url"
                  value={brandingForm.splash_logo_url}
                  onChange={e => setBrandingForm({ ...brandingForm, splash_logo_url: e.target.value })}
                  placeholder="https://.../splash-logo.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Banner / Cover Image URL:
                </label>
                <input
                  type="url"
                  value={brandingForm.banner_image_url}
                  onChange={e => setBrandingForm({ ...brandingForm, banner_image_url: e.target.value })}
                  placeholder="https://.../choir-banner.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3 border-t pt-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Primary Color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.primary_color}
                    onChange={e => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.primary_color}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Secondary / Gold:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.secondary_color}
                    onChange={e => setBrandingForm({ ...brandingForm, secondary_color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.secondary_color}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Accent Color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.accent_color}
                    onChange={e => setBrandingForm({ ...brandingForm, accent_color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.accent_color}</span>
                </div>
              </div>
            </div>

            {/* Choir Information Text */}
            <div className="border-t pt-3 space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Izina rya Korali (Choir Name):</label>
                <input
                  type="text"
                  value={brandingForm.choir_name}
                  onChange={e => setBrandingForm({ ...brandingForm, choir_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Itorero n'Aho Ibarizwa (Affiliation):</label>
                <input
                  type="text"
                  value={brandingForm.affiliation}
                  onChange={e => setBrandingForm({ ...brandingForm, affiliation: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Amateka n'Intego (About Story):</label>
                <textarea
                  rows={3}
                  value={brandingForm.about_story}
                  onChange={e => setBrandingForm({ ...brandingForm, about_story: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mission (Intego):</label>
                  <input
                    type="text"
                    value={brandingForm.mission}
                    onChange={e => setBrandingForm({ ...brandingForm, mission: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Vision (Icyerekezo):</label>
                  <input
                    type="text"
                    value={brandingForm.vision}
                    onChange={e => setBrandingForm({ ...brandingForm, vision: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingBranding}
              className="w-full py-3 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-md disabled:opacity-50"
            >
              {isSavingBranding ? 'Kubika...' : 'Bika no Gutangaza Ibirango (Save & Publish Branding)'}
            </button>
          </form>
        </div>
      )}

      {/* 4. DONATIONS & FINANCIALS */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-serif">
                Ibyinjijwe n'Impano za Mobile Money (Financials)
              </h3>
              <p className="text-xs text-slate-500">
                Uruhererekane rwose rwa MTN Mobile Money na Airtel Money mu Rwanda
              </p>
            </div>
            <button
              onClick={handleExportDonations}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Sohora Raporo (Export CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-2">Ref</th>
                  <th className="py-2.5 px-2">Utanze</th>
                  <th className="py-2.5 px-2">Phone</th>
                  <th className="py-2.5 px-2">Amafaranga</th>
                  <th className="py-2.5 px-2">Uburyo</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Itariki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 font-mono font-bold text-slate-800">{d.internal_reference}</td>
                    <td className="py-2 px-2 font-medium text-slate-900">{d.donor_name}</td>
                    <td className="py-2 px-2 font-mono text-slate-600">{d.donor_phone}</td>
                    <td className="py-2 px-2 font-mono font-bold text-emerald-900">
                      {d.amount.toLocaleString()} RWF
                    </td>
                    <td className="py-2 px-2 uppercase font-semibold text-slate-700">{d.provider_slug}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          d.status === 'successful'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-[10px]">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COMMENTS MODERATION */}
      {activeTab === 'comments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 font-serif">
            Kugenzura Ibitekerezo (Comments Moderation)
          </h3>
          <div className="space-y-2">
            {comments.map(c => (
              <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.user_name}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {c.reports_count > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold text-[9px]">
                        {c.reports_count} reports
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {c.status === 'visible' ? (
                      <button
                        onClick={() => handleModerateComment(c.id, 'hidden')}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Hisha (Hide)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateComment(c.id, 'visible')}
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        Garura (Restore)
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-700">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PAYMENT GATEWAY SETTINGS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 font-serif">
            Amakuru ya Payment Gateway (MTN & Airtel Rwanda)
          </h3>
          <p className="text-xs text-slate-500">
            Igenzura rya API endpoints, Merchant IDs, na Webhook URL yo kwakira ibyemezo bya Mobile Money.
          </p>

          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-mono font-bold rounded">
                    {p.environment}
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">Slug: {p.slug}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Endpoint: {p.api_endpoint || 'Default gateway'}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Merchant Account: {p.merchant_account_id || 'Configured via .env'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
