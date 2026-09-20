import React, { useState, useMemo } from 'react';
import { UserProfile, UserRole } from '../../types';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Key,
  Edit2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminUsersTabProps {
  users: UserProfile[];
  onRefresh: () => void;
  currentUserRole?: UserRole;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  onRefresh,
  currentUserRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Edit Role modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Reset Password modal
  const [passwordResetUser, setPasswordResetUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Toggle status state
  const [toggleStatusUser, setToggleStatusUser] = useState<UserProfile | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (u.full_name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        const matchesPhone = (u.phone || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      if (roleFilter !== 'all') {
        if (u.role !== roleFilter) return false;
      }

      if (statusFilter !== 'all') {
        const isActive = u.is_disabled !== 1;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'disabled' && isActive) return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Update Role
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsUpdatingRole(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');

      const res = await fetch(`/api/admin/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      setSuccessMsg(`Inshingano za ${editingUser.full_name} zahinduwe kuri ${selectedRole}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingUser(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Guhindura inshingano byanze');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Toggle Enable / Disable
  const handleToggleStatus = async () => {
    if (!toggleStatusUser) return;
    try {
      setIsTogglingStatus(true);
      const token = localStorage.getItem('lalumiere_token');
      const shouldDisable = toggleStatusUser.is_disabled !== 1;

      const res = await fetch(`/api/admin/users/${toggleStatusUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_disabled: shouldDisable }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      setToggleStatusUser(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Guhagarika/Gufungura byanze');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !newPassword) return;

    if (newPassword.length < 6) {
      setErrorMsg('Ijambobanga rigomba kugira byibuze inyuguti 6');
      return;
    }

    try {
      setIsResettingPassword(true);
      setErrorMsg('');
      const token = localStorage.getItem('lalumiere_token');

      const res = await fetch(`/api/admin/users/${passwordResetUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg(`Ijambobanga rya ${passwordResetUser.full_name} ryahinduwe neza!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setPasswordResetUser(null);
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Guhindura ijambobanga byanze');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-900" />
              <span>Gucunga Abakoresha (User Management & Roles)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Guhindura inshingano (Roles), guhagarika kwinjira, no guhindura amagambobanga
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl self-start sm:self-auto"
            title="Vugurura"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
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

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Shakisha izina, email, telefone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Inshingano zose ({users.length})</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="content_admin">Content Admin</option>
            <option value="moderator">Moderator</option>
            <option value="member">Choir Member</option>
            <option value="supporter">Supporter</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
          >
            <option value="all">Imimerere yose</option>
            <option value="active">Abafite uburenganzira (Active)</option>
            <option value="disabled">Abahagaritswe (Disabled)</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-xs text-slate-400 border border-slate-200/80">
            Nta mukoresha ubonywe uhuye n'ibyo ushakishije
          </div>
        ) : (
          filteredUsers.map(u => {
            const isDisabled = u.is_disabled === 1;
            const isAdmin = ['super_admin', 'admin', 'content_admin', 'moderator'].includes(
              u.role
            );

            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isAdmin
                        ? 'bg-blue-950 text-amber-400 border border-amber-400/30'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {(u.full_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {u.full_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                          isAdmin
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                      {isDisabled && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                          Bahagaritswe
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>{u.email}</span>
                      {u.phone && <span>• {u.phone}</span>}
                      {u.choir_voice && <span>• Ijwi: {u.choir_voice}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {/* Change Role */}
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setSelectedRole(u.role);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                    title="Hindura Inshingano"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-900" />
                    <span>Inshingano</span>
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => {
                      setPasswordResetUser(u);
                      setNewPassword('');
                    }}
                    className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                    title="Guhindura Ijambobanga"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  {/* Enable / Disable */}
                  <button
                    onClick={() => setToggleStatusUser(u)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDisabled
                        ? 'text-emerald-700 hover:bg-emerald-50'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title={isDisabled ? 'Fungura uyu mukoresha' : 'Hagarika uyu mukoresha'}
                  >
                    {isDisabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ROLE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Hindura Inshingano za: {editingUser.full_name}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hitamo Inshingano Nshya (User Role)
                </label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="super_admin">Super Admin (Ubuyobozi Bukuru bwose)</option>
                  <option value="admin">Admin (Gucunga indirimbo n'ibirimo)</option>
                  <option value="content_admin">Content Admin (Amatangazo n'inyandiko)</option>
                  <option value="moderator">Moderator (Gusuzuma ibitekerezo)</option>
                  <option value="member">Choir Member (Umunyamuryango wa Korali)</option>
                  <option value="supporter">Supporter (Umukunzi wa Korali)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  {isUpdatingRole ? 'Guhindura...' : 'Emeza Inshingano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                Guhindura Ijambobanga: {passwordResetUser.full_name}
              </h3>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ijambobanga Rishya (New Password) *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Byibuze inyuguti 6..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Reka
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl"
                >
                  {isResettingPassword ? 'Guhindura...' : 'Bika Ijambobanga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS TOGGLE */}
      <ConfirmDialog
        isOpen={Boolean(toggleStatusUser)}
        title={
          toggleStatusUser?.is_disabled === 1
            ? 'Gufungura Uyu Mukoresha?'
            : 'Guhagarika Uyu Mukoresha?'
        }
        message={
          toggleStatusUser?.is_disabled === 1
            ? `Uremeza ko ushaka gusubiza uburenganzira ${toggleStatusUser?.full_name}?`
            : `Uremeza ko ushaka guhagarika ${toggleStatusUser?.full_name}? Ntabwo azashobora kwinjira muri porogaramu.`
        }
        confirmText={toggleStatusUser?.is_disabled === 1 ? 'Fungura' : 'Hagarika'}
        cancelText="Reka"
        isDestructive={toggleStatusUser?.is_disabled !== 1}
        isLoading={isTogglingStatus}
        onConfirm={handleToggleStatus}
        onCancel={() => setToggleStatusUser(null)}
      />
    </div>
  );
};
