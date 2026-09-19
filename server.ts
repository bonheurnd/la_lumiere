import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import { db, initDatabase } from './server/db.js';
import { generateToken, requireAuth, requireAdmin, optionalAuth, AuthRequest } from './server/auth.js';
import { initiateRwandaPayment, verifyPaymentTransaction, validateRwandaPhoneNumber } from './server/momo.js';

// Initialize DB schema & seeds
initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer for media uploads (logos, song covers, audio files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// -------------------------------------------------------------
// PUBLIC BRANDING & SETTINGS API
// -------------------------------------------------------------
app.get('/api/branding', (req, res) => {
  try {
    const branding = db.prepare('SELECT * FROM branding_settings WHERE id = ?').get('default_branding') as any;
    const settingsRows = db.prepare('SELECT key, value FROM app_settings').all() as any[];
    const settings: Record<string, string> = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    res.json({
      branding: branding || {},
      settings
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch branding settings' });
  }
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Amazina, imeli n\'ijambo ry\'ibanga birakenewe (Name, email, and password required)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Ijambo ry\'ibanga rigomba kugira byibuze inyuguti 6 (Password must be at least 6 characters)' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Iyi imeli isanzwe ikoreshwa (Email already registered)' });
    }

    const userId = 'usr_' + Date.now();
    const hash = bcrypt.hashSync(password, 10);
    const userRole = 'supporter';

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), email.trim().toLowerCase(), hash, phone || '', userRole);

    const token = generateToken({ id: userId, email: email.trim().toLowerCase(), role: userRole, name: name.trim() });

    // Send welcome notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, body, type, link)
      VALUES (?, ?, ?, ?, 'community', ?)
    `).run(
      'notif_' + Date.now(),
      userId,
      'Murakaza neza muri La Lumiere Choir!',
      'Urakoze kwiyandikisha. Ikaze mu muryango w\'abakunzi b\'indirimbo za La Lumiere Choir, ADEPR Nyanza.',
      '/songs'
    );

    res.status(201).json({
      message: 'Konte yafunguwe neza (Account created successfully)',
      token,
      user: { id: userId, name: name.trim(), email: email.trim().toLowerCase(), role: userRole, phone }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Habaye ikosa mu kwiyandikisha' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Imeli n\'ijambo ry\'ibanga birakenewe' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Imeli cyangwa ijambo ry\'ibanga si byo (Invalid email or password)' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      message: 'Mwinjiye neza (Logged in successfully)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar_url: user.avatar_url
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Habaye ikosa mu kwinjira' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const favoritesCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(req.user!.id) as any;
    const donationsCount = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE user_id = ? AND status = "successful"').get(req.user!.id) as any;

    res.json({
      user,
      stats: {
        favoritesCount: favoritesCount?.count || 0,
        donationsCount: donationsCount?.count || 0,
        totalDonated: donationsCount?.total || 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.put('/api/auth/profile', requireAuth, (req: AuthRequest, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, avatar_url, req.user!.id);

    const updated = db.prepare('SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?').get(req.user!.id);
    res.json({ message: 'Umwirondoro wavuguruwe (Profile updated)', user: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/auth/change-password', requireAuth, (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Ijambo ry\'ibanga rishya rigomba kugira byibuze inyuguti 6' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Ijambo ry\'ibanga ry\'ubu si ryo' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);

    res.json({ message: 'Ijambo ry\'ibanga ryahinduwe neza (Password changed successfully)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Account deletion (Required by Google Play & Apple App Store guidelines!)
app.delete('/api/auth/delete-account', requireAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    // Log audit
    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "ACCOUNT_DELETED", "users", ?)')
      .run('log_' + Date.now(), userId, 'User requested account deletion');

    // Cascade deletion removes user, comments, favorites, notifications
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Konti yawe yasibwe burundu (Account deleted permanently)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// -------------------------------------------------------------
// SONGS & DIGITAL SONGBOOK API
// -------------------------------------------------------------
app.get('/api/songs', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { search, category, status, sort } = req.query;
    let query = `
      SELECT s.id, s.title, s.song_number, s.composer, s.category_id, s.release_status,
             s.release_date, s.description, s.cover_image_url, s.views_count,
             sc.name as category_name,
             (SELECT COUNT(*) FROM audio_tracks at WHERE at.song_id = s.id) as audio_count,
             (SELECT COUNT(*) FROM comments c WHERE c.song_id = s.id AND c.status = 'visible') as comments_count
      FROM songs s
      LEFT JOIN song_categories sc ON s.category_id = sc.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'all') {
      query += ` AND (s.category_id = ? OR sc.slug = ?)`;
      params.push(category, category);
    }

    if (status && status !== 'all') {
      query += ` AND s.release_status = ?`;
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (
        s.title LIKE ? OR
        s.composer LIKE ? OR
        s.song_number LIKE ? OR
        EXISTS (SELECT 1 FROM lyrics l WHERE l.song_id = s.id AND l.content LIKE ?)
      )`;
      params.push(term, term, term, term);
    }

    if (sort === 'popular') {
      query += ` ORDER BY s.views_count DESC, s.created_at DESC`;
    } else if (sort === 'number') {
      query += ` ORDER BY s.song_number ASC`;
    } else if (sort === 'oldest') {
      query += ` ORDER BY s.created_at ASC`;
    } else {
      // Default latest
      query += ` ORDER BY s.created_at DESC`;
    }

    const songs = db.prepare(query).all(...params) as any[];

    // Include favorite status if user is logged in
    let favoriteSongIds = new Set<string>();
    if (req.user) {
      const userFavs = db.prepare('SELECT song_id FROM favorites WHERE user_id = ?').all(req.user.id) as any[];
      favoriteSongIds = new Set(userFavs.map(f => f.song_id));
    }

    const result = songs.map(s => ({
      ...s,
      is_favorite: favoriteSongIds.has(s.id),
      has_audio: Number(s.audio_count) > 0,
      is_unreleased: s.release_status === 'unreleased'
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query songs' });
  }
});

app.get('/api/songs/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT sc.*, COUNT(s.id) as song_count
      FROM song_categories sc
      LEFT JOIN songs s ON sc.id = s.category_id
      GROUP BY sc.id
      ORDER BY sc.display_order ASC
    `).all();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Single song details with lyrics and audio tracks
app.get('/api/songs/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const song = db.prepare(`
      SELECT s.*, sc.name as category_name
      FROM songs s
      LEFT JOIN song_categories sc ON s.category_id = sc.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!song) {
      return res.status(404).json({ error: 'Indirimbo ntibonetse (Song not found)' });
    }

    // Increment view count
    db.prepare('UPDATE songs SET views_count = views_count + 1 WHERE id = ?').run(id);

    const audioTracks = db.prepare('SELECT * FROM audio_tracks WHERE song_id = ? ORDER BY created_at ASC').all(id);
    const lyricsRow = db.prepare('SELECT * FROM lyrics WHERE song_id = ?').get(id) as any;

    // Check if user is admin
    const isAdmin = req.user?.role === 'admin';

    // Unreleased content protection
    let lyricsContent = lyricsRow?.content || '';
    let isLocked = false;

    if (song.release_status === 'unreleased') {
      // Check if unlocked in session or user has access grant
      let hasAccess = isAdmin;
      if (!hasAccess && req.user) {
        const grant = db.prepare('SELECT id FROM protected_content_access WHERE song_id = ? AND user_id = ?').get(id, req.user.id);
        if (grant) hasAccess = true;
      }

      if (!hasAccess) {
        isLocked = true;
        // Obscure lyrics completely for unreleased songs to unauthorized users
        lyricsContent = '';
      }
    }

    let isFavorite = false;
    if (req.user) {
      const fav = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND song_id = ?').get(req.user.id, id);
      isFavorite = Boolean(fav);
    }

    res.json({
      ...song,
      access_password_hash: undefined, // Never expose password hash!
      is_locked: isLocked,
      is_favorite: isFavorite,
      lyrics: lyricsContent,
      solfa_notation: isLocked ? null : lyricsRow?.solfa_notation,
      language: lyricsRow?.language || 'rw',
      audio_tracks: isLocked ? [] : audioTracks, // Audio also protected if unreleased and locked
      available_track_count: audioTracks.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch song details' });
  }
});

