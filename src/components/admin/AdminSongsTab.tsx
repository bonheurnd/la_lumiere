import React, { useState, useMemo } from 'react';
import {
  Song,
  SongCategory,
  AudioTrack,
} from '../../types';
import {
  Plus,
  Search,
  Filter,
  Music,
  Lock,
  Unlock,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Upload,
  Play,
  X,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminSongsTabProps {
  songs: Song[];
  categories: SongCategory[];
  onRefresh: () => void;
  onSelectSong: (id: string) => void;
  onOpenUploadAudio?: (songId: string) => void;
}

export const AdminSongsTab: React.FC<AdminSongsTabProps> = ({
  songs,
  categories,
  onRefresh,
  onSelectSong,
  onOpenUploadAudio,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'released' | 'unreleased'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered list
  const filteredSongs = useMemo(() => {
    return songs.filter(s => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesComposer = (s.composer || '').toLowerCase().includes(q);
        const matchesLyrics = (s.lyrics || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesComposer && !matchesLyrics) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        const songStatus = s.status || 'published';
        if (songStatus !== statusFilter) return false;
      }

      // Release
      if (releaseFilter !== 'all') {
        if (s.release_status !== releaseFilter) return false;
      }

      // Category
      if (categoryFilter !== 'all') {
        if (s.category_id !== categoryFilter) return false;
      }

      return true;
    });
  }, [songs, searchQuery, statusFilter, releaseFilter, categoryFilter]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingSong({
      title: '',
      composer: '',
      category_id: categories[0]?.id || '',
      description: '',
      lyrics: '',
      solfa_notation: '',
      release_status: 'released',
      status: 'published',
      release_date: new Date().toISOString().split('T')[0],
      cover_image_url: '',
    });
    setError('');
  };

  // Open Edit Form
  const handleOpenEdit = (song: Song) => {
    setEditingSong({ ...song });
    setError('');
  };

  // Save Song (Draft or Publish)
  const handleSaveSong = async (statusOverride?: 'draft' | 'published') => {
    if (!editingSong || !editingSong.title?.trim()) {
      setError('Umutwe w\'indirimbo urakenewe (Title is required)');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const token = localStorage.getItem('lalumiere_token');

      const isNew = !editingSong.id;
      const url = isNew ? '/api/admin/songs' : `/api/admin/songs/${editingSong.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingSong,
        status: statusOverride || editingSong.status || 'published',
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save song');
      }

      setSuccessMsg(isNew ? 'Indirimbo yashyizwemo neza!' : 'Indirimbo yavuguruwe neza!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingSong(null);
      setIsPreviewOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Ikibazo cyavutse mu kubika indirimbo');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Publish / Unpublish directly
  const handleTogglePublish = async (song: Song) => {
    try {
      const token = localStorage.getItem('lalumiere_token');
      const newStatus = song.status === 'draft' ? 'published' : 'draft';
      const res = await fetch(`/api/admin/songs/${song.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Release / Unreleased
  const handleToggleRelease = async (song: Song) => {
    try {
      const token = localStorage.getItem('lalumiere_token');
      const newRelease = song.release_status === 'released' ? 'unreleased' : 'released';
      const res = await fetch(`/api/admin/songs/${song.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...song,
          release_status: newRelease,
        }),
      });

      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Song
  const handleDeleteSong = async () => {
    if (!deleteConfirmId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/songs/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteConfirmId(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // File Upload Helper for Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ifoto ntigomba kurenza 10MB');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setEditingSong(prev => (prev ? { ...prev, cover_image_url: data.url } : null));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Failed to upload image');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Header & Search / Filters */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-900" />
              <span>Gucunga Indirimbo (Song Management)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Uburyo bwose bwo kongera, guhindura, no gukwirakwiza indirimbo za Korali
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ongera Indirimbo Nshya (Add Song)</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search input & status filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Shakisha indirimbo, umwanditsi, amagambo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Imimerere yose (All Status)</option>
            <option value="published">Byemejwe (Published)</option>
            <option value="draft">Inyandiko mbanziriza (Draft)</option>
          </select>

          {/* Release Filter */}
          <select
            value={releaseFilter}
            onChange={e => setReleaseFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Isokoza ryose (All Release)</option>
            <option value="released">Yasohotse (Released)</option>
            <option value="unreleased">Itegereje (Unreleased / PIN)</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ibyiciro byose ({songs.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                categoryFilter === c.id
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Song List Cards / Table */}
      <div className="space-y-2">
        {filteredSongs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
            Nta ndirimbo ihuye n'ibyo ushakishije
          </div>
        ) : (
          filteredSongs.map(song => {
            const isDraft = song.status === 'draft';
            const isUnreleased = song.release_status === 'unreleased';
            const audioCount = song.audio_tracks?.length || song.audio_count || 0;

            return (
              <div
                key={song.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                {/* Left: Cover & Details */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {song.cover_image_url ? (
                      <img
                        src={song.cover_image_url}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-slate-400" />
                    )}
                    {isUnreleased && (
                      <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => onSelectSong(song.id)}
                        className="font-extrabold text-xs sm:text-sm text-slate-900 hover:text-blue-900 cursor-pointer truncate max-w-xs"
                      >
                        {song.title}
                      </h3>

                      {/* Status Badges */}
                      {isDraft ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md border border-slate-200">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-md border border-emerald-200">
                          Published
                        </span>
                      )}

                      {isUnreleased ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded-md border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Unreleased</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold text-[10px] rounded-md border border-blue-200 flex items-center gap-1">
                          <Unlock className="w-3 h-3 text-blue-600" />
                          <span>Released</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span>{song.composer || 'La Lumiere Choir'}</span>
                      {song.category_name && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{song.category_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 font-semibold">
                        <Music className="w-3 h-3 text-blue-900" />
                        <span>{audioCount} tracks</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleTogglePublish(song)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      isDraft
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={isDraft ? 'Emeza indirimbo (Publish)' : 'Subiza mu nyandiko (Draft)'}
                  >
                    {isDraft ? 'Publish' : 'Unpublish'}
                  </button>

                  {/* Release Toggle Button */}
                  <button
                    onClick={() => handleToggleRelease(song)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      isUnreleased
                        ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                    title={isUnreleased ? 'Fungura abantu bose babone (Release)' : 'Funga nka Unreleased'}
                  >
                    {isUnreleased ? 'Release' : 'Mark Unreleased'}
                  </button>

                  {/* Preview Song */}
                  <button
                    onClick={() => onSelectSong(song.id)}
                    className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Reba uko igaragara (Preview)"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(song)}
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Hindura (Edit)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirmId(song.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Siba (Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT SONG MODAL */}
      {editingSong && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-serif">
                  {editingSong.id ? 'Vugurura Indirimbo (Edit Song)' : 'Ongera Indirimbo Nshya (Add Song)'}
                </h3>
              </div>
              <button
                onClick={() => setEditingSong(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              {/* Row 1: Title & Composer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Umutwe w'Indirimbo (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSong.title || ''}
                    onChange={e => setEditingSong({ ...editingSong, title: e.target.value })}
                    placeholder="Urugero: Nzasenga kugeza..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Umwanditsi / Composer (Artist)
                  </label>
                  <input
                    type="text"
                    value={editingSong.composer || ''}
                    onChange={e => setEditingSong({ ...editingSong, composer: e.target.value })}
                    placeholder="La Lumiere Choir"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              {/* Row 2: Category & Release Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Icyiciro (Category)
                  </label>
                  <select
                    value={editingSong.category_id || ''}
                    onChange={e => setEditingSong({ ...editingSong, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Itariki yo Gusohoka (Release Date)
                  </label>
                  <input
                    type="date"
                    value={editingSong.release_date || ''}
                    onChange={e => setEditingSong({ ...editingSong, release_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              {/* Row 3: Release Status & Publishing Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Ubwoko bwo Gusohora (Release Status)
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="release_status"
                        checked={editingSong.release_status === 'released'}
                        onChange={() => setEditingSong({ ...editingSong, release_status: 'released' })}
                      />
                      <span>Yasohotse (Released)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="release_status"
                        checked={editingSong.release_status === 'unreleased'}
                        onChange={() => setEditingSong({ ...editingSong, release_status: 'unreleased' })}
                      />
                      <span>Ntirakwirakwizwa (Unreleased)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Kugaragara (Publishing Status)
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="song_status"
                        checked={editingSong.status === 'published'}
                        onChange={() => setEditingSong({ ...editingSong, status: 'published' })}
                      />
                      <span>Bona buri wese (Published)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="song_status"
                        checked={editingSong.status === 'draft'}
                        onChange={() => setEditingSong({ ...editingSong, status: 'draft' })}
                      />
                      <span>Bika nka Draft</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ubusobanuro cyangwa Ubutumwa (Description)
                </label>
                <input
                  type="text"
                  value={editingSong.description || ''}
                  onChange={e => setEditingSong({ ...editingSong, description: e.target.value })}
                  placeholder="Amagambo make asobanura indirimbo n'igisobanuro cyayo..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {/* Cover Image URL & Direct Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ifoto y'Indirimbo (Cover Image URL cyangwa Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingSong.cover_image_url || ''}
                    onChange={e => setEditingSong({ ...editingSong, cover_image_url: e.target.value })}
                    placeholder="https://... cyangwa kanda kuri buto yo guhitamo ifoto"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                  <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Hitamo Ifoto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                </div>
                {editingSong.cover_image_url && (
                  <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={editingSong.cover_image_url}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Lyrics Textarea */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amagambo y'Indirimbo (Song Lyrics)
                </label>
                <textarea
                  rows={6}
                  value={editingSong.lyrics || ''}
                  onChange={e => setEditingSong({ ...editingSong, lyrics: e.target.value })}
                  placeholder="Injiza amagambo yose y'indirimbo hano..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* Solfa notation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amanota ya Solfa (Tonic Sol-fa Notation)
                </label>
                <textarea
                  rows={3}
                  value={editingSong.solfa_notation || ''}
                  onChange={e => setEditingSong({ ...editingSong, solfa_notation: e.target.value })}
                  placeholder="Urugero: d : m | s : - | d' : t | l : - ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-mono"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Reba mbere (Live Preview)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  disabled={isSaving}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Reka (Cancel)
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveSong('draft')}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs"
                >
                  {isSaving ? 'Kubika...' : 'Bika nka Draft'}
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveSong('published')}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl font-extrabold text-xs shadow-xs"
                >
                  {isSaving ? 'Gutunganya...' : 'Emeza & Tangaza (Publish)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {isPreviewOpen && editingSong && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-900" />
                <span>Uko Izaboneka (Preview)</span>
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingSong.cover_image_url && (
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-100">
                <img
                  src={editingSong.cover_image_url}
                  alt={editingSong.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold text-[10px] rounded-md">
                  {editingSong.release_status === 'unreleased' ? 'Unreleased' : 'Released'}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {editingSong.release_date || 'Nta tariki'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 font-serif">
                {editingSong.title || 'Umutwe w\'Indirimbo'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {editingSong.composer || 'La Lumiere Choir'}
              </p>
            </div>

            {editingSong.description && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl">
                {editingSong.description}
              </p>
            )}

            {editingSong.lyrics ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {editingSong.lyrics}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Nta magambo yashyizwemo</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-blue-950 text-white font-bold text-xs rounded-xl"
              >
                Funga Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        title="Gusiba iyi ndirimbo?"
        message="Uremeza ko ushaka gusiba iyi ndirimbo mu buryo bwa Admin? Izavanwa mu ndirimbo ziboneka ku bakunzi ba Korali."
        confirmText="Yego, Siba"
        cancelText="Reka"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteSong}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
