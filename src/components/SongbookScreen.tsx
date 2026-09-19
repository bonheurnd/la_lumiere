import React, { useState, useEffect } from 'react';
import { Song, SongCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { Search, Filter, BookOpen, Music, Heart, Play, Lock, ArrowUpDown, X } from 'lucide-react';

interface SongbookScreenProps {
  onSelectSong: (songId: string) => void;
  initialSearchQuery?: string;
}

export const SongbookScreen: React.FC<SongbookScreenProps> = ({
  onSelectSong,
  initialSearchQuery = '',
}) => {
  const { user } = useAuth();
  const { playTrack } = useAudio();

  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (sortBy) params.append('sort', sortBy);

      const token = localStorage.getItem('lalumiere_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = onlyFavorites ? '/api/favorites' : `/api/songs?${params.toString()}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/songs/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSongs();
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, statusFilter, sortBy, onlyFavorites]);

  const toggleFavorite = async (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) {
      alert('Ugomba kwinjira muri konti yawe kugira ngo ushyire indirimbo mu zo ukunda (Please login to favorite)');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/favorites/${songId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(prev =>
          prev.map(s => (s.id === songId ? { ...s, is_favorite: data.is_favorite } : s))
        );
      }
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  const handleQuickPlay = async (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/songs/${song.id}`);
      if (res.ok) {
        const detail: Song = await res.json();
        if (detail.audio_tracks && detail.audio_tracks.length > 0) {
          playTrack(detail.audio_tracks[0], detail);
        } else {
          onSelectSong(song.id);
        }
      }
    } catch (err) {
      onSelectSong(song.id);
    }
  };

  return (
    <div className="pb-28 space-y-4">
      {/* Title & Stats */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
            Digital Songbook (Igitabo cy'Indirimbo)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indirimbo zo guhimbaza no gusingiza Imana muri La Lumiere Choir
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-full">
          {songs.length} indirimbo
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Shakisha umutwe, amagambo y'indirimbo, umwanditsi..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setOnlyFavorites(false);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
            selectedCategory === 'all' && !onlyFavorites
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          Zose (All)
        </button>

        {user && (
          <button
            onClick={() => {
              setOnlyFavorites(true);
              setSelectedCategory('all');
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              onlyFavorites
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Izo nkunda (Favorites)</span>
          </button>
        )}

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setOnlyFavorites(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              selectedCategory === cat.id && !onlyFavorites
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat.name.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Filter and Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Zose
          </button>
          <button
            onClick={() => setStatusFilter('released')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'released' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Released
          </button>
          <button
            onClick={() => setStatusFilter('unreleased')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              statusFilter === 'unreleased' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Unreleased
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 py-1 px-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-900"
          >
            <option value="latest">Iziheruka (Latest)</option>
            <option value="popular">Izakunzwe (Most Popular)</option>
            <option value="number">Umubare (Song Number)</option>
            <option value="oldest">Iza kera (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Songs List */}
      {isLoading ? (
        <div className="space-y-3 py-6 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Gushakisha indirimbo...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">Nta ndirimbo ibonetse</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Ntacyo twabonye gihura n'ibyo mwashakishije. Gerageza gukoresha amagambo amwe cyangwa guhindura icyiciro.
          </p>
          {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || onlyFavorites) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStatusFilter('all');
                setOnlyFavorites(false);
              }}
              className="mt-2 text-xs font-semibold text-blue-800 hover:underline"
            >
              Kuriho akayunguruzo kose
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {songs.map(song => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-blue-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              {/* Song Information */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                  {song.cover_image_url ? (
                    <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-950 text-amber-400 text-xs font-bold font-serif">
                      LLC
                    </div>
                  )}
                  {song.release_status === 'unreleased' && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center text-amber-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {song.song_number && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {song.song_number}
                      </span>
                    )}
                    <span
                      className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-md ${
                        song.release_status === 'released'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {song.release_status}
                    </span>
                    {song.has_audio && (
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Music className="w-2.5 h-2.5" />
                        Audio
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-900 transition-colors mt-0.5">
                    {song.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 truncate">
                    {song.composer || 'La Lumiere Choir'} {song.category_name ? `• ${song.category_name.split(' (')[0]}` : ''}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Favorite Toggle */}
                <button
                  onClick={(e) => toggleFavorite(e, song.id)}
                  className={`p-2 rounded-full transition-colors ${
                    song.is_favorite
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-300 hover:text-rose-500 hover:bg-slate-50'
                  }`}
                  title={song.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-current' : ''}`} />
                </button>

                {/* Audio quick play */}
                {song.has_audio && song.release_status === 'released' && (
                  <button
                    onClick={(e) => handleQuickPlay(e, song)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                    title="Play Audio"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSong(song.id);
                  }}
                  className="p-2 text-slate-400 group-hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                  title="Read Lyrics"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
