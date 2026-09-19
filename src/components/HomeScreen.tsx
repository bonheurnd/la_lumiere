import React, { useState, useEffect } from 'react';
import { Song, Announcement } from '../types';
import { ChoirLogo } from './ChoirLogo';
import { useBranding } from '../context/BrandingContext';
import { useAudio } from '../context/AudioContext';
import { Play, BookOpen, HeartHandshake, Sparkles, Lock, Clock, Music, ChevronRight, Bell } from 'lucide-react';

interface HomeScreenProps {
  onSelectSong: (songId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenSearch: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectSong,
  onNavigateToTab,
  onOpenSearch,
}) => {
  const { choirInfo } = useBranding();
  const { playTrack } = useAudio();

  const [songs, setSongs] = useState<Song[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [songsRes, annRes] = await Promise.all([
          fetch('/api/songs'),
          fetch('/api/announcements'),
        ]);

        if (songsRes.ok) {
          const songsData = await songsRes.json();
          setSongs(songsData);
        }
        if (annRes.ok) {
          const annData = await annRes.json();
          setAnnouncements(annData);
        }
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const releasedSongs = songs.filter(s => s.release_status === 'released');
  const upcomingSongs = songs.filter(s => s.release_status === 'unreleased');
  const featuredSongs = releasedSongs.slice(0, 3);
  const latestReleases = releasedSongs.slice(0, 6);

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
    <div className="pb-24 space-y-6">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white p-6 shadow-xl border border-blue-900/40">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
          {/* Official Choir Logo / Clearly marked placeholder */}
          <ChoirLogo size="lg" variant="splash" className="mb-3.5 shadow-md" />

          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 mb-2">
            ADEPR Nyanza • Kicukiro District, Rwanda
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-50 font-serif">
            Welcome to {choirInfo.choir_name}
          </h1>

          <p className="mt-2 text-sm text-slate-300 font-medium leading-relaxed">
            {choirInfo.about_story ? choirInfo.about_story.substring(0, 110) + '...' : 'Sing, worship, listen, and support our ministry.'}
          </p>

          <p className="mt-1 text-xs text-amber-300/90 font-semibold italic">
            “Sing, worship, listen, and support our ministry.”
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              onClick={() => onNavigateToTab('songs')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Soma Indirimbo (Songbook)</span>
            </button>

            <button
              onClick={() => onNavigateToTab('support')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/20 shadow-sm transition-transform active:scale-95"
            >
              <HeartHandshake className="w-4 h-4 text-rose-400" />
              <span>Support Choir</span>
            </button>
          </div>
        </div>
      </section>

      {/* Choir Announcements */}
      {announcements.length > 0 && (
        <section className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
            <Bell className="w-4 h-4 text-amber-700" />
            <span>Amatangazo n'Amakuru ya Korali (Announcements)</span>
          </div>
          <div className="space-y-2">
            {announcements.map(ann => (
              <div key={ann.id} className="text-xs bg-white/90 p-3 rounded-xl border border-amber-100 shadow-2xs">
                <h4 className="font-bold text-slate-900">{ann.title}</h4>
                <p className="text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Songs Section */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="font-bold text-base text-slate-900 tracking-tight">
              Featured Songs (Indirimbo Zatoranyijwe)
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('songs')}
            className="text-xs font-semibold text-blue-800 hover:text-blue-950 flex items-center gap-0.5"
          >
            <span>Zose</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {featuredSongs.map(song => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                {song.cover_image_url ? (
                  <img
                    src={song.cover_image_url}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-950 text-amber-400">
                    <ChoirLogo size="sm" />
                  </div>
                )}
                {song.song_number && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold rounded-md">
                    {song.song_number}
                  </span>
                )}
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                  Released
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-900 transition-colors">
                  {song.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {song.composer || 'La Lumiere Choir'}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleQuickPlay(e, song)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-amber-600" />
                  <span>Umva</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSong(song.id);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Soma</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Releases */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-800" />
            <h2 className="font-bold text-base text-slate-900 tracking-tight">
              Latest Releases (Izasohotse Vuba)
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('songs')}
            className="text-xs font-semibold text-blue-800 hover:text-blue-950 flex items-center gap-0.5"
          >
            <span>Reba zose</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {latestReleases.map((song, idx) => (
            <div
              key={song.id}
              onClick={() => onSelectSong(song.id)}
              className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                  {idx + 1}
                </span>
                <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  {song.cover_image_url ? (
                    <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-900 text-amber-300 text-[10px] font-bold">
                      LLC
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {song.song_number ? `${song.song_number} • ` : ''}{song.composer || 'La Lumiere Choir'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {song.has_audio && (
                  <button
                    onClick={(e) => handleQuickPlay(e, song)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                    title="Play audio"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSong(song.id);
                  }}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                  title="Read lyrics"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming / Unreleased Songs Section */}
      {upcomingSongs.length > 0 && (
        <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-base text-slate-100 tracking-tight">
                Upcoming Songs (Iteganyijwe Gusohoka)
              </h2>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-400/30">
              Protected Content
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 leading-relaxed">
            Izi ndirimbo ziracyari mu myiteguro itarasohoka ku mugaragaro. Amagambo yazo arinzwe, asomwa gusa n'abafite ijambo ry'ibanga ry'imyitozo (Protected lyrics).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingSongs.map(song => (
              <div
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Coming Soon</span>
                    {song.song_number && (
                      <span className="text-[10px] font-mono text-slate-400">{song.song_number}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {song.description || 'Yarindishijwe umutekano w\'ijambo ry\'ibanga'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-300 font-semibold">
                    <span>Fungura n'ijambo ry'ibanga</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prominent Support Banner */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-blue-950 text-white rounded-3xl p-6 text-center shadow-xl border border-emerald-800/50 relative overflow-hidden">
        <div className="relative z-10 max-w-md mx-auto">
          <HeartHandshake className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Support La Lumiere Choir
          </h2>
          <p className="mt-1.5 text-xs text-emerald-100 leading-relaxed">
            Shyigikira umurimo w'ivugabutumwa mu ndirimbo ukoresheje MTN Mobile Money cyangwa Airtel Money mu Rwanda.
          </p>

          <button
            onClick={() => onNavigateToTab('support')}
            className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-extrabold text-xs shadow-lg transition-transform active:scale-95"
          >
            <span>Tanga Umusanzu (Support La Lumiere Choir)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
