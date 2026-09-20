import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { ChoirLogo } from './ChoirLogo';
import {
  Song,
  SongCategory,
  UserProfile,
  Comment,
  PaymentTransaction,
  PaymentProvider,
  AdminMetrics,
} from '../types';
import {
  Shield,
  BookOpen,
  Music,
  HeartHandshake,
  Settings,
  MessageSquare,
  Users,
  RotateCcw,
  Palette,
  Clock,
  Volume2,
  FileText,
  Download,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

import { AdminLoginPortal } from './admin/AdminLoginPortal';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminSongsTab } from './admin/AdminSongsTab';
import { AdminMediaTab } from './admin/AdminMediaTab';
import { AdminContentTab } from './admin/AdminContentTab';
import { AdminCommentsTab } from './admin/AdminCommentsTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminLogsTab } from './admin/AdminLogsTab';

interface AdminDashboardProps {
  onSelectSong: (songId: string) => void;
  onNavigateHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectSong,
  onNavigateHome,
}) => {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const { branding, choirInfo, updateBranding, refreshBranding } = useBranding();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'songs'
    | 'media'
    | 'content'
    | 'comments'
    | 'users'
    | 'logs'
    | 'branding'
    | 'donations'
    | 'payments'
  >('overview');

  // Stats & Metrics
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // Entities
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<SongCategory[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [donations, setDonations] = useState<PaymentTransaction[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);

  // Branding Editor Form
  const [brandingForm, setBrandingForm] = useState({
    main_logo_url: branding.main_logo_url || '',
    app_icon_url: branding.app_icon_url || '',
    splash_logo_url: branding.splash_logo_url || '',
    light_logo_url: branding.light_logo_url || '',
    dark_logo_url: branding.dark_logo_url || '',
    banner_image_url: branding.banner_image_url || '',
    primary_color: branding.primary_color || '#1e3a8a',
    secondary_color: branding.secondary_color || '#d97706',
    accent_color: branding.accent_color || '#2563eb',
    choir_name: choirInfo.choir_name || 'La Lumiere Choir',
    affiliation: choirInfo.affiliation || 'ADEPR Nyanza, Kicukiro District, Rwanda',
    about_story: choirInfo.about_story || '',
    mission: choirInfo.mission || '',
    vision: choirInfo.vision || '',
    contact_phone: choirInfo.contact_phone || '',
    contact_email: choirInfo.contact_email || '',
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      setIsLoadingMetrics(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [metricsRes, songsRes, catRes, comRes, usersRes, donRes, provRes] =
        await Promise.all([
          fetch('/api/admin/metrics', { headers }),
          fetch('/api/songs?status=all'),
          fetch('/api/songs/categories'),
          fetch('/api/admin/comments', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/donations', { headers }),
          fetch('/api/admin/payment-providers', { headers }),
        ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (songsRes.ok) setSongs(await songsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (comRes.ok) setComments(await comRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (donRes.ok) setDonations(await donRes.json());
      if (provRes.ok) setProviders(await provRes.json());
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // Handle Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBranding(true);
      await updateBranding(brandingForm);
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
      refreshBranding();
    } catch (err: any) {
      alert(err.message || 'Failed to save branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Export Donations CSV
  const handleExportDonations = () => {
    if (donations.length === 0) return;
    const headers = [
      'Reference',
      'Donor',
      'Phone',
      'Amount',
      'Currency',
      'Provider',
      'Purpose',
      'Status',
      'Date',
    ];
    const rows = donations.map(d => [
      d.internal_reference,
      d.donor_name,
      d.donor_phone,
      d.amount,
      d.currency,
      d.provider_slug,
      `"${(d.donation_purpose || '').replace(/"/g, '""')}"`,
      d.status,
      d.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `lalumiere_donations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is not authenticated as admin, show dedicated Admin Login Portal
  if (!isAdmin) {
    return (
      <AdminLoginPortal
        onBackToHome={onNavigateHome}
        onSuccess={() => loadDashboardData()}
      />
    );
  }

  return (
    <div className="pb-28 space-y-5 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs shrink-0">
            <ChoirLogo size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight font-serif">
                Ubuyobozi bwa Korali (Admin CMS)
              </h1>
              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold rounded-md uppercase">
                {user?.role || 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              La Lumiere Choir • ADEPR Nyanza, Kicukiro District, Rwanda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Vugurura (Refresh)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-slate-100 p-1.5 rounded-2xl">
        {[
          { id: 'overview', label: 'Incamake', icon: Shield },
          { id: 'songs', label: 'Indirimbo', icon: BookOpen },
          { id: 'media', label: 'Amajwi & Amafoto', icon: Volume2 },
          { id: 'content', label: 'Ibirimo & Amatangazo', icon: FileText },
          { id: 'comments', label: 'Ibitekerezo', icon: MessageSquare },
          { id: 'users', label: 'Abakoresha', icon: Users },
          { id: 'logs', label: 'Ubugenzuzi (Logs)', icon: Clock },
          { id: 'branding', label: 'Ibirango & Logo', icon: Palette },
          { id: 'donations', label: 'Inkunga (MoMo)', icon: HeartHandshake },
          { id: 'payments', label: 'Gateway', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          metrics={metrics}
          isLoading={isLoadingMetrics}
          onNavigateTab={tab => setActiveTab(tab as any)}
          onOpenAddSong={() => setActiveTab('songs')}
          onOpenAddAnnouncement={() => setActiveTab('content')}
          onOpenAddEvent={() => setActiveTab('content')}
        />
      )}

      {/* 2. SONGS TAB */}
      {activeTab === 'songs' && (
        <AdminSongsTab
          songs={songs}
          categories={categories}
          onRefresh={loadDashboardData}
          onSelectSong={onSelectSong}
          onOpenUploadAudio={songId => setActiveTab('media')}
        />
      )}

      {/* 3. MEDIA (AUDIO & IMAGES) TAB */}
      {activeTab === 'media' && (
        <AdminMediaTab songs={songs} onRefreshSongs={loadDashboardData} />
      )}

      {/* 4. CONTENT (ANNOUNCEMENTS, EVENTS, DOCUMENTS, ARTICLES) */}
      {activeTab === 'content' && <AdminContentTab songs={songs} />}

      {/* 5. COMMENTS MODERATION */}
      {activeTab === 'comments' && (
        <AdminCommentsTab comments={comments} onRefresh={loadDashboardData} />
      )}

      {/* 6. USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          onRefresh={loadDashboardData}
          currentUserRole={user?.role}
        />
      )}

      {/* 7. ACTIVITY LOGS */}
      {activeTab === 'logs' && <AdminLogsTab />}

      {/* 8. BRANDING & LOGO */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 font-serif">
              Gucunga Ibirango na Logo (Choir Branding & Identity)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Iyi porogaramu ikoresha logo yemewe ya La Lumiere Choir. Ushobora gushyiraho cyangwa kuvugurura logo zose, amabara, n'amakuru arambuye y'amateka ya Korali.
            </p>
          </div>

          {brandingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Ibirango na Logo byavuguruwe neza muri porogaramu yose!</span>
            </div>
          )}

          {/* Live Preview Panel */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Isubiramo ry'Imiterere (Live Branding Preview):
            </span>
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">Choir Logo</span>
                <ChoirLogo size="md" />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">With Title</span>
                <ChoirLogo size="sm" showSubtitle={true} />
              </div>
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block mb-1">Large Splash</span>
                <ChoirLogo size="lg" variant="splash" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Logo Nkuru (Official Main Logo URL):
                </label>
                <input
                  type="url"
                  value={brandingForm.main_logo_url}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, main_logo_url: e.target.value })
                  }
                  placeholder="https://.../lalumiere-logo.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  App Icon Logo URL (Agashusho ka Porogaramu):
                </label>
                <input
                  type="url"
                  value={brandingForm.app_icon_url}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, app_icon_url: e.target.value })
                  }
                  placeholder="https://.../app-icon.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Splash Screen Logo URL:
                </label>
                <input
                  type="url"
                  value={brandingForm.splash_logo_url}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, splash_logo_url: e.target.value })
                  }
                  placeholder="https://.../splash-logo.png"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Banner / Cover Image URL:
                </label>
                <input
                  type="url"
                  value={brandingForm.banner_image_url}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, banner_image_url: e.target.value })
                  }
                  placeholder="https://.../choir-banner.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-3 gap-3 border-t pt-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Primary Color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.primary_color}
                    onChange={e =>
                      setBrandingForm({ ...brandingForm, primary_color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.primary_color}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Secondary / Gold:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.secondary_color}
                    onChange={e =>
                      setBrandingForm({ ...brandingForm, secondary_color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.secondary_color}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Accent Color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandingForm.accent_color}
                    onChange={e =>
                      setBrandingForm({ ...brandingForm, accent_color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="font-mono text-xs">{brandingForm.accent_color}</span>
                </div>
              </div>
            </div>

            {/* Choir Information Text */}
            <div className="border-t pt-3 space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Izina rya Korali (Choir Name):
                </label>
                <input
                  type="text"
                  value={brandingForm.choir_name}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, choir_name: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Itorero n'Aho Ibarizwa (Affiliation):
                </label>
                <input
                  type="text"
                  value={brandingForm.affiliation}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, affiliation: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Amateka n'Intego (About Story):
                </label>
                <textarea
                  rows={3}
                  value={brandingForm.about_story}
                  onChange={e =>
                    setBrandingForm({ ...brandingForm, about_story: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingBranding}
              className="w-full py-3 bg-blue-950 text-white rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSavingBranding
                ? 'Kubika...'
                : 'Bika no Gutangaza Ibirango (Save & Publish Branding)'}
            </button>
          </form>
        </div>
      )}

      {/* 9. DONATIONS & FINANCIALS */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-serif">
                Ibyinjijwe n'Impano za Mobile Money (Financials)
              </h3>
              <p className="text-xs text-slate-500">
                Uruhererekane rwose rwa MTN Mobile Money na Airtel Money mu Rwanda
              </p>
            </div>
            <button
              onClick={handleExportDonations}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Sohora Raporo (Export CSV)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-2">Ref</th>
                  <th className="py-2.5 px-2">Utanze</th>
                  <th className="py-2.5 px-2">Phone</th>
                  <th className="py-2.5 px-2">Amafaranga</th>
                  <th className="py-2.5 px-2">Uburyo</th>
                  <th className="py-2.5 px-2">Status</th>
                  <th className="py-2.5 px-2">Itariki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Nta nyemezabwishyu zibonetse
                    </td>
                  </tr>
                ) : (
                  donations.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono font-bold text-slate-800">
                        {d.internal_reference}
                      </td>
                      <td className="py-2 px-2 font-medium text-slate-900">{d.donor_name}</td>
                      <td className="py-2 px-2 font-mono text-slate-600">{d.donor_phone}</td>
                      <td className="py-2 px-2 font-mono font-bold text-emerald-900">
                        {d.amount.toLocaleString()} RWF
                      </td>
                      <td className="py-2 px-2 uppercase font-semibold text-slate-700">
                        {d.provider_slug}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            d.status === 'successful'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-400 text-[10px]">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. PAYMENT GATEWAY SETTINGS */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in duration-150">
          <h3 className="font-extrabold text-base text-slate-900 font-serif">
            Amakuru ya Payment Gateway (MTN & Airtel Rwanda)
          </h3>
          <p className="text-xs text-slate-500">
            Igenzura rya API endpoints, Merchant IDs, na Webhook URL yo kwakira ibyemezo bya Mobile Money.
          </p>

          <div className="space-y-3">
            {providers.map(p => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs bg-slate-50/50"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900">{p.name}</h4>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-mono font-bold rounded">
                    {p.environment}
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">Slug: {p.slug}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Endpoint: {p.api_endpoint || 'Default gateway'}
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Merchant Account: {p.merchant_account_id || 'Configured via .env'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
