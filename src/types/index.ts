export type UserRole = 'super_admin' | 'admin' | 'content_admin' | 'moderator' | 'normal_user' | 'member' | 'choir_member' | 'supporter';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_disabled?: number | boolean;
  comments_count?: number;
  donations_count?: number;
  created_at?: string;
}

export interface UserProfile extends User {
  full_name?: string;
  choir_voice?: string;
}

export interface SongCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
  song_count?: number;
}

export interface AudioTrack {
  id: string;
  song_id: string;
  title: string;
  track_type: 'full_song' | 'melody' | 'instrumental' | 'vocal_guide' | 'practice_track';
  audio_url: string;
  duration_seconds: number;
  file_size_bytes?: number;
  mime_type?: string;
  original_filename?: string;
  plays_count?: number;
  created_at?: string;
  song_title?: string;
  song_release_status?: string;
  composer?: string;
  cover_image_url?: string;
}

export interface Song {
  id: string;
  title: string;
  song_number?: string;
  composer?: string;
  category_id?: string;
  category_name?: string;
  release_status: 'released' | 'unreleased';
  status?: 'draft' | 'published';
  is_deleted?: number;
  deleted_at?: string;
  release_date?: string;
  description?: string;
  cover_image_url?: string;
  views_count?: number;
  shares_count?: number;
  is_favorite?: boolean;
  has_audio?: boolean;
  audio_count?: number;
  comments_count?: number;
  lyrics?: string;
  solfa_notation?: string;
  language?: string;
  audio_tracks?: AudioTrack[];
  is_locked?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface Comment {
  id: string;
  song_id: string;
  song_title?: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_disabled?: boolean;
  user_role: string;
  avatar_url?: string;
  parent_id?: string | null;
  content: string;
  status: 'visible' | 'hidden' | 'flagged';
  likes_count: number;
  reports_count: number;
  created_at: string;
  replies?: Comment[];
}

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  image_url?: string;
  status: 'draft' | 'published';
  created_at?: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  doc_type: 'sheet_music' | 'solfa_guide' | 'rehearsal_schedule' | 'general' | string;
  file_url: string;
  song_id?: string;
  song_title?: string;
  file_size_bytes?: number;
  mime_type?: string;
  original_filename?: string;
  status: 'draft' | 'published';
  created_at?: string;
}

export interface ContentArticle {
  id: string;
  title: string;
  type: 'news' | 'devotional' | 'video' | 'notice';
  content: string;
  summary?: string;
  cover_image_url?: string;
  video_url?: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ImageItem {
  id: string;
  title: string;
  url: string;
  category: 'song_cover' | 'choir_photo' | 'event_image' | 'logo' | 'general';
  file_size_bytes?: number;
  mime_type?: string;
  original_filename?: string;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  resource?: string;
  resource_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AdminMetrics {
  totalUsers: number;
  adminUsers: number;
  disabledUsers: number;
  totalSongs: number;
  publishedSongs: number;
  draftSongs: number;
  releasedSongs: number;
  unreleasedSongs: number;
  deletedSongs: number;
  totalAudio: number;
  totalImages: number;
  totalComments: number;
  pendingComments: number;
  totalAnnouncements: number;
  totalEvents: number;
  totalDocuments: number;
  totalArticles: number;
  successfulDonationsCount: number;
  totalDonationsAmount: number;
  pendingDonationsCount: number;
  recentActivity: ActivityLog[];
}

export interface PaymentTransaction {
  id: string;
  internal_reference: string;
  provider_reference?: string;
  user_id?: string;
  donor_name: string;
  donor_phone: string;
  amount: number;
  currency: string;
  provider_slug: 'mtn-momo' | 'airtel-money' | string;
  donation_purpose: string;
  status: 'pending' | 'processing' | 'successful' | 'failed' | 'cancelled';
  failure_reason?: string;
  is_anonymous: number | boolean;
  created_at: string;
  completed_at?: string;
  user_email?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  is_enabled: number | boolean;
  environment: 'sandbox' | 'production';
  api_endpoint?: string;
  merchant_account_id?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  status?: 'draft' | 'published';
  is_active: number | boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  is_read: number | boolean;
  created_at: string;
}

export interface BrandingSettings {
  id: string;
  main_logo_url?: string;
  app_icon_url?: string;
  splash_logo_url?: string;
  light_logo_url?: string;
  dark_logo_url?: string;
  banner_image_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

export interface ChoirInfo {
  choir_name: string;
  affiliation: string;
  about_story: string;
  mission: string;
  vision: string;
  contact_phone: string;
  contact_email: string;
  socials: {
    youtube: string;
    instagram: string;
    facebook: string;
  };
}
