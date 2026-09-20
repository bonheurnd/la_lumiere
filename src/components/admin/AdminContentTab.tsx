import React, { useState, useEffect } from 'react';
import {
  Announcement,
  EventItem,
  DocumentItem,
  ContentArticle,
  Song,
} from '../../types';
import {
  FileText,
  Calendar,
  FileCheck,
  Newspaper,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  Upload,
  X,
  Clock,
  MapPin,
  FileDown,
  RefreshCw,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminContentTabProps {
  songs: Song[];
  initialSubTab?: 'announcements' | 'events' | 'documents' | 'articles';
}

export const AdminContentTab: React.FC<AdminContentTabProps> = ({
  songs,
  initialSubTab = 'announcements',
}) => {
  const [subTab, setSubTab] = useState<'announcements' | 'events' | 'documents' | 'articles'>(
    initialSubTab
  );

  // Data lists
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [articles, setArticles] = useState<ContentArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal editing states
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem> | null>(null);
  const [editingDocument, setEditingDocument] = useState<Partial<DocumentItem> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<ContentArticle> | null>(null);

  // Delete confirms
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'announcements' | 'events' | 'documents' | 'articles';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all content
  const fetchAllContent = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [annRes, evRes, docRes, artRes] = await Promise.all([
        fetch('/api/admin/announcements', { headers }),
        fetch('/api/admin/events', { headers }),
        fetch('/api/admin/documents', { headers }),
        fetch('/api/admin/articles', { headers }),
      ]);

      if (annRes.ok) setAnnouncements(await annRes.json());
      if (evRes.ok) setEvents(await evRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
      if (artRes.ok) setArticles(await artRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContent();
  }, []);

  // -------------------------------------------------------------
  // ANNOUNCEMENTS HANDLERS
  // -------------------------------------------------------------
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement || !editingAnnouncement.title || !editingAnnouncement.content) {
      setErrorMsg('Umutwe n\'ubutumwa birakenewe');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const isNew = !editingAnnouncement.id;
      const url = isNew
        ? '/api/admin/announcements'
        : `/api/admin/announcements/${editingAnnouncement.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingAnnouncement),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save announcement');
      }

      setSuccessMsg(isNew ? 'Itangazo ryashyizwemo neza' : 'Itangazo ryavuguruwe');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingAnnouncement(null);
      fetchAllContent();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // EVENTS HANDLERS
  // -------------------------------------------------------------
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title || !editingEvent.event_date) {
      setErrorMsg('Umutwe n\'itariki y\'igikorwa birakenewe');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const isNew = !editingEvent.id;
      const url = isNew ? '/api/admin/events' : `/api/admin/events/${editingEvent.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingEvent),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save event');
      }

      setSuccessMsg(isNew ? 'Igikorwa cyashyizwemo neza' : 'Igikorwa cyavuguruwe');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingEvent(null);
      fetchAllContent();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // DOCUMENTS HANDLERS
  // -------------------------------------------------------------
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument || !editingDocument.title || !editingDocument.file_url) {
      setErrorMsg('Umutwe n\'ifishi ya dosiye (file URL) birakenewe');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const isNew = !editingDocument.id;
      const url = isNew ? '/api/admin/documents' : `/api/admin/documents/${editingDocument.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingDocument),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save document');
      }

      setSuccessMsg(isNew ? 'Inyandiko yashyizwemo neza' : 'Inyandiko yavuguruwe');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingDocument(null);
      fetchAllContent();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // -------------------------------------------------------------
  // ARTICLES HANDLERS
  // -------------------------------------------------------------
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title || !editingArticle.content) {
      setErrorMsg('Umutwe n\'inyandiko birakenewe');
      return;
    }

    try {
      const token = localStorage.getItem('lalumiere_token');
      const isNew = !editingArticle.id;
      const url = isNew ? '/api/admin/articles' : `/api/admin/articles/${editingArticle.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingArticle),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save article');
      }

      setSuccessMsg(isNew ? 'Inkuru yashyizwemo neza' : 'Inkuru yavuguruwe');
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingArticle(null);
      fetchAllContent();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // General Delete Execution
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch(`/api/admin/${deleteTarget.type}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDeleteTarget(null);
        fetchAllContent();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Generic File Upload Helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string, filename: string, size: number) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('lalumiere_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        onUploaded(data.url, file.name, file.size);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Top Nav Switcher */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-900" />
              <span>Gucunga Ibirimo & Amatangazo (Content Management)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Amatangazo, ibikorwa bya Korali, inyandiko za Solfa, n'inkuru
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllContent}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
              title="Vugurura"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold pt-1 border-t border-slate-100">
          {[
            { id: 'announcements', label: `Amatangazo (${announcements.length})`, icon: FileText },
            { id: 'events', label: `Ibikorwa (${events.length})`, icon: Calendar },
            { id: 'documents', label: `Inyandiko & Solfa (${documents.length})`, icon: FileCheck },
            { id: 'articles', label: `Inkuru & Amakuru (${articles.length})`, icon: Newspaper },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubTab(tab.id as any);
                  setErrorMsg('');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts */}
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

      {/* ================= 1. ANNOUNCEMENTS ================= */}
      {subTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingAnnouncement({
                  title: '',
                  content: '',
                  category: 'general',
                  status: 'published',
                  is_active: 1,
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ongera Itangazo Rishya</span>
            </button>
          </div>

          <div className="space-y-2">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
                Nta matangazo arashyirwamo
              </div>
            ) : (
              announcements.map(ann => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {ann.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          ann.status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {ann.status || 'published'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[10px] font-bold">
                        {ann.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setEditingAnnouncement(ann)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Hindura"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'announcements',
                          id: ann.id,
                          title: ann.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Siba"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= 2. EVENTS ================= */}
      {subTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingEvent({
                  title: '',
                  description: '',
                  event_date: new Date().toISOString().split('T')[0],
                  location: 'ADEPR Nyanza, Kicukiro',
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ongera Igikorwa Gishya</span>
            </button>
          </div>

          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
                Nta bikorwa (events) birashyirwamo
              </div>
            ) : (
              events.map(ev => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{ev.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          ev.status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {ev.status || 'published'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-blue-950">
                        <Calendar className="w-3 h-3 text-blue-900" />
                        <span>{ev.event_date}</span>
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{ev.location}</span>
                        </span>
                      )}
                    </div>

                    {ev.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{ev.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Hindura"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'events',
                          id: ev.id,
                          title: ev.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Siba"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= 3. DOCUMENTS & SOLFA ================= */}
      {subTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingDocument({
                  title: '',
                  doc_type: 'solfa_guide',
                  file_url: '',
                  song_id: songs[0]?.id || '',
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ongera Inyandiko / Solfa Sheet</span>
            </button>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
                Nta nyandiko za Solfa cyangwa amabwiriza arashyirwamo
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{doc.title}</h3>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[10px] font-bold border border-amber-200">
                        {doc.doc_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {doc.song_title && (
                        <span>
                          Indirimbo:{' '}
                          <span className="font-semibold text-blue-950">{doc.song_title}</span>
                        </span>
                      )}
                      {doc.file_size_bytes && (
                        <span>• {(doc.file_size_bytes / 1024).toFixed(1)} KB</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg font-bold text-xs inline-flex items-center gap-1"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Fungura</span>
                    </a>
                    <button
                      onClick={() => setEditingDocument(doc)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Hindura"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'documents',
                          id: doc.id,
                          title: doc.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Siba"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= 4. ARTICLES ================= */}
      {subTab === 'articles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingArticle({
                  title: '',
                  type: 'news',
                  summary: '',
                  content: '',
                  status: 'published',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ongera Inkuru Nshya</span>
            </button>
          </div>

          <div className="space-y-2">
            {articles.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
                Nta nkuru zirasohoka
              </div>
            ) : (
              articles.map(art => (
                <div
                  key={art.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">{art.title}</h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md text-[10px] font-bold uppercase">
                        {art.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          art.status === 'draft'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {art.status || 'published'}
                      </span>
                    </div>

                    {art.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2">{art.summary}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setEditingArticle(art)}
                      className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Hindura"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: 'articles',
                          id: art.id,
                          title: art.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Siba"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= EDIT ANNOUNCEMENT MODAL ================= */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingAnnouncement.id ? 'Hindura Itangazo' : 'Itangazo Rishya'}
              </h3>
              <button
                onClick={() => setEditingAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Umutwe w'Itangazo *</label>
                <input
                  type="text"
                  required
                  value={editingAnnouncement.title || ''}
                  onChange={e =>
                    setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Icyiciro</label>
                  <select
                    value={editingAnnouncement.category || 'general'}
                    onChange={e =>
                      setEditingAnnouncement({ ...editingAnnouncement, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="general">Rusange (General)</option>
                    <option value="rehearsal">Imyitozo (Rehearsal)</option>
                    <option value="concert">Igitaramo (Concert)</option>
                    <option value="urgent">Byihuse (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Imimerere</label>
                  <select
                    value={editingAnnouncement.status || 'published'}
                    onChange={e =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="published">Published (Tangaza)</option>
                    <option value="draft">Draft (Inyandiko mbanziriza)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ubutumwa bw'Itangazo *</label>
                <textarea
                  rows={5}
                  required
                  value={editingAnnouncement.content || ''}
                  onChange={e =>
                    setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  Bika Itangazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT EVENT MODAL ================= */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingEvent.id ? 'Hindura Igikorwa' : 'Igikorwa Gishya'}
              </h3>
              <button onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Umutwe w'Igikorwa *</label>
                <input
                  type="text"
                  required
                  value={editingEvent.title || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Itariki *</label>
                  <input
                    type="date"
                    required
                    value={editingEvent.event_date || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ahobizabera</label>
                  <input
                    type="text"
                    value={editingEvent.location || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    placeholder="ADEPR Nyanza"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ibisobanuro</label>
                <textarea
                  rows={4}
                  value={editingEvent.description || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  Bika Igikorwa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT DOCUMENT MODAL ================= */}
      {editingDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingDocument.id ? 'Hindura Inyandiko' : 'Inyandiko Nshya'}
              </h3>
              <button
                onClick={() => setEditingDocument(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Izina ry'Inyandiko *</label>
                <input
                  type="text"
                  required
                  value={editingDocument.title || ''}
                  onChange={e => setEditingDocument({ ...editingDocument, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ubwoko</label>
                  <select
                    value={editingDocument.doc_type || 'solfa_guide'}
                    onChange={e => setEditingDocument({ ...editingDocument, doc_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="solfa_guide">Amanota ya Solfa (Solfa Guide)</option>
                    <option value="sheet_music">Sheet Music / Partition</option>
                    <option value="rehearsal_schedule">Gahunda y'imyitozo</option>
                    <option value="general">Amabwiriza Rusange</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Indirimbo Bihura</label>
                  <select
                    value={editingDocument.song_id || ''}
                    onChange={e => setEditingDocument({ ...editingDocument, song_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="">Nta ndirimbo yihariye</option>
                    {songs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dosiye (File URL cyangwa Upload) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editingDocument.file_url || ''}
                    onChange={e => setEditingDocument({ ...editingDocument, file_url: e.target.value })}
                    placeholder="/uploads/... cyangwa link"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                  />
                  <label className="px-3 py-2 bg-blue-900 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      onChange={e =>
                        handleFileUpload(e, (url, filename, size) => {
                          setEditingDocument(prev =>
                            prev
                              ? {
                                  ...prev,
                                  file_url: url,
                                  original_filename: filename,
                                  file_size_bytes: size,
                                }
                              : null
                          );
                        })
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDocument(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  Bika Inyandiko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT ARTICLE MODAL ================= */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingArticle.id ? 'Hindura Inkuru' : 'Inkuru Nshya'}
              </h3>
              <button onClick={() => setEditingArticle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Umutwe w'Inkuru *</label>
                <input
                  type="text"
                  required
                  value={editingArticle.title || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ubwoko</label>
                  <select
                    value={editingArticle.type || 'news'}
                    onChange={e => setEditingArticle({ ...editingArticle, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="news">Amakuru (News)</option>
                    <option value="devotional">Ijambo ry'Imana (Devotional)</option>
                    <option value="video">Amashusho (Video)</option>
                    <option value="notice">Itangazo (Notice)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Imimerere</label>
                  <select
                    value={editingArticle.status || 'published'}
                    onChange={e => setEditingArticle({ ...editingArticle, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Incamake (Summary)</label>
                <input
                  type="text"
                  value={editingArticle.summary || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inyandiko Nyirizina (Content) *</label>
                <textarea
                  rows={6}
                  required
                  value={editingArticle.content || ''}
                  onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  Bika Inkuru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Gusiba ibi bikubiyemo?"
        message={`Uremeza ko ushaka gusiba "${deleteTarget?.title}"?`}
        confirmText="Yego, Siba"
        cancelText="Reka"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
