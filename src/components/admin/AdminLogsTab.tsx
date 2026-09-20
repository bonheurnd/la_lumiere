import React, { useState, useEffect, useMemo } from 'react';
import { ActivityLog } from '../../types';
import {
  Shield,
  Search,
  Clock,
  RefreshCw,
  Filter,
  User,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch('/api/admin/activity-logs?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = (log.user_name || '').toLowerCase().includes(q);
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesDetails = (log.details || '').toLowerCase().includes(q);
        if (!matchesUser && !matchesAction && !matchesDetails) return false;
      }

      if (actionFilter !== 'all') {
        if (!log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-900" />
              <span>Raporo y'Ibikorwa by'Ubuyobozi (Admin Activity Logs)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ubugenzuzi n'amakuru y'ibikorwa byakozwe n'abayobozi (Audit Trail)
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl self-start sm:self-auto"
            title="Vugurura"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Shakisha mu bikorwa, izina ry'umuyobozi, amakuru..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Ibikorwa byose ({logs.length})</option>
            <option value="song">Indirimbo (Songs)</option>
            <option value="audio">Amajwi (Audio)</option>
            <option value="image">Amafoto (Images)</option>
            <option value="role">Inshingano (Roles)</option>
            <option value="comment">Ibitekerezo (Comments)</option>
            <option value="announcement">Amatangazo</option>
            <option value="event">Ibikorwa (Events)</option>
            <option value="login">Kwinjira (Login)</option>
          </select>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Gushakisha ubugenzuzi...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nta bikorwa bihuye n'ibyo ushakishije
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const isDelete = log.action.toLowerCase().includes('delete');
              const isCreate =
                log.action.toLowerCase().includes('create') ||
                log.action.toLowerCase().includes('upload');
              const isUpdate =
                log.action.toLowerCase().includes('update') ||
                log.action.toLowerCase().includes('role');

              return (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDelete
                          ? 'bg-rose-50 text-rose-700'
                          : isCreate
                          ? 'bg-emerald-50 text-emerald-700'
                          : isUpdate
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-900'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900">
                          {log.user_name || 'Admin'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                        {log.resource_type && (
                          <span className="text-[10px] text-slate-400">
                            ku: {log.resource_type}
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <p className="text-slate-600 text-[11px] mt-0.5">{log.details}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono self-end sm:self-auto shrink-0">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
