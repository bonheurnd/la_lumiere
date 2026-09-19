import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { Search, X, BookOpen, Music, ChevronRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (songId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSong,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/songs?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-4 pt-12 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3 shadow-2xl border border-slate-200">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Shakisha indirimbo, amagambo yayo, umwanditsi..."
            className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-1.5 pt-1">
          {isLoading ? (
            <p className="text-center py-6 text-xs text-slate-400">Gushakisha...</p>
          ) : results.length > 0 ? (
            results.map(song => (
              <div
                key={song.id}
                onClick={() => {
                  onSelectSong(song.id);
                  onClose();
                }}
                className="p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 flex items-center justify-between cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-950 flex items-center justify-center font-bold text-[10px] shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{song.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate">
                      {song.song_number ? `${song.song_number} • ` : ''}{song.composer || 'La Lumiere Choir'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))
          ) : query ? (
            <p className="text-center py-6 text-xs text-slate-400">
              Nta ndirimbo ibonetse ihuye na "{query}"
            </p>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 space-y-1">
              <p>Andika amagambo ashakishwa hejuru.</p>
              <p className="text-[11px] text-slate-300">
                Urugero: Nzamuhimbaza, Umucyo, #01, cyangwa igitero runaka.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
