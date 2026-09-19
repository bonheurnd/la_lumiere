import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { ChoirLogo } from './ChoirLogo';
import { MapPin, Phone, Mail, Youtube, Instagram, Facebook, Award, Users, Heart } from 'lucide-react';

export const AboutScreen: React.FC = () => {
  const { choirInfo } = useBranding();

  return (
    <div className="pb-28 space-y-5 max-w-xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-blue-900/60 text-center relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <ChoirLogo size="lg" variant="splash" className="mx-auto" />

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100 font-serif">
              {choirInfo.choir_name}
            </h1>
            <p className="text-xs text-amber-300 font-bold uppercase tracking-wider mt-0.5">
              ADEPR Nyanza • Kicukiro District, Kigali, Rwanda
            </p>
          </div>
        </div>
      </div>

      {/* Story Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 font-serif border-b pb-2">
          Amateka n'Umuhamagaro (Our Story & Calling)
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          {choirInfo.about_story}
        </p>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Intego (Mission)</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {choirInfo.mission}
            </p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Icyerekezo (Vision)</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {choirInfo.vision}
            </p>
          </div>
        </div>
      </div>

      {/* Church Affiliation & Location */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-xs">
        <h2 className="text-base font-extrabold text-slate-900 font-serif border-b pb-2">
          Itorero n'Icyicaro (Church Affiliation)
        </h2>

        <div className="flex items-start gap-3 text-slate-700">
          <MapPin className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">ADEPR Paruwasi ya Nyanza</p>
            <p className="text-slate-500 text-[11px]">Akarere ka Kicukiro, Umujyi wa Kigali, Rwanda</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-700">
          <Phone className="w-4 h-4 text-blue-900 shrink-0" />
          <span>{choirInfo.contact_phone}</span>
        </div>

        <div className="flex items-center gap-3 text-slate-700">
          <Mail className="w-4 h-4 text-blue-900 shrink-0" />
          <span>{choirInfo.contact_email}</span>
        </div>
      </div>

      {/* Social Media Channels */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-center">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
          Dukurikire ku Mbuga Nkoranyambaga (Follow Us)
        </h3>
        <div className="flex items-center justify-center gap-4">
          <a
            href={choirInfo.socials.youtube}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-2xs"
            title="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </a>
          <a
            href={choirInfo.socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-pink-50 text-pink-600 rounded-2xl hover:bg-pink-100 transition-colors shadow-2xs"
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href={choirInfo.socials.facebook}
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-colors shadow-2xs"
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};
