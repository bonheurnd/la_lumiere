import React, { useState, useEffect, useRef } from 'react';
import { Song, AudioTrack, ImageItem } from '../../types';
import {
  Music,
  Image as ImageIcon,
  Upload,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  FileAudio,
  Volume2,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminMediaTabProps {
  songs: Song[];
  onRefreshSongs: () => void;
}

export const AdminMediaTab: React.FC<AdminMediaTabProps> = ({ songs, onRefreshSongs }) => {
  const [mediaType, setMediaType] = useState<'audio' | 'images'>('audio');

  // Audio state
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string>(songs[0]?.id || '');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackType, setTrackType] = useState<
    'full_song' | 'melody' | 'instrumental' | 'vocal_guide' | 'practice_track'
  >('full_song');
  const [durationSeconds, setDurationSeconds] = useState(180);
  const [audioFileUrl, setAudioFileUrl] = useState('');
  const [audioFileName, setAudioFileName] = useState('');
  const [audioFileSize, setAudioFileSize] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isSavingTrack, setIsSavingTrack] = useState(false);

  // Audio Playback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image state
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [imageCategory, setImageCategory] = useState<
    'song_cover' | 'choir_photo' | 'event_image' | 'logo' | 'general'
  >('choir_photo');
  const [imageTitle, setImageTitle] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  // Delete confirms
  const [deleteAudioId, setDeleteAudioId] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Audio Tracks
  const fetchAudioTracks = async () => {
    try {
      setIsLoadingAudio(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch('/api/admin/audio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAudioTracks(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Fetch Images
  const fetchImages = async () => {
    try {
      setIsLoadingImages(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch('/api/admin/images', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  useEffect(() => {
    fetchAudioTracks();
    fetchImages();
  }, []);

  // Handle Audio File Selection & Upload
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Dosiye y\'ijwi ntigomba kurenza 50MB (Audio max 50MB)');
      return;
    }

    try {
      setIsUploadingAudio(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setAudioFileUrl(data.url);
      setAudioFileName(file.name);
      setAudioFileSize(file.size);
      if (!trackTitle) {
        setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gushyiraho dosiye y\'ijwi byanze');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Save Audio Track to Song
  const handleSaveAudioTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSongId || !audioFileUrl || !trackTitle) {
      setErrorMsg('Hitamo indirimbo, shyiramo umutwe w\'ijwi, kandi ushyireho dosiye');
      return;
    }

    try {
      setIsSavingTrack(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');

      const res = await fetch(`/api/admin/songs/${selectedSongId}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trackTitle.trim(),
          track_type: trackType,
          audio_url: audioFileUrl,
          duration_seconds: durationSeconds || 180,
          file_size_bytes: audioFileSize,
          original_filename: audioFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to attach audio');

      setSuccessMsg('Ijwi ryashyizwe ku ndirimbo neza!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setTrackTitle('');
      setAudioFileUrl('');
      setAudioFileName('');
      fetchAudioTracks();
      onRefreshSongs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kubika ijwi byanze');
    } finally {
      setIsSavingTrack(false);
    }
  };

  // Delete Audio Track
  const handleDeleteAudio = async () => {
    if (!deleteAudioId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/audio/${deleteAudioId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteAudioId(null);
        if (playingTrackId === deleteAudioId) {
          setPlayingTrackId(null);
          if (audioRef.current) audioRef.current.pause();
        }
        fetchAudioTracks();
        onRefreshSongs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Play/Pause
  const handleTogglePlay = (track: AudioTrack) => {
    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
      if (audioRef.current) {
        audioRef.current.src = track.audio_url;
        audioRef.current.play().catch(e => console.warn('Playback error:', e));
      }
    }
  };

  // Image Upload File Handler
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ifoto ntigomba kurenza 10MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setPreviewImageUrl(data.url);
      if (!imageTitle) {
        setImageTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ifoto yanze kwinjira');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Image to Library
  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewImageUrl || !imageTitle) {
      setErrorMsg('Shyiramo izina ry\'ifoto n\'ifoto nyirizina');
      return;
    }

    try {
      setIsSavingImage(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');

      const res = await fetch('/api/admin/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: imageTitle.trim(),
          url: previewImageUrl,
          category: imageCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save image');

      setSuccessMsg('Ifoto yabitswe mu bubiko!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setImageTitle('');
      setPreviewImageUrl('');
      fetchImages();
    } catch (err: any) {
      setErrorMsg(err.message || 'Kubika ifoto byanze');
    } finally {
      setIsSavingImage(false);
    }
  };

  // Delete Image
  const handleDeleteImage = async () => {
    if (!deleteImageId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/images/${deleteImageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteImageId(null);
        fetchImages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Link Helper
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setSuccessMsg('Ihuza (URL) ryakoporowe!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingTrackId(null)}
        className="hidden"
      />

      {/* Top Media Switcher */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-900" />
              <span>Ububiko bw'Amajwi & Amafoto (Media Manager)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Gushyiraho indirimbo z'amajwi (MP3, WAV) n'amafoto ya Korali
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setMediaType('audio')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                mediaType === 'audio'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Amajwi ({audioTracks.length})</span>
            </button>
            <button
              onClick={() => setMediaType('images')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                mediaType === 'images'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Amafoto ({images.length})</span>
            </button>
          </div>
        </div>

        {/* Success & Error alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ================= AUDIO TAB ================= */}
      {mediaType === 'audio' && (
        <div className="space-y-4">
          {/* Audio Upload Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Plus className="w-4 h-4 text-blue-900" />
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Ongeraho Ijwi ku Ndirimbo (Upload New Audio Track)
              </h3>
            </div>

            <form onSubmit={handleSaveAudioTrack} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Song */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hitamo Indirimbo (Target Song) *
                  </label>
                  <select
                    value={selectedSongId}
                    onChange={e => setSelectedSongId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    {songs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.release_status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Track Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Umutwe w'Ijwi (Track Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trackTitle}
                    onChange={e => setTrackTitle(e.target.value)}
                    placeholder="Urugero: Indirimbo Yuzuye (Studio Master)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                {/* Track Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ubwoko bw'Ijwi (Track Type)
                  </label>
                  <select
                    value={trackType}
                    onChange={e => setTrackType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="full_song">Full Song (Indirimbo Yuzuye)</option>
                    <option value="melody">Melody Guide (Ijwi ry'umudiho)</option>
                    <option value="instrumental">Instrumental (Inyunganizi y'ibicurangisho)</option>
                    <option value="vocal_guide">Vocal Guide (Ibyiciro by'amajwi)</option>
                    <option value="practice_track">Practice Track (Imyitozo)</option>
                  </select>
                </div>
              </div>

              {/* Upload File Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hitamo dosiye y'ijwi (MP3, WAV, M4A, OGG - Max 50MB)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <label className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{isUploadingAudio ? 'Gushyiraho...' : 'Hitamo Dosiye (Browse)'}</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.ogg"
                      disabled={isUploadingAudio}
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-slate-500 text-xs truncate">
                    {audioFileName ? (
                      <span className="font-semibold text-slate-900">
                        {audioFileName} ({(audioFileSize / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    ) : (
                      'Nta dosiye iratoranywa'
                    )}
                  </div>

                  {audioFileUrl && (
                    <audio controls className="w-full sm:w-64 h-8 ml-auto">
                      <source src={audioFileUrl} />
                    </audio>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingTrack || !audioFileUrl}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Music className="w-4 h-4 text-amber-400" />
                  <span>{isSavingTrack ? 'Kubika...' : 'Bika Ijwi ry\'Indirimbo (Save Track)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Audio Tracks List */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Amajwi Yose Aherutse Gushyirwaho ({audioTracks.length})
              </h3>
              <button
                onClick={fetchAudioTracks}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Vugurura"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingAudio ? (
              <div className="py-8 text-center text-xs text-slate-400">Gushakisha amajwi...</div>
            ) : audioTracks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nta majwi arashyirwa mu bubiko
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {audioTracks.map(track => {
                  const isPlaying = playingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleTogglePlay(track)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                            isPlaying
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-blue-900 text-white'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate">{track.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-blue-950">
                              {track.song_title || 'Indirimbo'}
                            </span>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 bg-slate-100 rounded-md uppercase text-[9px] font-bold">
                              {track.track_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleCopyLink(track.audio_url)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          title="Koporora URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteAudioId(track.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Siba iri jwi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= IMAGES TAB ================= */}
      {mediaType === 'images' && (
        <div className="space-y-4">
          {/* Upload Image Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Plus className="w-4 h-4 text-blue-900" />
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Gushyiraho Ifoto Nshya (Upload New Image)
              </h3>
            </div>

            <form onSubmit={handleSaveImage} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Umutwe / Izina ry'Ifoto *
                  </label>
                  <input
                    type="text"
                    required
                    value={imageTitle}
                    onChange={e => setImageTitle(e.target.value)}
                    placeholder="Urugero: Ifoto ya Korali mu giterane"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Icyiciro cy'Ifoto (Category)
                  </label>
                  <select
                    value={imageCategory}
                    onChange={e => setImageCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="choir_photo">Amafoto ya Korali (Choir Photos)</option>
                    <option value="song_cover">Igifuniko cy'indirimbo (Song Cover)</option>
                    <option value="event_image">Amafoto y'ibikorwa (Event Poster)</option>
                    <option value="logo">Ikirango / Logo</option>
                    <option value="general">Birasanzwe (General)</option>
                  </select>
                </div>
              </div>

              {/* Upload Input */}
              <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                <label className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isUploadingImage ? 'Gushyiraho...' : 'Hitamo Ifoto (Browse)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {previewImageUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={previewImageUrl}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-slate-600 text-xs font-semibold">
                      Ifoto yashyizweho neza. Kanda "Bika Ifoto" hasi.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingImage || !previewImageUrl}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>{isSavingImage ? 'Kubika...' : 'Bika Ifoto (Save Image)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Images Grid Gallery */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                Amafoto Ari mu Bubiko ({images.length})
              </h3>
              <button
                onClick={fetchImages}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                title="Vugurura"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingImages ? (
              <div className="py-8 text-center text-xs text-slate-400">Gushakisha amafoto...</div>
            ) : images.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nta foto irashyirwa mu bubiko
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(img => (
                  <div
                    key={img.id}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square"
                  >
                    <img
                      src={img.url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient Overlay with title & delete */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white opacity-95">
                      <p className="text-[11px] font-bold truncate leading-tight">{img.title}</p>
                      <span className="text-[9px] text-slate-300 capitalize">{img.category}</span>

                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => handleCopyLink(img.url)}
                          className="p-1 bg-white/20 hover:bg-white/40 rounded-lg text-white"
                          title="Koporora URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteImageId(img.id)}
                          className="p-1 bg-rose-600/80 hover:bg-rose-600 rounded-lg text-white"
                          title="Siba ifoto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM AUDIO */}
      <ConfirmDialog
        isOpen={Boolean(deleteAudioId)}
        title="Gusiba iri jwi?"
        message="Uremeza ko ushaka gusiba iri jwi ry'indirimbo? Ntabwo rizakomeza gukinwa."
        confirmText="Yego, Siba"
        cancelText="Reka"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteAudio}
        onCancel={() => setDeleteAudioId(null)}
      />

      {/* DELETE CONFIRM IMAGE */}
      <ConfirmDialog
        isOpen={Boolean(deleteImageId)}
        title="Gusiba iyi foto?"
        message="Uremeza ko ushaka gusiba iyi foto mu bubiko bwa Korali?"
        confirmText="Yego, Siba"
        cancelText="Reka"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteImage}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  );
};
