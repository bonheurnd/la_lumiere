import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'lalumiere.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability and performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    -- 1. Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    -- 2. Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'supporter',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role) REFERENCES roles(id)
    );

    -- 3. Song Categories
    CREATE TABLE IF NOT EXISTS song_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      display_order INTEGER DEFAULT 0
    );

    -- 4. Songs
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      song_number TEXT,
      composer TEXT,
      category_id TEXT,
      release_status TEXT NOT NULL DEFAULT 'released', -- 'released', 'unreleased'
      release_date TEXT,
      description TEXT,
      cover_image_url TEXT,
      access_password_hash TEXT, -- Hashed password for unreleased protected songs
      views_count INTEGER DEFAULT 0,
      shares_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES song_categories(id) ON DELETE SET NULL
    );

    -- 5. Lyrics
    CREATE TABLE IF NOT EXISTS lyrics (
      id TEXT PRIMARY KEY,
      song_id TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      language TEXT DEFAULT 'rw', -- 'rw' (Kinyarwanda), 'fr', 'en'
      solfa_notation TEXT, -- Tonic Sol-fa notation if available
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    -- 6. Audio Tracks
    CREATE TABLE IF NOT EXISTS audio_tracks (
      id TEXT PRIMARY KEY,
      song_id TEXT NOT NULL,
      title TEXT NOT NULL,
      track_type TEXT NOT NULL DEFAULT 'full_song', -- 'full_song', 'melody', 'instrumental', 'vocal_guide', 'practice_track'
      audio_url TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      plays_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    -- 7. Favorites
    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, song_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    -- 8. Comments
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      song_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'visible', -- 'visible', 'hidden', 'flagged'
      likes_count INTEGER DEFAULT 0,
      reports_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    -- 9. Comment Likes & Reports
    CREATE TABLE IF NOT EXISTS comment_reactions (
      user_id TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL, -- 'like', 'report'
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, comment_id, reaction_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    -- 10. Payment Providers
    CREATE TABLE IF NOT EXISTS payment_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL, -- 'MTN Mobile Money', 'Airtel Money'
      slug TEXT NOT NULL UNIQUE,
      is_enabled INTEGER DEFAULT 1,
      environment TEXT DEFAULT 'sandbox', -- 'sandbox', 'production'
      api_endpoint TEXT,
      merchant_account_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Payment Transactions & Donations
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      internal_reference TEXT UNIQUE NOT NULL,
      provider_reference TEXT,
      user_id TEXT,
      donor_name TEXT,
      donor_phone TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      provider_slug TEXT NOT NULL,
      donation_purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'successful', 'failed', 'cancelled'
      failure_reason TEXT,
      is_anonymous INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (provider_slug) REFERENCES payment_providers(slug)
    );

    -- 12. Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general', -- 'rehearsal', 'event', 'worship', 'general'
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL, -- 'song_release', 'announcement', 'donation_receipt', 'community'
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 14. Protected Content Access Grants (Logs of who unlocked unreleased songs)
    CREATE TABLE IF NOT EXISTS protected_content_access (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      song_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    -- 15. Branding Settings
    CREATE TABLE IF NOT EXISTS branding_settings (
      id TEXT PRIMARY KEY,
      main_logo_url TEXT,
      app_icon_url TEXT,
      splash_logo_url TEXT,
      light_logo_url TEXT,
      dark_logo_url TEXT,
      banner_image_url TEXT,
      primary_color TEXT DEFAULT '#1e3a8a', -- Deep royal choir blue
      secondary_color TEXT DEFAULT '#d97706', -- Warm gold
      accent_color TEXT DEFAULT '#2563eb', -- Vibrant worship blue
      background_color TEXT DEFAULT '#f8fafc',
      text_color TEXT DEFAULT '#0f172a',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. App Settings
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    -- 17. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 18. Images & Media Library
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general', -- 'song_cover', 'choir_photo', 'event_image', 'logo', 'general'
      file_url TEXT NOT NULL,
      file_size_bytes INTEGER DEFAULT 0,
      mime_type TEXT,
      original_filename TEXT,
      width INTEGER,
      height INTEGER,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    -- 19. Events
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      location TEXT,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published'
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    -- 20. Documents & PDFs
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT NOT NULL,
      file_size_bytes INTEGER DEFAULT 0,
      category TEXT DEFAULT 'sheet_music', -- 'sheet_music', 'rehearsal_guide', 'program', 'bulletin'
      status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published'
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    -- 21. Content Articles (Choir news, devotional messages, videos, important notices)
    CREATE TABLE IF NOT EXISTS content_articles (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- 'choir_news', 'devotional', 'video', 'notice'
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      published_date TEXT,
      status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'published'
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0
    );

    -- 22. Activity Logs
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(release_status);
    CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category_id);
    CREATE INDEX IF NOT EXISTS idx_audio_song ON audio_tracks(song_id);
    CREATE INDEX IF NOT EXISTS idx_comments_song ON comments(song_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);
  `);

  // Safe migrations for table alterations
  function safeAddColumn(table: string, columnDef: string) {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`).run();
    } catch (e) {
      // Column exists
    }
  }

  safeAddColumn('users', 'is_disabled INTEGER DEFAULT 0');
  safeAddColumn('songs', "status TEXT DEFAULT 'published'");
  safeAddColumn('songs', 'is_deleted INTEGER DEFAULT 0');
  safeAddColumn('songs', 'deleted_at DATETIME');
  safeAddColumn('songs', 'created_by TEXT');
  safeAddColumn('audio_tracks', 'file_size_bytes INTEGER DEFAULT 0');
  safeAddColumn('audio_tracks', 'mime_type TEXT');
  safeAddColumn('audio_tracks', 'original_filename TEXT');
  safeAddColumn('audio_tracks', 'created_by TEXT');
  safeAddColumn('audio_tracks', 'is_deleted INTEGER DEFAULT 0');
  safeAddColumn('announcements', 'image_url TEXT');
  safeAddColumn('announcements', "status TEXT DEFAULT 'published'");
  safeAddColumn('announcements', 'created_by TEXT');
  safeAddColumn('announcements', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
  safeAddColumn('announcements', 'is_deleted INTEGER DEFAULT 0');
  safeAddColumn('comments', 'is_deleted INTEGER DEFAULT 0');

  // Seed default roles
  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, description)
    VALUES (?, ?, ?)
  `);
  insertRole.run('super_admin', 'Super Admin', 'Full administrative control over songs, media, branding, payments, users, and roles');
  insertRole.run('content_admin', 'Content Admin', 'Can add/edit songs, upload audio/images, and manage events, announcements and documents');
  insertRole.run('moderator', 'Moderator', 'Can view, approve, hide, and delete user comments and report abusive users');
  insertRole.run('normal_user', 'Normal User', 'Standard registered worshipper and listener');
  insertRole.run('admin', 'Administrator', 'Full administrative control');
  insertRole.run('choir_member', 'Choir Member', 'La Lumiere Choir official member with access to rehearsal materials');
  insertRole.run('supporter', 'Supporter', 'Congregant, worshipper, and supporter');

  // Ensure default admin user has super_admin role
  const existingAdmin = db.prepare('SELECT id, role FROM users WHERE email = ?').get('admin@lalumierechoir.rw') as any;
  if (!existingAdmin) {
    const defaultAdminHash = bcrypt.hashSync('LaLumiere@2026', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_admin_default',
      'Choir Super Admin',
      'admin@lalumierechoir.rw',
      defaultAdminHash,
      '+250788000000',
      'super_admin'
    );
  } else if (existingAdmin.role !== 'super_admin') {
    db.prepare("UPDATE users SET role = 'super_admin' WHERE email = 'admin@lalumierechoir.rw'").run();
  }

  // Seed initial Content Admin for testing
  const existingContentAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('content@lalumierechoir.rw');
  if (!existingContentAdmin) {
    const defaultContentHash = bcrypt.hashSync('Content@2026', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_content_admin',
      'Media Content Lead',
      'content@lalumierechoir.rw',
      defaultContentHash,
      '+250788223344',
      'content_admin'
    );
  }

  // Seed initial Moderator for testing
  const existingModerator = db.prepare('SELECT id FROM users WHERE email = ?').get('moderator@lalumierechoir.rw');
  if (!existingModerator) {
    const defaultModHash = bcrypt.hashSync('Moderator@2026', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_moderator',
      'Choir Moderator',
      'moderator@lalumierechoir.rw',
      defaultModHash,
      '+250788334455',
      'moderator'
    );
  }

  // Seed initial Normal User for testing
  const existingNormalUser = db.prepare('SELECT id FROM users WHERE email = ?').get('user@lalumierechoir.rw');
  if (!existingNormalUser) {
    const defaultUserHash = bcrypt.hashSync('User@2026', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_normal_user',
      'Grace Mutoni',
      'user@lalumierechoir.rw',
      defaultUserHash,
      '+250788556677',
      'normal_user'
    );
  }

  // Seed initial Member user for testing
  const existingMember = db.prepare('SELECT id FROM users WHERE email = ?').get('member@lalumierechoir.rw');
  if (!existingMember) {
    const defaultMemberHash = bcrypt.hashSync('Worship@2026', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'usr_member_default',
      'Worshipper David',
      'member@lalumierechoir.rw',
      defaultMemberHash,
      '+250788112233',
      'supporter'
    );
  }

  // Seed default Song Categories
  const categories = [
    { id: 'cat_gushimisha', name: 'Gusingiza & Gushimira (Praise & Thanksgiving)', slug: 'praise-thanksgiving', order: 1 },
    { id: 'cat_kwizera', name: 'Kwizera & Ibyiringiro (Faith & Hope)', slug: 'faith-hope', order: 2 },
    { id: 'cat_umusalaba', name: 'Umusalaba & Agakiza (The Cross & Salvation)', slug: 'salvation-cross', order: 3 },
    { id: 'cat_umwuka', name: 'Umwuka Wera (Holy Spirit)', slug: 'holy-spirit', order: 4 },
    { id: 'cat_ivugabutumwa', name: 'Ivugabutumwa (Evangelism)', slug: 'evangelism', order: 5 },
    { id: 'cat_gusenga', name: 'Gusenga & Kwinginga (Prayer & Supplication)', slug: 'prayer', order: 6 },
  ];
  const insertCat = db.prepare('INSERT OR IGNORE INTO song_categories (id, name, slug, display_order) VALUES (?, ?, ?, ?)');
  categories.forEach(c => insertCat.run(c.id, c.name, c.slug, c.order));

  // Seed initial payment providers (MTN Mobile Money Rwanda and Airtel Money Rwanda)
  const insertProvider = db.prepare('INSERT OR IGNORE INTO payment_providers (id, name, slug, is_enabled, environment, api_endpoint) VALUES (?, ?, ?, ?, ?, ?)');
  insertProvider.run('prov_mtn_rw', 'MTN Mobile Money Rwanda', 'mtn-momo', 1, 'sandbox', 'https://sandbox.momodeveloper.mtn.com');
  insertProvider.run('prov_airtel_rw', 'Airtel Money Rwanda', 'airtel-money', 1, 'sandbox', 'https://openapiuat.airtel.africa');

  // Seed initial Branding Settings
  const existingBranding = db.prepare('SELECT id FROM branding_settings WHERE id = ?').get('default_branding');
  if (!existingBranding) {
    db.prepare(`
      INSERT INTO branding_settings (id, main_logo_url, app_icon_url, splash_logo_url, primary_color, secondary_color, accent_color)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default_branding',
      '', // Admin will be able to upload or replace official logo
      '',
      '',
      '#1e3a8a',
      '#d97706',
      '#2563eb'
    );
  }

  // Seed initial App Settings
  const defaultSettings = [
    { key: 'choir_name', value: 'La Lumiere Choir', description: 'Official choir name' },
    { key: 'church_affiliation', value: 'ADEPR Nyanza, Kicukiro District, Kigali, Rwanda', description: 'Church and district affiliation' },
    { key: 'welcome_message', value: 'Sing, worship, listen, and support our ministry.', description: 'Home welcome message' },
    { key: 'contact_phone', value: '+250 788 000 000', description: 'Contact phone number' },
    { key: 'contact_email', value: 'info@lalumierechoir.rw', description: 'Contact email' },
    { key: 'about_story', value: 'La Lumiere Choir is a renowned gospel choir based at ADEPR Nyanza in Kicukiro District, Kigali, Rwanda. Dedicated to spreading the Gospel of Jesus Christ through anointed worship, inspiring harmonies, and soul-stirring hymns in Kinyarwanda and other languages.', description: 'Choir story & background' },
    { key: 'mission_statement', value: 'To illuminate souls with the true Light of Christ through spiritual songs, evangelism, and selfless fellowship.', description: 'Mission statement' },
    { key: 'vision_statement', value: 'A generation transformed and anchored in genuine praise, worship, and devotion to God across Rwanda and the nations.', description: 'Vision statement' }
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO app_settings (key, value, description) VALUES (?, ?, ?)');
  defaultSettings.forEach(s => insertSetting.run(s.key, s.value, s.description));

  // Seed authentic initial songs for La Lumiere Choir (both Released and Protected Unreleased)
  const existingSongs = db.prepare('SELECT COUNT(*) as count FROM songs').get() as { count: number };
  if (existingSongs.count === 0) {
    seedInitialSongs();
  }
}

