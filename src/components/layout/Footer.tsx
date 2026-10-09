import React, { useState, useRef } from 'react';
import { ShieldCheck, Phone } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useBrand } from '../../context/BrandContext';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { brandName, tagline } = useBrand();
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden 6-click admin entry
  const handleAdminSecretClick = () => {
    setClickCount((prev) => {
      const nextCount = prev + 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (nextCount >= 6) {
        navigate('/admin/login');
        return 0;
      }

      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 3000);

      return nextCount;
    });
  };

  return (
    <footer className="mt-32 border-t border-white/5 bg-[#08090a] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {/* Brand info */}
          <div className="md:col-span-2 flex flex-col gap-6 items-start">
            <BrandLogo size="lg" onClick={() => navigate('/')} />
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
              Learn website development, AI usage, AI-powered workflows, ad-free video generation and more practical digital skills.
            </p>
            <div className="flex items-center gap-3 text-xs pt-2">
              <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Support Line</span>
                <a href="tel:7796021948" className="text-white hover:text-premium-silver font-bold tracking-tight">7796021948</a>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Learning</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              {['Explore Courses', 'About', 'My Courses', 'Student Dashboard'].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(item === 'Explore Courses' ? '/courses' : item === 'About' ? '/about' : item === 'My Courses' ? '/my-courses' : '/dashboard')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Legal & Support */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Platform</h4>
            <div className="flex flex-col gap-3 text-sm font-medium">
              {['Contact Support', 'Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(item === 'Contact Support' ? '/contact' : item === 'Privacy Policy' ? '/privacy' : item === 'Terms of Service' ? '/terms' : '/refund-policy')}
                  className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-slate-500 font-medium">
          <p
            onClick={handleAdminSecretClick}
            className="cursor-default select-none transition-colors hover:text-slate-400"
            title="GENIUS SKILLS"
          >
            © {new Date().getFullYear()} {brandName} {tagline}. All rights reserved.
          </p>
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-400 tracking-wide uppercase font-bold">Secure Checkout with Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
