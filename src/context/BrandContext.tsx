import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBrandSettings } from '../services/firebaseService';
import { BrandSettings } from '../types';

interface BrandContextType {
  logoUrl: string;
  logoPublicId: string;
  brandName: string;
  tagline: string;
  isLoading: boolean;
  refreshBrand: () => Promise<void>;
}

const DEFAULT_LOGO = 'https://res.cloudinary.com/ntspltr3/image/upload/v1791397447/b5063c05-ec02-4baa-83aa-a6a64db1a363-removebg-preview.png';
const DEFAULT_BRAND = 'GENIUS SKILLS';
const DEFAULT_TAGLINE = 'Learn Skills. Build Your Future.';

const BrandContext = createContext<BrandContextType>({
  logoUrl: DEFAULT_LOGO,
  logoPublicId: '',
  brandName: DEFAULT_BRAND,
  tagline: DEFAULT_TAGLINE,
  isLoading: true,
  refreshBrand: async () => {},
});

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('genius_brand_logo') : null;
      if (cached && cached.trim().startsWith('http')) return cached.trim();
    } catch (_) {}
    return DEFAULT_LOGO;
  });
  const [logoPublicId, setLogoPublicId] = useState<string>('');
  const [brandName, setBrandName] = useState<string>(DEFAULT_BRAND);
  const [tagline, setTagline] = useState<string>(DEFAULT_TAGLINE);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBrand = async () => {
    try {
      const settings = await getBrandSettings();
      if (settings) {
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
          localStorage.setItem('genius_brand_logo', settings.logoUrl);
        }
        setLogoPublicId(settings.logoPublicId || '');
        setBrandName(settings.brandName || DEFAULT_BRAND);
        setTagline(settings.tagline || DEFAULT_TAGLINE);
      }
    } catch (error: any) {
      console.warn('Brand settings offline or inaccessible, using cached/default branding:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBrand();
  }, []);

  // Sync favicon with brand logo
  useEffect(() => {
    if (logoUrl && typeof window !== 'undefined') {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = logoUrl;
      if (!document.querySelector("link[rel*='icon']")) {
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    }
  }, [logoUrl]);

  return (
    <BrandContext.Provider
      value={{
        logoUrl,
        logoPublicId,
        brandName,
        tagline,
        isLoading,
        refreshBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
