import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingSettings, ChoirInfo } from '../types';

interface BrandingContextType {
  branding: BrandingSettings;
  choirInfo: ChoirInfo;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
  updateBranding: (data: Partial<BrandingSettings> & Partial<ChoirInfo>) => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  id: 'default_branding',
  main_logo_url: '',
  app_icon_url: '',
  splash_logo_url: '',
  light_logo_url: '',
  dark_logo_url: '',
  banner_image_url: '',
  primary_color: '#1e3a8a',
  secondary_color: '#d97706',
  accent_color: '#2563eb',
  background_color: '#f8fafc',
  text_color: '#0f172a',
};

const defaultChoirInfo: ChoirInfo = {
  choir_name: 'La Lumiere Choir',
  affiliation: 'ADEPR Nyanza, Kicukiro District, Kigali, Rwanda',
  about_story: 'La Lumiere Choir is a renowned gospel choir based at ADEPR Nyanza in Kicukiro District, Kigali, Rwanda. Dedicated to spreading the Gospel of Jesus Christ through anointed worship, inspiring harmonies, and soul-stirring hymns.',
  mission: 'To illuminate souls with the true Light of Christ through spiritual songs, evangelism, and selfless fellowship.',
  vision: 'A generation transformed and anchored in genuine praise, worship, and devotion to God across Rwanda and the nations.',
  contact_phone: '+250 788 000 000',
  contact_email: 'info@lalumierechoir.rw',
  socials: {
    youtube: 'https://youtube.com/@LaLumiereChoir',
    instagram: 'https://instagram.com/lalumierechoir',
    facebook: 'https://facebook.com/lalumierechoir',
  },
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [choirInfo, setChoirInfo] = useState<ChoirInfo>(defaultChoirInfo);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const res = await fetch('/api/branding');
      if (res.ok) {
        const data = await res.json();
        if (data.branding && Object.keys(data.branding).length > 0) {
          setBranding({ ...defaultBranding, ...data.branding });
        }
        if (data.settings) {
          setChoirInfo(prev => ({
            ...prev,
            choir_name: data.settings.choir_name || prev.choir_name,
            affiliation: data.settings.church_affiliation || prev.affiliation,
            about_story: data.settings.about_story || prev.about_story,
            mission: data.settings.mission_statement || prev.mission,
            vision: data.settings.vision_statement || prev.vision,
            contact_phone: data.settings.contact_phone || prev.contact_phone,
            contact_email: data.settings.contact_email || prev.contact_email,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const updateBranding = async (data: any) => {
    const token = localStorage.getItem('lalumiere_token');
    const res = await fetch('/api/admin/branding', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update branding');
    }

    await fetchBranding();
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        choirInfo,
        isLoading,
        refreshBranding: fetchBranding,
        updateBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
