import React from 'react';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, RotateCcw, RotateCw, Volume2, X, ChevronUp, ChevronDown, BookOpen, Music2 } from 'lucide-react';

interface GlobalAudioPlayerProps {
  onOpenSong?: (songId: string) => void;
}

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({ onOpenSong }) => {
  const {
    currentTrack,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isExpanded,
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    setVolume,
    setIsExpanded,
    closePlayer,
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Mini Docked Player (Above Bottom Navigation) */}
      {!isExpanded && (
        <div className="fixed bottom-[60px] left-0 right-0 z-30 max-w-4xl mx-auto px-3 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-slate-700/60 flex items-center justify-between gap-3">
            {/* Click info to expand */}
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                {currentSong?.cover_image_url ? (
                  <img
                    src={currentSong.cover_image_url}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music2 className="w-5 h-5 text-amber-300" />
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-amber-400 animate-pulse rounded-full" />
                    <span className="w-1 h-5 bg-amber-300 animate-pulse delay-75 rounded-full" />
                    <span className="w-1 h-2.5 bg-amber-400 animate-pulse delay-150 rounded-full" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs truncate text-slate-100 leading-tight">
                  {currentTrack.title}
                </p>
                <p className="text-[10px] text-amber-300 truncate font-medium">
                  {currentSong?.title || 'La Lumiere Choir'} • {currentTrack.track_type.replace('_', ' ')}
                </p>
              </div>
            </button>

            {/* Quick Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md active:scale-95 transition-transform"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Fungura umuziki wose"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              <button
                onClick={closePlayer}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Funga"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Subtle timeline progress bar */}
          <div className="h-1 bg-slate-800 rounded-b-xl overflow-hidden mx-1.5 -mt-1">
            <div
              className="h-full bg-amber-400 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Full Screen Audio Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl text-white flex flex-col justify-between p-6 max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                La Lumiere Audio Player
              </span>
              <p className="text-xs text-slate-400">{currentTrack.track_type.replace('_', ' ').toUpperCase()}</p>
            </div>
            <button
              onClick={closePlayer}
              className="p-2 text-slate-400 hover:text-red-400 rounded-full bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Artwork Card */}
          <div className="my-auto text-center px-4">
            <div className="w-56 h-56 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center relative group">
              {currentSong?.cover_image_url ? (
                <img
                  src={currentSong.cover_image_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music2 className="w-20 h-20 text-amber-400" />
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-extrabold text-xl tracking-tight text-slate-100">
                {currentTrack.title}
              </h3>
              <p className="text-amber-300 font-medium text-sm mt-1">
                {currentSong?.title || 'La Lumiere Choir'}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {currentSong?.composer || 'ADEPR Nyanza, Kicukiro'}
              </p>
            </div>

            {/* Read lyrics shortcut */}
            {currentSong && onOpenSong && (
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onOpenSong(currentSong.id);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-700/50 text-blue-200 rounded-full text-xs font-semibold transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Soma Amagambo y'Indirimbo (Read Lyrics)</span>
              </button>
            )}
          </div>

          {/* Controls Container */}
          <div className="space-y-4 pb-4">
            {/* Scrubber */}
            <div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={e => seek(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => skip(-10)}
                className="p-3 text-slate-300 hover:text-white hover:bg-slate-900 rounded-full active:scale-90 transition-transform"
                title="Subira inyuma amasegonda 10 (-10s)"
              >
                <RotateCcw className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center font-bold shadow-xl active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="p-3 text-slate-300 hover:text-white hover:bg-slate-900 rounded-full active:scale-90 transition-transform"
                title="Komeza imbere amasegonda 10 (+10s)"
              >
                <RotateCw className="w-6 h-6" />
              </button>
            </div>

            {/* Speed & Volume Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              {/* Playback speed selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Speed:</span>
                {[0.75, 1, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                      playbackRate === rate
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-16 accent-amber-400 h-1 bg-slate-800 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
