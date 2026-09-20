import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { ChoirLogo } from './ChoirLogo';
import {
  User,
  Info,
  Shield,
  Smartphone,
  FileText,
  HeartHandshake,
  Share2,
  Phone,
  Mail,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface MoreScreenProps {
  onNavigateToTab: (tab: string) => void;
  onOpenStoreModal: () => void;
  onOpenAuth: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  onNavigateToTab,
  onOpenStoreModal,
  onOpenAuth,
}) => {
  const { user, isAdmin } = useAuth();
  const { choirInfo } = useBranding();

  return (
    <div className="pb-28 space-y-5 max-w-xl mx-auto">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
        <ChoirLogo size="md" />
        <div className="min-w-0">
          <h2 className="font-extrabold text-base text-slate-900 font-serif truncate">
            {choirInfo.choir_name}
          </h2>
          <p className="text-xs text-slate-500 truncate">
            {choirInfo.affiliation}
          </p>
          <span className="text-[10px] font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
            v1.0.0 Production Release
          </span>
        </div>
      </div>

      {/* Main Options Menu */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
        {/* User Account */}
        <button
          onClick={() => {
            if (user) onNavigateToTab('profile');
            else onOpenAuth();
          }}
          className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-950 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                {user ? user.name : 'Konti yawe (User Account)'}
              </span>
              <span className="text-[11px] text-slate-500">
                {user ? user.email : 'Injira cyangwa iyandikishe muri Korali'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Admin Dashboard if Admin */}
        {isAdmin && (
          <button
            onClick={() => onNavigateToTab('admin')}
            className="w-full p-4 bg-amber-50/50 hover:bg-amber-100/50 flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-amber-950 block">
                  Ubuyobozi bwa Korali (Admin Dashboard)
                </span>
                <span className="text-[11px] text-amber-800">
                  Gucunga indirimbo, ibirango na logo, imisanzu ya MoMo
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700" />
          </button>
        )}

        {/* About La Lumiere Choir */}
        <button
          onClick={() => onNavigateToTab('about')}
          className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Amateka n'Intego (About La Lumiere)
              </span>
              <span className="text-[11px] text-slate-500">
                ADEPR Nyanza, Kicukiro • Amateka, Intego n'Icyerekezo
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Support Choir */}
        <button
          onClick={() => onNavigateToTab('support')}
          className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Tanga Inkunga (Support Choir)
              </span>
              <span className="text-[11px] text-slate-500">
                MTN Mobile Money na Airtel Money mu Rwanda
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* App Store & Play Store Docs */}
        <button
          onClick={onOpenStoreModal}
          className="w-full p-4 hover:bg-slate-50 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Store Submission & Compliance
              </span>
              <span className="text-[11px] text-slate-500">
                Google Play & Apple App Store readiness & Privacy Policy
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Direct Contact Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2.5 text-xs text-slate-700">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Twandikire / Tuvugishe (Contact Choir Leadership):
        </h4>
        <div className="flex items-center gap-2 text-slate-600">
          <Phone className="w-4 h-4 text-blue-900" />
          <span>{choirInfo.contact_phone}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="w-4 h-4 text-blue-900" />
          <span>{choirInfo.contact_email}</span>
        </div>
      </div>

      {/* Admin Portal Gateway Link */}
      <div className="pt-1 pb-4 text-center">
        <button
          onClick={() => onNavigateToTab('admin')}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-blue-950 transition-colors py-1.5 px-3 rounded-xl hover:bg-slate-100 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Ubuyobozi bwa Korali (Admin Portal)</span>
        </button>
      </div>
    </div>
  );
};
