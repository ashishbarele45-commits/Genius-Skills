import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassInput } from '../components/ui/glass/GlassInput';
import { BrandLogo } from '../components/common/BrandLogo';
import { useBrand } from '../context/BrandContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Printer,
  Share2,
  Check,
} from 'lucide-react';

interface VerifyCertificatePageProps {
  initialCode?: string;
  navigate: (route: string) => void;
}

export const VerifyCertificatePage: React.FC<VerifyCertificatePageProps> = ({
  initialCode,
  navigate,
}) => {
  const { brandName, tagline } = useBrand();
  const [code, setCode] = useState(initialCode || '');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [certificate, setCertificate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsLoading(true);
    setError(null);
    setCertificate(null);

    try {
      const res = await apiRequest(`/api/certificates/verify/${codeToVerify.trim()}`);
      if (res.valid) {
        setCertificate(res.certificate);
      }
    } catch (err: any) {
      setError(err.message || 'No matching certificate found in registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      verify(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify(code);
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="w-14 h-14 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Award className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Certificate Registry Verification
        </h1>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Verify authentic certificates issued by GENIUS SKILLS using the unique certificate ID or verification token.
        </p>
      </div>

      {/* Verification Search Pill Box */}
      <GlassCard interactive={false} className="p-6 rounded-[32px] max-w-xl mx-auto mb-10 shadow-xl">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <GlassInput
              pill
              placeholder="Enter Certificate Code (e.g. GS-XXXX-XXXX)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <GlassButton type="submit" variant="primary" size="md" isLoading={isLoading}>
            Verify
          </GlassButton>
        </form>
      </GlassCard>

      {/* Verified Certificate Card Result */}
      {certificate && (
        <div className="relative rounded-[36px] bg-[#0b0d11]/90 backdrop-blur-3xl border border-white/20 p-8 sm:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-white/5 bg-white/[0.01] pointer-events-none flex items-center justify-center">
            <Award className="w-32 h-32 text-white/[0.03]" />
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-400">
                Official Credential Registry
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Authentic</span>
            </div>
          </div>

          <div className="text-center py-4">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Certificate of Completion
            </span>
            <p className="text-xs text-slate-400 mt-4">This certifies that</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {certificate.studentName}
            </h2>
            <p className="text-xs text-slate-400 mt-3">
              has successfully fulfilled all curriculum requirements for
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-200 mt-1">
              {certificate.courseTitle}
            </h3>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 block mb-0.5">Certificate Code</span>
              <span className="font-mono font-bold text-white">
                {certificate.certificateCode}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Issue Date</span>
              <span className="text-white">
                {new Date(certificate.issueDate).toLocaleDateString()}
              </span>
            </div>

            {certificate.instructorName && (
              <div>
                <span className="text-slate-500 block mb-0.5">Instructor</span>
                <span className="text-white">{certificate.instructorName}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <span className="text-[11px] text-slate-500 font-mono">
              Status: Authenticated Record
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-white/90 transition-all cursor-pointer shadow-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-md mx-auto p-6 rounded-[28px] bg-rose-500/10 border border-rose-500/20 text-center animate-in fade-in duration-150 shadow-lg">
          <XCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">Verification Failed</h3>
          <p className="text-xs text-rose-300 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
};