function seedInitialSongs() {
  const songsData = [
    {
      id: 'song_1',
      title: 'Urukundo rwa Yesu (The Love of Jesus)',
      song_number: 'LMC-001',
      composer: 'La Lumiere Choir / ADEPR Nyanza',
      category_id: 'cat_umusalaba',
      release_status: 'released',
      release_date: '2024-04-12',
      description: 'Indirimbo ivuga ku buntu no gukunda kudasanzwe kwa Yesu ku musalaba w\'i Kaluvari.',
      cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      lyrics: `[Igitero 1]
Muri Kaluvari Yesu yitangiye abanyabyaha,
Aramena amaraso ye y'igiciro cyinshi.
Urukundo rwe rutangaje cyane,
Ntaho rwahwanywa n'icyitwa urukundo cyose.

[Inyikirizo]
Haleluya! Haleluya ku mwami wanjye,
Wankuye mu mwijima unzana mu mucyo.
Nzahora nkurata iteka n'iteka ryose,
La Lumiere irakuvuga Mwami w'amahoro!

[Igitero 2]
Imbabarire ze ziranguruye imitima,
Ibyaha byacu yabikuyeho burundu.
Ubu dufite ibyiringiro bidashira,
Muri Yesu Kristo Umucyo w'isi yose.

[Inyikirizo]
Haleluya! Haleluya ku mwami wanjye,
Wankuye mu mwijima unzana mu mucyo.
Nzahora nkurata iteka n'iteka ryose,
La Lumiere irakuvuga Mwami w'amahoro!

[Igitero 3]
Reka umuriro w'urukundo rwawe wake,
Tubwirize amahanga agakiza kawe.
Nta wundi mwami dufite utari wowe,
Yesu uri Alpha na Omega.`,
      tracks: [
        {
          id: 'trk_1_1',
          title: 'Full Choir Studio Recording',
          track_type: 'full_song',
          audio_url: 'https://cdn.freesound.org/previews/530/530663_11861866-lq.mp3',
          duration: 275
        },
        {
          id: 'trk_1_2',
          title: 'Soprano & Alto Melody Guide',
          track_type: 'melody',
          audio_url: 'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3',
          duration: 210
        },
        {
          id: 'trk_1_3',
          title: 'Tenor & Bass Rehearsal Vocal Track',
          track_type: 'vocal_guide',
          audio_url: 'https://cdn.freesound.org/previews/401/401584_5121236-lq.mp3',
          duration: 210
        }
      ]
    },
    {
      id: 'song_2',
      title: 'Mana Ushimwe kuko Uri Umunyamateka',
      song_number: 'LMC-002',
      composer: 'La Lumiere Choir',
      category_id: 'cat_gushimisha',
      release_status: 'released',
      release_date: '2024-09-20',
      description: 'Indirimbo yo gushima Imana ku mirimo ikomeye yakoreye itorero ry\'ADEPR Nyanza.',
      cover_image_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
      lyrics: `[Igitero 1]
Mana yacu uri uw'agaciro,
Ibyo wakoze biruta ibitekerezo.
Waturinze mu bihe by'umwijima,
Uduha umucyo urasa mu mitima yacu.

[Inyikirizo]
Ushimwe, Mana yacu ushimwe,
Ku rukundo rwawe rudashira.
Ushimwe mu gitondo na nimugoroba,
Nyanza iragushima, Kicukiro iraririmba!

[Igitero 2]
Imbaraga zawe ziruta iz'isi,
Wugurura imiryango nta wushobora kuyifunga.
Duhagaze hano tubihamya,
Ko uri Imana yo kwizerwa iteka.`,
      tracks: [
        {
          id: 'trk_2_1',
          title: 'Full Worship Rendition',
          track_type: 'full_song',
          audio_url: 'https://cdn.freesound.org/previews/612/612662_11861866-lq.mp3',
          duration: 310
        },
        {
          id: 'trk_2_2',
          title: 'Instrumental Piano & Strings',
          track_type: 'instrumental',
          audio_url: 'https://cdn.freesound.org/previews/530/530663_11861866-lq.mp3',
          duration: 310
        }
      ]
    },
    {
      id: 'song_3',
      title: 'Umucyo Urase (Let The Light Shine)',
      song_number: 'LMC-003',
      composer: 'La Lumiere Choir Hymnology Team',
      category_id: 'cat_ivugabutumwa',
      release_status: 'released',
      release_date: '2025-01-05',
      description: 'Insanganyamatsiko ya La Lumiere: Umucyo w\'Imana umurikire u Rwanda n\'amahanga yose.',
      cover_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      lyrics: `[Igitero 1]
Mwami wacu witwa Umucyo w'ukuri,
Wamuritse mu mwijima w'iyi si.
Duhagaze hano nk'abahamya bawe,
Dushaka ko izina ryawe ryubahwa.

[Inyikirizo]
Umucyo urase hose mu Rwanda,
Bose bamenye ko Yesu ari muzima!
La Lumiere irasa iteka ryose,
Kugeza igihe Mwami azagarukira.

[Igitero 2]
Tugende mu nzira y'ukuri n'ubutungane,
Ntituzatsindwa kuko uri kumwe natwe.
Amen! Haleluya!`,
      tracks: [
        {
          id: 'trk_3_1',
          title: 'Live Sanctuary Performance',
          track_type: 'full_song',
          audio_url: 'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3',
          duration: 250
        }
      ]
    },
    {
      id: 'song_4',
      title: 'Kumbuga z\'Amahoro (Anthem of Peace) - UNRELEASED',
      song_number: 'LMC-004-PR',
      composer: 'La Lumiere Choir Technical Committee',
      category_id: 'cat_kwizera',
      release_status: 'unreleased', // PROTECTED UNRELEASED
      release_date: 'Coming Soon - Easter 2026',
      description: 'Indirimbo nshya ikiri mu myiteguro itarasohoka ku mugaragaro. Yarindishijwe umutekano w\'ijambo ry\'ibanga.',
      cover_image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80',
      // Password hash for authorized rehearsal members & leaders: 'Nyanza2026'
      access_password: 'Nyanza2026',
      lyrics: `[IGITERO CY'IBANGA 1 - REHEARSAL CONFIDENTIAL]
Kumbuga z'amahoro tuzahurirayo n'Umukiza,
Ahashize amarira, ibitotsi n'imibabaro y'isi.
Tuzambara amakamba y'ubwiza,
Turirimbe indirimbo nshya ya Mose n'Umwana w'Intama.

[INYIKIRIZO]
Icyo gihe tuzishima cyane,
Turebana n'Umwami mu maso.
Nta cyadutanya n'urukundo rwe,
Haleluya k'Umucyo w'iteka!

[IGITERO 2]
Imyiteguro irakomeje ku bantu b'Imana,
Komeza umurimo, ntucike intege mu nzira.
Yesu ari hafi kuza kutujyana!`,
      tracks: [
        {
          id: 'trk_4_1',
          title: 'Rehearsal Voice Guide (Protected)',
          track_type: 'practice_track',
          audio_url: 'https://cdn.freesound.org/previews/401/401584_5121236-lq.mp3',
          duration: 195
        }
      ]
    }
  ];

  const insertSong = db.prepare(`
    INSERT INTO songs (id, title, song_number, composer, category_id, release_status, release_date, description, cover_image_url, access_password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertLyrics = db.prepare(`
    INSERT INTO lyrics (id, song_id, content, language)
    VALUES (?, ?, ?, ?)
  `);
  const insertTrack = db.prepare(`
    INSERT INTO audio_tracks (id, song_id, title, track_type, audio_url, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  songsData.forEach(s => {
    const pwdHash = s.access_password ? bcrypt.hashSync(s.access_password, 10) : null;
    insertSong.run(
      s.id,
      s.title,
      s.song_number,
      s.composer,
      s.category_id,
      s.release_status,
      s.release_date,
      s.description,
      s.cover_image_url,
      pwdHash
    );
    insertLyrics.run('lyr_' + s.id, s.id, s.lyrics, 'rw');
    s.tracks.forEach(t => {
      insertTrack.run(t.id, s.id, t.title, t.track_type, t.audio_url, t.duration);
    });
  });

  // Seed sample announcements
  const insertAnn = db.prepare('INSERT INTO announcements (id, title, content, category) VALUES (?, ?, ?, ?)');
  insertAnn.run(
    'ann_1',
    'Amateraniro yo Gushima Imana & Ikoraniro ry\'Indirimbo',
    'La Lumiere Choir iramenyesha abakunzi bose b\'indirimbo zo guhimbaza Imana ko hazaba igiterane kidasanzwe kuri ADEPR Nyanza, Kicukiro District. Murahawe ikaze!',
    'event'
  );
  insertAnn.run(
    'ann_2',
    'Imyiteguro y\'Album Nshya ya 2026',
    'Imirimo yo gufata amajwi n\'amashusho y\'album nshya irakomeje muri studio. Turashimira abaterankunga bose bakomeje gushyigikira uyu murimo.',
    'rehearsal'
  );

  // Seed sample comments
  const insertComm = db.prepare('INSERT INTO comments (id, song_id, user_id, content, likes_count) VALUES (?, ?, ?, ?, ?)');
  insertComm.run(
    'comm_1',
    'song_1',
    'usr_member_default',
    'Iyi ndirimbo \'Urukundo rwa Yesu\' iranyura cyane! Imana ikomeze guha umugisha La Lumiere Choir!',
    12
  );

  // Seed sample events if empty
  const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
  if (eventsCount.count === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, description, event_date, location, image_url, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'published', 'usr_admin_default')
    `);
    insertEvent.run(
      'evt_1',
      'Igiterane cyo kuramya no guhimbaza (Praise & Worship Night)',
      'Ijoro ridasanzwe ryo kuramya Imana no guhimbaza hamwe na La Lumiere Choir n\'andi matsinda y\'indirimbo ku rusengero rwa ADEPR Nyanza.',
      '2026-10-15 17:00:00',
      'ADEPR Nyanza Sanctuary, Kicukiro',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80'
    );
    insertEvent.run(
      'evt_2',
      'Imyitozo rusange yo Kwitegura Pasika (Easter Rehearsal)',
      'Imyitozo y\'abaririmbyi bose ba La Lumiere Choir yo gutunganya indirimbo nshya zizakoreshwa mu minsi mikuru.',
      '2026-09-30 14:00:00',
      'La Lumiere Music Room, ADEPR Nyanza',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'
    );
  }

  // Seed sample documents if empty
  const docsCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
  if (docsCount.count === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO documents (id, title, description, file_url, file_size_bytes, category, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'published', 'usr_admin_default')
    `);
    insertDoc.run(
      'doc_1',
      'Amanota y\'Indirimbo: Urukundo rwa Yesu (Sol-fa Sheet Music)',
      'Amanota nyakuri y\'ijwi rya mbere, irya kabiri, irya gatatu n\'irya kane (SATB) y\'indirimbo Urukundo rwa Yesu.',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      245000,
      'sheet_music'
    );
    insertDoc.run(
      'doc_2',
      'Amabwiriza y\'Abaririmbyi ba La Lumiere (Choir Ministry Code of Conduct)',
      'Igitabo gikubiyemo amahame, imyitwarire n\'inshingano z\'umuririmbyi wa La Lumiere Choir ADEPR Nyanza.',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      512000,
      'rehearsal_guide'
    );
  }

  // Seed sample content articles (news, devotional, video, notice)
  const articlesCount = db.prepare('SELECT COUNT(*) as count FROM content_articles').get() as { count: number };
  if (articlesCount.count === 0) {
    const insertArt = db.prepare(`
      INSERT INTO content_articles (id, type, title, content, media_url, published_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'published', 'usr_admin_default')
    `);
    insertArt.run(
      'art_1',
      'choir_news',
      'La Lumiere Choir irashimira Imana ku myaka 15 y\'umurimo w\'ivugabutumwa',
      'Urugendo rw\'uburirimbyi bwa La Lumiere Choir rwatangiye kera kuri ADEPR Nyanza. Uyu munsi turashima Imana ku mirimo ikomeye yakoreye mu mitima y\'abantu binyuze mu ndirimbo z\'umwuka.',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      '2026-09-10'
    );
    insertArt.run(
      'art_2',
      'devotional',
      'Guhimbaza Imana mu mwuka no mu kuri - Ijambo ry\'Umunsi',
      'Yohana 4:24 - Imana ni Umwuka, n\'abayisenga bakwiriye kuyisengera mu mwuka no mu kuri. Indirimbo y\'umunyamwuka iratandukana n\'umuziki usanzwe kuko ifite imbaraga zo kubohora imitima.',
      '',
      '2026-09-18'
    );
    insertArt.run(
      'art_3',
      'video',
      'Videwo: Amashusho y\'indirimbo \'Urukundo rwa Yesu\' (Official Video)',
      'Reba amashusho yose y\'indirimbo yashyizwe hanze ku rubuga rwa YouTube rwa La Lumiere Choir Rwanda.',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      '2026-09-01'
    );
    insertArt.run(
      'art_4',
      'notice',
      'Icyitonderwa ku bagize korali: Isaha yo kugera ku rusengero ku cyumweru',
      'Abaririmbyi bose basabwe kugera kuri ADEPR Nyanza bitarenze saa mbili n\'igice (08:30 AM) zo mu gitondo kugira ngo basengere hamwe mbere y\'amateraniro.',
      '',
      '2026-09-19'
    );
  }

  // Seed sample images if empty
  const imagesCount = db.prepare('SELECT COUNT(*) as count FROM images').get() as { count: number };
  if (imagesCount.count === 0) {
    const insertImg = db.prepare(`
      INSERT INTO images (id, title, category, file_url, file_size_bytes, mime_type, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'usr_admin_default')
    `);
    insertImg.run(
      'img_1',
      'Choir Ministry Banner',
      'choir_photo',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      420000,
      'image/jpeg'
    );
    insertImg.run(
      'img_2',
      'Sanctuary Worship Event Cover',
      'event_image',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      380000,
      'image/jpeg'
    );
  }
}

// Activity Logging helper
export function logActivity(
  userId: string | undefined,
  userName: string | undefined,
  userRole: string | undefined,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
) {
  try {
    const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, user_name, user_role, action, resource, resource_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId || 'system',
      userName || 'System Admin',
      userRole || 'super_admin',
      action,
      resource,
      resourceId || null,
      details || null
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Call database initializer
initDatabase();
