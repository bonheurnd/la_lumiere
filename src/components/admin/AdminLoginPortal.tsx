import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChoirLogo } from '../ChoirLogo';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPortalProps {
  onBackToHome?: () => void;
  onSuccess?: () => void;
}

export const AdminLoginPortal: React.FC<AdminLoginPortalProps> = ({ onBackToHome, onSuccess }) => {
  const { user, adminLogin, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await adminLogin(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Kwinjira byanze. Suzuma imeyili n\'ijambo ry\'ibanga.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-200/90 space-y-6">
        {/* Choir Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 border border-amber-200/60 mb-1">
            <ChoirLogo size="md" />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-blue-900 font-extrabold text-xs tracking-wider uppercase">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin Control Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
            Kwinjira mu Buyobozi
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            La Lumiere Choir • Content Management & Administration System
          </p>
        </div>

        {/* Notice if already logged in with non-admin account */}
        {user && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konti winjiyemo ntabwo ifite uburenganzira bwa Admin.</p>
                <p className="text-[11px] text-amber-700">
                  Ubu winjiye nka: <span className="font-mono font-semibold">{user.email}</span> ({user.role})
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t border-amber-200/60">
              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-amber-900 hover:underline"
              >
                Sohoka muri iyi konti (Log out)
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Secure login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Imeyili y'Ubuyobozi (Admin Email):
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@lalumierechoir.rw"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ijambo ry'Ibanga (Password):
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>{isLoading ? 'Gusuzuma uburenganzira...' : 'Injira mu Buyobozi (Admin Sign In)'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Subira Ahabanza (Home)</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400 ml-auto">
            Umutekano urarinzwe (Encrypted)
          </span>
        </div>
      </div>
    </div>
  );
};
