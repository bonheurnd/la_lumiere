import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChoirLogo } from './ChoirLogo';
import { X, Mail, Lock, User, Phone, LogIn, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ikibazo cyavutse mu kwinjira');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'user') => {
    setError('');
    setIsLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@lalumierechoir.rw', 'AdminLumiere2026!');
      } else {
        await login('supporter@lalumierechoir.rw', 'LumiereSupporter2026!');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed demo login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <ChoirLogo size="md" className="mx-auto mb-1" />
          <h3 className="font-extrabold text-lg text-slate-900 font-serif">
            {mode === 'login' ? 'Injira muri Konti (Sign In)' : 'Iyandikishe (Create Account)'}
          </h3>
          <p className="text-xs text-slate-500">
            La Lumiere Choir • ADEPR Nyanza, Rwanda
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-blue-950 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Injira (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-blue-950 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Iyandikishe (Sign Up)
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amazina yawe (Full Name):</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Amazina..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Imeyili (Email Address):</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="urugero@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nimero ya Terefone (Rwanda Phone):</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="078... cyangwa 072..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ijambo ry'Ibanga (Password):</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-extrabold rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Gutunganya...' : mode === 'login' ? 'Injira (Sign In)' : 'Komeza (Create Account)'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Kwinjira vuba (Quick One-Click Demo):</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-200"
            >
              Demo Admin (Ubuyobozi)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('user')}
              className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-[11px] font-bold border border-blue-200"
            >
              Demo Supporter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
