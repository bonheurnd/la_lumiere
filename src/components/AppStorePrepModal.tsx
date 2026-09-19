import React, { useState } from 'react';
import { X, CheckCircle, Smartphone, Shield, FileText, Download, Apple, Play } from 'lucide-react';

interface AppStorePrepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppStorePrepModal: React.FC<AppStorePrepModalProps> = ({ isOpen, onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'checklist' | 'privacy' | 'terms'>('checklist');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Production Ready • Store Compliance
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 font-serif mt-1">
              Google Play & Apple App Store Publishing Readiness
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-nav */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveDoc('checklist')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeDoc === 'checklist' ? 'bg-white text-blue-950 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Store Checklist & Metadata
          </button>
          <button
            onClick={() => setActiveDoc('privacy')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeDoc === 'privacy' ? 'bg-white text-blue-950 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Privacy Policy (Mandatory)
          </button>
          <button
            onClick={() => setActiveDoc('terms')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeDoc === 'terms' ? 'bg-white text-blue-950 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {activeDoc === 'checklist' && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-2">
              <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-800" />
                <span>Application Identifiers & Metadata</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">Package ID (Android & iOS):</span>
                  <span className="font-bold text-slate-900">rw.adepr.lalumierechoir</span>
                </div>
                <div>
                  <span className="text-slate-400 block">App Name:</span>
                  <span className="font-bold text-slate-900">La Lumiere Choir</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-bold text-slate-900">Music & Audio / Books & Reference</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Target Audience:</span>
                  <span className="font-bold text-slate-900">Everyone (All ages)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-sm">Store Submission Compliance Audit</h4>
              {[
                { title: 'Account Deletion Flow', desc: 'Direct in-app account deletion enabled in Profile screen to satisfy Apple App Store Guideline 5.1.1(v) and Google Play Data Safety policies.', ok: true },
                { title: 'Safe Rwanda MoMo Payments', desc: 'Compliant external ministry donations flow without storing Mobile Money PINs or sensitive credentials in client code.', ok: true },
                { title: 'Audio Background Playback', desc: 'Global audio player keeps playing across tabs and routes, with standard HTML5 Audio events and background streaming readiness.', ok: true },
                { title: 'Adaptive Screen Layouts', desc: 'Tested on smartphone screens (iPhone, Samsung Galaxy, Pixel) with touch targets >= 44px.', ok: true },
                { title: 'Offline PWA Support', desc: 'manifest.json, meta theme-color, and standalone mobile app display mode configured in /public/manifest.json.', ok: true },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">{item.title}</span>
                    <span className="text-slate-500 text-[11px]">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2 text-xs">
              <h5 className="font-bold text-amber-400 font-mono">Mobile App Binary Build Commands:</h5>
              <p className="text-[11px] text-slate-300">
                To build native Android (.apk / .aab) or iOS (.ipa) wrapper via Capacitor:
              </p>
              <pre className="bg-slate-950 p-2.5 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`# 1. Build optimized web distribution
npm run build

# 2. Add Capacitor native targets (optional for Play / App Store)
npx cap add android
npx cap add ios
npx cap sync
npx cap open android # Builds release AAB bundle for Google Play Console`}
              </pre>
            </div>
          </div>
        )}

        {activeDoc === 'privacy' && (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-1">
            <h4 className="font-bold text-slate-900 text-sm">Privacy Policy for La Lumiere Choir App</h4>
            <p className="text-[11px] text-slate-500">Effective Date: January 1, 2026</p>
            <p>
              La Lumiere Choir ("we", "our", or "the choir"), affiliated with ADEPR Nyanza in Kicukiro District, Kigali, Rwanda, operates the "La Lumiere Choir" mobile application.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">1. Information We Collect</h5>
            <p>
              We collect user-provided information including name, email address, and optional phone number when you register for an account, comment on songs, or initiate support donations. We never collect or store Mobile Money PINs or credit card credentials.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">2. Use of Information</h5>
            <p>
              Your data is used solely to authenticate your choir community session, maintain your favorite hymns, issue verified donation receipts, and deliver choir notifications. We do not sell or monetize personal data with third-party advertisers.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">3. User Rights & Account Deletion</h5>
            <p>
              In accordance with international privacy laws and mobile store requirements, users may edit their profile or permanently delete their account and associated data directly within the app settings.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">4. Contact Us</h5>
            <p>
              For privacy inquiries: info@lalumierechoir.rw | ADEPR Nyanza, Kicukiro, Kigali, Rwanda.
            </p>
          </div>
        )}

        {activeDoc === 'terms' && (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-1">
            <h4 className="font-bold text-slate-900 text-sm">Terms of Service</h4>
            <p>
              By accessing the La Lumiere Choir application, you agree to respect copyright and ministry guidelines.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">1. Spiritual Content & Copyright</h5>
            <p>
              All hymns, lyrics, musical compositions, and audio tracks are the spiritual and intellectual property of La Lumiere Choir and their respective composers. Content may be used for personal worship and congregational praise.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">2. Unreleased Content Confidentiality</h5>
            <p>
              Access to unreleased rehearsal tracks and protected song lyrics is restricted to authorized choir members. Sharing unreleased materials without leadership consent is strictly prohibited.
            </p>
            <h5 className="font-bold text-slate-900 mt-2">3. Community Conduct</h5>
            <p>
              Comments must remain respectful, encouraging, and centered on praise and testimony. Spam, harassment, or inappropriate language will result in immediate moderation and account suspension.
            </p>
          </div>
        )}

        <div className="pt-2 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-950 text-white rounded-xl text-xs font-bold hover:bg-blue-900"
          >
            Funga (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
