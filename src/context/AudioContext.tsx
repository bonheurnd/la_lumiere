import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AudioTrack, Song } from '../types';

interface AudioContextType {
  currentTrack: AudioTrack | null;
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isExpanded: boolean;
  playTrack: (track: AudioTrack, song?: Song) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  skip: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setIsExpanded: (expanded: boolean) => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
    };
  }, []);

  const playTrack = (track: AudioTrack, song?: Song) => {
    if (!audioRef.current) return;
    setCurrentTrack(track);
    if (song) setCurrentSong(song);

    audioRef.current.src = track.audio_url;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = volume;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      // Increment play count on backend
      fetch(`/api/audio-tracks/${track.id}/play`, { method: 'POST' }).catch(() => {});
    }).catch(err => {
      console.warn('Audio playback error (user interaction may be needed):', err);
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.warn);
    }
  };

  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
  };

  const resume = () => {
    if (audioRef.current && currentTrack) audioRef.current.play().catch(console.warn);
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 9999);
      seek(newTime);
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setCurrentSong(null);
    setIsPlaying(false);
    setIsExpanded(false);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        isExpanded,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        skip,
        setVolume,
        setPlaybackRate,
        setIsExpanded,
        closePlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