// Unlock unreleased song with access password
app.post('/api/songs/:id/unlock', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Ijambo ry\'ibanga rirakenewe (Password required)' });
    }

    const song = db.prepare('SELECT id, release_status, access_password_hash FROM songs WHERE id = ?').get(id) as any;
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.release_status !== 'unreleased') {
      return res.json({ message: 'Indirimbo irasohotse (Song is already public)' });
    }

    if (!song.access_password_hash || !bcrypt.compareSync(password, song.access_password_hash)) {
      return res.status(401).json({ error: 'Ijambo ry\'ibanga si ryo (Incorrect access password)' });
    }

    // Grant access log
    db.prepare('INSERT INTO protected_content_access (id, user_id, song_id) VALUES (?, ?, ?)')
      .run('grant_' + Date.now(), req.user?.id || null, id);

    const lyricsRow = db.prepare('SELECT * FROM lyrics WHERE song_id = ?').get(id) as any;
    const audioTracks = db.prepare('SELECT * FROM audio_tracks WHERE song_id = ?').all(id);

    res.json({
      success: true,
      message: 'Mwinjiye neza mu ndirimbo itarasohoka (Unlocked successfully)',
      lyrics: lyricsRow?.content || '',
      solfa_notation: lyricsRow?.solfa_notation,
      audio_tracks: audioTracks
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// -------------------------------------------------------------
// AUDIO LIBRARY API
// -------------------------------------------------------------
const handleAudioLibraryRequest = (req: any, res: any) => {
  try {
    const { track_type, type, search } = req.query;
    const filterType = track_type || type;
    let query = `
      SELECT at.*, s.title as song_title, s.song_number, s.composer, s.cover_image_url, s.release_status
      FROM audio_tracks at
      JOIN songs s ON at.song_id = s.id
      WHERE s.release_status = 'released'
    `;
    const params: any[] = [];

    if (filterType && filterType !== 'all') {
      query += ` AND at.track_type = ?`;
      params.push(filterType);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (at.title LIKE ? OR s.title LIKE ? OR s.composer LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY at.plays_count DESC, at.created_at DESC`;
    const tracks = db.prepare(query).all(...params);
    res.json(tracks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch audio tracks' });
  }
};

app.get('/api/audio-library', handleAudioLibraryRequest);
app.get('/api/audio-tracks', handleAudioLibraryRequest);

app.post('/api/audio-tracks/:id/play', (req, res) => {
  try {
    db.prepare('UPDATE audio_tracks SET plays_count = plays_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// -------------------------------------------------------------
// FAVORITES API
// -------------------------------------------------------------
app.get('/api/favorites', requireAuth, (req: AuthRequest, res) => {
  try {
    const songs = db.prepare(`
      SELECT s.*, sc.name as category_name, 1 as is_favorite
      FROM favorites f
      JOIN songs s ON f.song_id = s.id
      LEFT JOIN song_categories sc ON s.category_id = sc.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user!.id);
    res.json(songs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

app.post('/api/favorites/:songId', requireAuth, (req: AuthRequest, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user!.id;

    const existing = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND song_id = ?').get(userId, songId);
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND song_id = ?').run(userId, songId);
      res.json({ is_favorite: false, message: 'Yakuwe mu ndirimbo ukunda (Removed from favorites)' });
    } else {
      db.prepare('INSERT INTO favorites (user_id, song_id) VALUES (?, ?)').run(userId, songId);
      res.json({ is_favorite: true, message: 'Yongewe mu ndirimbo ukunda (Added to favorites)' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update favorites' });
  }
});

// -------------------------------------------------------------
// COMMENTS & COMMUNITY API
// -------------------------------------------------------------
app.get('/api/songs/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.song_id = ? AND c.status = 'visible' AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
    `).all(id) as any[];

    // Fetch replies for each comment
    const getReplies = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = ? AND c.status = 'visible'
      ORDER BY c.created_at ASC
    `);

    const result = comments.map(c => ({
      ...c,
      replies: getReplies.all(c.id)
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/songs/:id/comments', requireAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Ubutumwa ntibushobora kuba ubusa (Comment cannot be empty)' });
    }

    // Basic spam prevention: check recent comments in last 10 seconds
    const recent = db.prepare(`
      SELECT COUNT(*) as count FROM comments
      WHERE user_id = ? AND created_at >= datetime('now', '-10 seconds')
    `).get(req.user!.id) as any;

    if (recent && recent.count >= 2) {
      return res.status(429).json({ error: 'Tegereza akanya gato mbere yo kongera kwandika igitekerezo (Please wait a moment)' });
    }

    const commentId = 'comm_' + Date.now();
    db.prepare(`
      INSERT INTO comments (id, song_id, user_id, parent_id, content, status)
      VALUES (?, ?, ?, ?, ?, 'visible')
    `).run(commentId, id, req.user!.id, parent_id || null, content.trim());

    const created = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    res.status(201).json({ message: 'Igitekerezo cyakiriwe (Comment posted)', comment: created });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

app.post('/api/comments/:id/like', requireAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = db.prepare('SELECT 1 FROM comment_reactions WHERE user_id = ? AND comment_id = ? AND reaction_type = "like"').get(userId, id);
    if (existing) {
      db.prepare('DELETE FROM comment_reactions WHERE user_id = ? AND comment_id = ? AND reaction_type = "like"').run(userId, id);
      db.prepare('UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
      return res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO comment_reactions (user_id, comment_id, reaction_type) VALUES (?, ?, "like")').run(userId, id);
      db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').run(id);
      return res.json({ liked: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to react to comment' });
  }
});

app.post('/api/comments/:id/report', requireAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    db.prepare(`
      INSERT OR IGNORE INTO comment_reactions (user_id, comment_id, reaction_type, reason)
      VALUES (?, ?, 'report', ?)
    `).run(userId, id, reason || 'Inappropriate content');

    db.prepare('UPDATE comments SET reports_count = reports_count + 1 WHERE id = ?').run(id);

    // If reported 3 or more times, auto-flag for moderation
    const c = db.prepare('SELECT reports_count FROM comments WHERE id = ?').get(id) as any;
    if (c && c.reports_count >= 3) {
      db.prepare('UPDATE comments SET status = "flagged" WHERE id = ?').run(id);
    }

    res.json({ message: 'Icyegeranyo cyakiriwe, ubuyobozi buragisuzuma (Report submitted)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// -------------------------------------------------------------
// RWANDA MOBILE MONEY DONATIONS & PAYMENTS API
// -------------------------------------------------------------
app.post('/api/donations/validate-phone', (req, res) => {
  const { phone } = req.body;
  const result = validateRwandaPhoneNumber(phone);
  res.json(result);
});

app.post('/api/donations/initiate', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      amount,
      phone,
      phone_number,
      paymentMethod,
      provider_slug,
      donationPurpose,
      donation_purpose,
      donorName,
      donor_name,
      isAnonymous,
      is_anonymous
    } = req.body;

    const phoneNumber = phone || phone_number;
    const provider = provider_slug || paymentMethod;
    const purpose = donationPurpose || donation_purpose;
    const name = donorName || donor_name;
    const anonymous = isAnonymous !== undefined ? isAnonymous : is_anonymous;

    const response = await initiateRwandaPayment({
      userId: req.user?.id,
      donorName: name || req.user?.name,
      donorPhone: phoneNumber,
      amount: Number(amount),
      currency: 'RWF',
      paymentMethod: provider === 'airtel-money' ? 'airtel-money' : 'mtn-momo',
      donationPurpose: purpose || 'General Choir Ministry & Production',
      isAnonymous: Boolean(anonymous)
    });

    const transaction = db.prepare('SELECT * FROM payment_transactions WHERE internal_reference = ?').get(response.internalReference);

    res.json({
      ...response,
      transaction: transaction || {
        internal_reference: response.internalReference,
        provider_slug: provider === 'airtel-money' ? 'airtel-money' : 'mtn-momo',
        amount: Number(amount),
        currency: 'RWF',
        status: response.status,
        donor_phone: phoneNumber,
        donor_name: name || 'Supporter',
        donation_purpose: purpose,
        prompt_instructions: response.promptInstructions,
        created_at: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Ntibyakunze gutangiza ubwishyu' });
  }
});

const handleVerifyDonation = (req: any, res: any) => {
  try {
    const transaction = verifyPaymentTransaction(req.params.id || req.params.reference);
    res.json(transaction);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Transaction not found' });
  }
};

app.get('/api/donations/verify/:id', handleVerifyDonation);
app.get('/api/donations/status/:reference', handleVerifyDonation);

app.get('/api/donations/history', requireAuth, (req: AuthRequest, res) => {
  try {
    const donations = db.prepare(`
      SELECT id, internal_reference, provider_reference, amount, currency,
             provider_slug, donation_purpose, status, created_at, completed_at
      FROM payment_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user!.id);
    res.json(donations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch donations history' });
  }
});

// Webhook callback endpoint for telco callbacks (MTN / Airtel)
app.post('/api/donations/callback', (req, res) => {
  try {
    const { referenceId, status, providerReference } = req.body;
    if (referenceId) {
      const normalizedStatus = status === 'SUCCESSFUL' ? 'successful' : (status === 'FAILED' ? 'failed' : 'pending');
      db.prepare(`
        UPDATE payment_transactions
        SET status = ?, provider_reference = COALESCE(?, provider_reference), completed_at = CURRENT_TIMESTAMP
        WHERE internal_reference = ? OR id = ?
      `).run(normalizedStatus, providerReference, referenceId, referenceId);
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Callback processing error' });
  }
});

// -------------------------------------------------------------
// ANNOUNCEMENTS & NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/announcements', (req, res) => {
  try {
    const announcements = db.prepare('SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json(announcements);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

app.get('/api/notifications', requireAuth, (req: AuthRequest, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 30
    `).all(req.user!.id);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', requireAuth, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)').run(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// -------------------------------------------------------------
// ABOUT CHOIR
// -------------------------------------------------------------
app.get('/api/about', (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value FROM app_settings').all() as any[];
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });

    res.json({
      choir_name: map.choir_name || 'La Lumiere Choir',
      affiliation: map.church_affiliation || 'ADEPR Nyanza, Kicukiro District, Rwanda',
      about_story: map.about_story || '',
      mission: map.mission_statement || '',
      vision: map.vision_statement || '',
      contact_phone: map.contact_phone || '+250 788 000 000',
      contact_email: map.contact_email || 'info@lalumierechoir.rw',
      socials: {
        youtube: 'https://youtube.com/@LaLumiereChoir',
        instagram: 'https://instagram.com/lalumierechoir',
        facebook: 'https://facebook.com/lalumierechoir'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch choir about info' });
  }
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT ROUTES (requireAdmin)
// -------------------------------------------------------------
app.get('/api/admin/metrics', requireAdmin, (req: AuthRequest, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const totalSongs = db.prepare('SELECT COUNT(*) as count FROM songs').get() as any;
    const releasedSongs = db.prepare('SELECT COUNT(*) as count FROM songs WHERE release_status = "released"').get() as any;
    const unreleasedSongs = db.prepare('SELECT COUNT(*) as count FROM songs WHERE release_status = "unreleased"').get() as any;
    const totalAudio = db.prepare('SELECT COUNT(*) as count FROM audio_tracks').get() as any;
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get() as any;
    const donationsTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payment_transactions WHERE status = "successful"').get() as any;
    const pendingDonations = db.prepare('SELECT COUNT(*) as count FROM payment_transactions WHERE status = "pending"').get() as any;
    const recentActivity = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 15').all();

    res.json({
      totalUsers: totalUsers?.count || 0,
      totalSongs: totalSongs?.count || 0,
      releasedSongs: releasedSongs?.count || 0,
      unreleasedSongs: unreleasedSongs?.count || 0,
      totalAudio: totalAudio?.count || 0,
      totalComments: totalComments?.count || 0,
      successfulDonationsCount: donationsTotal?.count || 0,
      totalDonationsAmount: donationsTotal?.total || 0,
      pendingDonationsCount: pendingDonations?.count || 0,
      recentActivity
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load admin metrics' });
  }
});

// Admin Songs CRUD
app.post('/api/admin/songs', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { title, song_number, composer, category_id, release_status, release_date, description, cover_image_url, access_password, lyrics, audio_tracks } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Umutwe w\'indirimbo urakenewe (Song title required)' });
    }

    const songId = 'song_' + Date.now();
    const pwdHash = access_password && access_password.trim() ? bcrypt.hashSync(access_password.trim(), 10) : null;

    db.prepare(`
      INSERT INTO songs (
        id, title, song_number, composer, category_id, release_status,
        release_date, description, cover_image_url, access_password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      songId,
      title.trim(),
      song_number || null,
      composer || 'La Lumiere Choir',
      category_id || null,
      release_status || 'released',
      release_date || null,
      description || '',
      cover_image_url || '',
      pwdHash
    );

    // Add lyrics
    if (lyrics && lyrics.trim()) {
      db.prepare(`
        INSERT INTO lyrics (id, song_id, content, language)
        VALUES (?, ?, ?, 'rw')
      `).run('lyr_' + Date.now(), songId, lyrics.trim());
    }

    // Add audio tracks if provided
    if (Array.isArray(audio_tracks)) {
      const insertTrk = db.prepare(`
        INSERT INTO audio_tracks (id, song_id, title, track_type, audio_url, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      audio_tracks.forEach(trk => {
        if (trk.title && trk.audio_url) {
          insertTrk.run(
            'trk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            songId,
            trk.title,
            trk.track_type || 'full_song',
            trk.audio_url,
            trk.duration_seconds || 0
          );
        }
      });
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "CREATE_SONG", "songs", ?)')
      .run('log_' + Date.now(), req.user!.id, JSON.stringify({ songId, title, release_status }));

    res.status(201).json({ message: 'Indirimbo yongewemo neza (Song added successfully)', songId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create song' });
  }
});

app.put('/api/admin/songs/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, song_number, composer, category_id, release_status, release_date, description, cover_image_url, access_password, lyrics } = req.body;

    let pwdUpdateClause = '';
    const params: any[] = [title, song_number, composer, category_id, release_status, release_date, description, cover_image_url];

    if (access_password !== undefined) {
      if (access_password && access_password.trim()) {
        const hash = bcrypt.hashSync(access_password.trim(), 10);
        pwdUpdateClause = ', access_password_hash = ?';
        params.push(hash);
      } else if (release_status === 'released') {
        pwdUpdateClause = ', access_password_hash = NULL';
      }
    }

    params.push(id);

    db.prepare(`
      UPDATE songs
      SET title = ?, song_number = ?, composer = ?, category_id = ?, release_status = ?,
          release_date = ?, description = ?, cover_image_url = ?, updated_at = CURRENT_TIMESTAMP ${pwdUpdateClause}
      WHERE id = ?
    `).run(...params);

    // Update lyrics if provided
    if (lyrics !== undefined) {
      const existingLyrics = db.prepare('SELECT id FROM lyrics WHERE song_id = ?').get(id);
      if (existingLyrics) {
        db.prepare('UPDATE lyrics SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE song_id = ?').run(lyrics, id);
      } else {
        db.prepare('INSERT INTO lyrics (id, song_id, content) VALUES (?, ?, ?)').run('lyr_' + Date.now(), id, lyrics);
      }
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "UPDATE_SONG", "songs", ?)')
      .run('log_' + Date.now(), req.user!.id, JSON.stringify({ id, title, release_status }));

    res.json({ message: 'Indirimbo yavuguruwe (Song updated)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update song' });
  }
});

app.delete('/api/admin/songs/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM songs WHERE id = ?').run(id);

    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "DELETE_SONG", "songs", ?)')
      .run('log_' + Date.now(), req.user!.id, JSON.stringify({ id }));

    res.json({ message: 'Indirimbo yasibwe (Song deleted)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete song' });
  }
});

// Admin Audio Tracks management for a song
app.post('/api/admin/songs/:id/audio', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, track_type, audio_url, duration_seconds } = req.body;

    if (!title || !audio_url) {
      return res.status(400).json({ error: 'Umutwe n\'aho ijwi riboneka birakenewe' });
    }

    const trkId = 'trk_' + Date.now();
    db.prepare(`
      INSERT INTO audio_tracks (id, song_id, title, track_type, audio_url, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(trkId, id, title, track_type || 'full_song', audio_url, duration_seconds || 0);

    res.status(201).json({ message: 'Ijwi ryongewemo neza', trackId: trkId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add audio track' });
  }
});

app.delete('/api/admin/audio-tracks/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    db.prepare('DELETE FROM audio_tracks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Ijwi ryasibwe' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete audio track' });
  }
});

// Admin Comments Moderation
app.get('/api/admin/comments', requireAdmin, (req: AuthRequest, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email, s.title as song_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN songs s ON c.song_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 100
    `).all();
    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch comments for moderation' });
  }
});

app.put('/api/admin/comments/:id/status', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { status } = req.body; // 'visible', 'hidden', 'flagged'
    db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Imimerere y\'igitekerezo yahinduwe' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update comment status' });
  }
});

app.delete('/api/admin/comments/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Igitekerezo cyasibwe' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Admin Donations Dashboard & CSV Export
app.get('/api/admin/donations', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { status, provider, date_from, date_to } = req.query;
    let query = `
      SELECT pt.*, u.email as user_email
      FROM payment_transactions pt
      LEFT JOIN users u ON pt.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND pt.status = ?`;
      params.push(status);
    }
    if (provider && provider !== 'all') {
      query += ` AND pt.provider_slug = ?`;
      params.push(provider);
    }
    if (date_from) {
      query += ` AND pt.created_at >= ?`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND pt.created_at <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY pt.created_at DESC`;
    const donations = db.prepare(query).all(...params);
    res.json(donations);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// CSV Export for donations
app.get('/api/admin/donations/export', requireAdmin, (req: AuthRequest, res) => {
  try {
    const donations = db.prepare(`
      SELECT pt.internal_reference, pt.provider_reference, pt.donor_name,
             pt.amount, pt.currency, pt.provider_slug, pt.donation_purpose,
             pt.status, pt.created_at, pt.completed_at
      FROM payment_transactions pt
      ORDER BY pt.created_at DESC
    `).all() as any[];

    const headers = ['Reference', 'Provider Ref', 'Donor Name', 'Amount (RWF)', 'Currency', 'Payment Method', 'Purpose', 'Status', 'Date', 'Completed Date'];
    const rows = donations.map(d => [
      d.internal_reference,
      d.provider_reference || '',
      `"${(d.donor_name || '').replace(/"/g, '""')}"`,
      d.amount,
      d.currency,
      d.provider_slug,
      `"${(d.donation_purpose || '').replace(/"/g, '""')}"`,
      d.status,
      d.created_at,
      d.completed_at || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="la_lumiere_donations_' + Date.now() + '.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export donations' });
  }
});

// Admin Branding Management
app.put('/api/admin/branding', requireAdmin, (req: AuthRequest, res) => {
  try {
    const {
      main_logo_url,
      app_icon_url,
      splash_logo_url,
      light_logo_url,
      dark_logo_url,
      banner_image_url,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      text_color,
      choir_name,
      about_story,
      mission_statement,
      vision_statement,
      welcome_message,
      contact_phone,
      contact_email
    } = req.body;

    db.prepare(`
      UPDATE branding_settings
      SET main_logo_url = ?, app_icon_url = ?, splash_logo_url = ?, light_logo_url = ?,
          dark_logo_url = ?, banner_image_url = ?, primary_color = ?, secondary_color = ?,
          accent_color = ?, background_color = ?, text_color = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default_branding'
    `).run(
      main_logo_url || '',
      app_icon_url || '',
      splash_logo_url || '',
      light_logo_url || '',
      dark_logo_url || '',
      banner_image_url || '',
      primary_color || '#1e3a8a',
      secondary_color || '#d97706',
      accent_color || '#2563eb',
      background_color || '#f8fafc',
      text_color || '#0f172a'
    );

    // Update text settings
    const updateSetting = db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    if (choir_name) updateSetting.run('choir_name', choir_name);
    if (about_story) updateSetting.run('about_story', about_story);
    if (mission_statement) updateSetting.run('mission_statement', mission_statement);
    if (vision_statement) updateSetting.run('vision_statement', vision_statement);
    if (welcome_message) updateSetting.run('welcome_message', welcome_message);
    if (contact_phone) updateSetting.run('contact_phone', contact_phone);
    if (contact_email) updateSetting.run('contact_email', contact_email);

    // Audit log
    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "UPDATE_BRANDING", "branding_settings", ?)')
      .run('log_' + Date.now(), req.user!.id, 'Branding & logos updated');

    res.json({ message: 'Ibirango n\'amabara byavuguruwe (Branding updated successfully)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update branding' });
  }
});

// Admin Payment Settings
app.get('/api/admin/payment-settings', requireAdmin, (req: AuthRequest, res) => {
  try {
    const providers = db.prepare('SELECT * FROM payment_providers').all();
    res.json({
      providers,
      env: {
        mtn_configured: Boolean(process.env.MTN_MOMO_SUBSCRIPTION_KEY),
        airtel_configured: Boolean(process.env.AIRTEL_MONEY_CLIENT_ID)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

app.put('/api/admin/payment-settings', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { providers } = req.body;
    if (Array.isArray(providers)) {
      const updateProv = db.prepare(`
        UPDATE payment_providers
        SET is_enabled = ?, environment = ?, api_endpoint = ?, merchant_account_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE slug = ?
      `);
      providers.forEach(p => {
        updateProv.run(p.is_enabled ? 1 : 0, p.environment || 'sandbox', p.api_endpoint || null, p.merchant_account_id || null, p.slug);
      });
    }

    db.prepare('INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, "UPDATE_PAYMENT_CONFIG", "payment_providers", ?)')
      .run('log_' + Date.now(), req.user!.id, 'Payment provider configurations updated');

    res.json({ message: 'Amakuru yo kwishyura yavuguruwe (Payment settings updated)' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// Admin File Uploads (Images & Audio)
app.post('/api/admin/upload', requireAdmin, upload.single('file'), (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nta dosiye yatoranyijwe (No file uploaded)' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SPA SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`La Lumiere Choir App running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
