import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Song, PaymentTransaction } from '../types';
import {
  User,
  Mail,
  Phone,
  Shield,
  Heart,
  Receipt,
  LogOut,
  Trash2,
  Lock,
  CheckCircle,
  Bell,
  BookOpen,
} from 'lucide-react';

interface ProfileScreenProps {
  onSelectSong: (songId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onSelectSong,
  onNavigateToTab,
  onOpenAuth,
}) => {
  const { user, logout, updateProfile, deleteAccount, isAdmin } = useAuth();

  const [favorites, setFavorites] = useState<Song[]>([]);
  const [donations, setDonations] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const loadUserData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('lalumiere_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [favRes, donRes] = await Promise.all([
        fetch('/api/favorites', { headers }),
        fetch('/api/donations/history', { headers }),
      ]);

      if (favRes.ok) setFavorites(await favRes.json());
      if (donRes.ok) setDonations(await donRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      loadUserData();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('lalumiere_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMsg('Ijambo ry\'ibanga ryahinduwe neza!');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordMsg('');
          setOldPassword('');
          setNewPassword('');
        }, 1500);
      } else {
        setPasswordMsg(data.error || 'Habaye ikibazo');
      }
    } catch (err) {
      setPasswordMsg('Ikibazo cyavutse');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    const reason = prompt(
      'Uremeza ko ushaka gusiba konti yawe burundu hamwe n\'amakuru yose? (Type DELETE to confirm):'
    );
    if (reason === 'DELETE') {
      try {
        await deleteAccount();
        alert('Konti yawe yasibwe neza.');
      } catch (err: any) {
        alert(err.message || 'Failed to delete account');
      }
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-base font-extrabold text-slate-900 font-serif">Konti y'Umukunzi wa Korali</h2>
        <p className="text-xs text-slate-500">
          Injira muri konti yawe kugira ngo urebe indirimbo ukunda, inyemezabwishyu zawe, n'ibitekerezo watanze.
        </p>
        <button
          onClick={onOpenAuth}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-900"
        >
          <span>Injira / Iyandikishe (Sign In)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-5 max-w-xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-950 text-amber-300 font-black text-xl flex items-center justify-center font-serif shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-900 font-serif leading-tight">
                  {user.name}
                </h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-md flex items-center gap-0.5">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{user.email}</span>
              </p>
              {user.phone && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{user.phone}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-blue-900 hover:underline px-2.5 py-1 bg-blue-50 rounded-lg"
          >
            {isEditing ? 'Hagarika' : 'Hindura'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Konti yavuguruwe neza!</span>
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2 border-t text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amazina yawe:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nimero ya Terefone:</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-950 text-white rounded-xl font-bold hover:bg-blue-900 shadow-xs"
            >
              Bika Impinduka (Save Profile)
            </button>
          </form>
        )}
      </div>

      {/* Favorites List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600 fill-current" />
            <h3 className="font-extrabold text-sm text-slate-900 font-serif">
              Indirimbo Nkunda (My Favorites)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {favorites.length}
          </span>
        </div>

        {favorites.length === 0 ? (
          <p className="text-center py-4 text-xs text-slate-400">
            Nta ndirimbo urashyira mu zo ukunda. Kanda ku kamenyetso k'umutima ku ndirimbo wifuza.
          </p>
        ) : (
          <div className="space-y-2">
            {favorites.map(song => (
              <div
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{song.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{song.composer}</p>
                </div>
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security & Account Settings */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 font-serif border-b pb-2">
          Umutekano n'Igenzura rya Konti (Account Security)
        </h3>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Hindura Ijambo ry'Ibanga (Change Password)</span>
          </div>
          <span className="text-slate-400">›</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sohoka muri Konti (Log Out)</span>
          </div>
          <span className="text-slate-400">›</span>
        </button>

        {/* Delete Account (Mandatory for App Stores) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleDeleteAccountConfirm}
            className="w-full flex items-center justify-between p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Siba Konti yawe Burundu (Delete Account)</span>
            </div>
            <span className="text-rose-400 text-[10px]">App Store Compliant</span>
          </button>
          <span className="text-[10px] text-slate-400 block mt-1 px-1">
            Gusiba konti bisiba amakuru yawe yose bwite muri sisitemu nk'uko amategeko ya Google Play na Apple App Store abiteganya.
          </span>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-3 shadow-2xl border">
            <h4 className="font-extrabold text-sm text-slate-900">Hindura Ijambo ry'Ibanga</h4>

            {passwordMsg && (
              <p className="text-xs p-2 bg-blue-50 text-blue-900 rounded-lg">{passwordMsg}</p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Iryo usanganywe (Current):</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rishyashya (New Password):</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 bg-slate-100 rounded-lg font-bold"
                >
                  Funga
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-950 text-white rounded-lg font-bold"
                >
                  Bika
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
