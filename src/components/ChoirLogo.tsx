import React from 'react';
import { useBranding } from '../context/BrandingContext';
import { Music2 } from 'lucide-react';

interface ChoirLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'main' | 'icon' | 'splash' | 'light' | 'dark';
  className?: string;
  showSubtitle?: boolean;
}

export const ChoirLogo: React.FC<ChoirLogoProps> = ({
  size = 'md',
  variant = 'main',
  className = '',
  showSubtitle = false,
}) => {
  const { branding, choirInfo } = useBranding();

  // Determine which logo URL to display based on variant
  let logoUrl = branding.main_logo_url;
  if (variant === 'icon' && branding.app_icon_url) logoUrl = branding.app_icon_url;
  if (variant === 'splash' && branding.splash_logo_url) logoUrl = branding.splash_logo_url;
  if (variant === 'light' && branding.light_logo_url) logoUrl = branding.light_logo_url;
  if (variant === 'dark' && branding.dark_logo_url) logoUrl = branding.dark_logo_url;

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  const hasOfficialLogo = Boolean(logoUrl && logoUrl.trim());

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {hasOfficialLogo ? (
        <img
          src={logoUrl}
          alt={choirInfo.choir_name}
          className={`${sizeClasses[size]} object-contain rounded-xl shadow-xs`}
        />
      ) : (
        // Dedicated, clearly marked placeholder strictly adhering to instructions
        <div
          className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-amber-400/30 flex flex-col items-center justify-center text-center p-1 text-amber-300 shadow-sm shrink-0 relative overflow-hidden`}
          title="La Lumiere Choir Logo (Placeholder - Upload official logo in Admin Branding)"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]" />
          <Music2 className="w-1/2 h-1/2 text-amber-400 mb-0.5" />
          <span className="font-extrabold text-[8px] tracking-tight leading-none text-slate-100 uppercase">
            La Lumiere
          </span>
          <span className="text-[6px] tracking-widest text-amber-400 uppercase font-semibold">
            Choir Logo
          </span>
        </div>
      )}

      {showSubtitle && (
        <div className="flex flex-col text-left">
          <span className="font-bold tracking-tight text-slate-900 text-sm leading-tight">
            {choirInfo.choir_name}
          </span>
          <span className="text-[11px] text-slate-500 font-medium leading-tight">
            ADEPR Nyanza, Rwanda
          </span>
        </div>
      )}
    </div>
  );
};
