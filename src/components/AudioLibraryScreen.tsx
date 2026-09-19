import React, { useState, useEffect } from 'react';
import { AudioTrack } from '../types';
import { useAudio } from '../context/AudioContext';
import { Music, Play, Pause, Search, Headphones, BookOpen } from 'lucide-react';

interface AudioLibraryScreenProps {
  onOpenSongLyrics: (songId: string) => void;
}

export const AudioLibraryScreen: React.FC<AudioLibraryScreenProps> = ({ onOpenSongLyrics }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useAudio();

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== 'all') params.append('type', activeFilter);
      const res = await fetch(`/api/audio-tracks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data);
      }
    } catch (err) {
      console.error('Failed to load audio tracks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [activeFilter]);

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.song_title && t.song_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.composer && t.composer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDuration = (secs: number) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filterTabs = [
    { id: 'all', label: 'Byose (All)' },
    { id: 'full_song', label: 'Indirimbo Yose (Full Song)' },
    { id: 'melody', label: 'Ijwi ry\'Intangiriro (Melody)' },
    { id: 'instrumental', label: 'Ibikoresho (Instrumental)' },
    { id: 'vocal_guide', label: 'Ubuyobozi bw\'Ijwi (Vocal Guide)' },
    { id: 'practice_track', label: 'Imyitozo (Practice)' },
  ];

  return (
    <div className="pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
            Audio Library (Amajwi n'Umuziki)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Umva indirimbo, amashami y'amajwi, n'ibikoresho by'umuziki bya La Lumiere Choir
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0">
          <Headphones className="w-5 h-5" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Shakisha umuziki, intonere, cyangwa indirimbo..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
        />
      </div>

      {/* Track Type Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
              activeFilter === tab.id
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tracks List */}
      {isLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Gufungura amajwi...</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <Music className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">Nta majwi abonetse</h3>
          <p className="text-xs text-slate-400">
            Nta majwi ahuye n'ibyo mwashakishije muri iki cyiciro.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTracks.map(track => {
            const isThisTrackPlaying = isPlaying && currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  currentTrack?.id === track.id
                    ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      if (isThisTrackPlaying) {
                        togglePlay();
                      } else {
                        playTrack(track);
                      }
                    }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs ${
                      currentTrack?.id === track.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                  >
                    {isThisTrackPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {track.track_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDuration(track.duration_seconds)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">
                      {track.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 truncate">
                      Indirimbo: <span className="font-semibold text-slate-700">{track.song_title || 'La Lumiere Choir'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {track.song_id && (
                    <button
                      onClick={() => onOpenSongLyrics(track.song_id)}
                      className="p-2 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Soma amagambo (Read Lyrics)"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
