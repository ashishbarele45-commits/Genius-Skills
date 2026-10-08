import React from 'react';
import { GlassPanel } from '../components/ui/glass/GlassPanel';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'refund';
}

export const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const titles = {
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    refund: 'Refund & Cancellation Policy',
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          {titles[type]}
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Last revised: October 2026 · GENIUS SKILLS Platform
        </p>
      </div>

      <GlassPanel className="p-8 sm:p-10 rounded-[32px] shadow-2xl">
        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed flex flex-col gap-6">
          {type === 'privacy' && (
            <>
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Information Collection</h3>
                <p>
                  GENIUS SKILLS collects account credentials (such as your name and email address)
                  and course interaction records (such as completed lessons and progress metrics) to
                  deliver an authenticated, personalized learning experience.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Payment Processing</h3>
                <p>
                  Payments on GENIUS SKILLS are handled via PCI-DSS compliant payment gateways like Razorpay.
                  Sensitive credit card and bank information are never stored on our database servers.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Data Protection & Security</h3>
                <p>
                  We implement encrypted communications (HTTPS/TLS), cryptographic credential hashing (bcrypt),
                  and server-authorized endpoint guards to prevent unauthorized access to your account data.
                </p>
              </div>
            </>
          )}

          {type === 'terms' && (
            <>
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By registering an account or enrolling in courses on GENIUS SKILLS, you agree to comply
                  with these terms and our applicable platform policies.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Course License & Intellectual Property</h3>
                <p>
                  Enrolling in a course grants you an individual, non-transferable, revocable license to
                  access course materials. Redistribution, public re-broadcasting, or resale of course videos
                  and curriculum without written consent is strictly prohibited.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Certificates of Completion</h3>
                <p>
                  Certificates are issued digitally upon verified 100% curriculum completion and may be verified
                  through the GENIUS SKILLS public verification registry.
                </p>
              </div>
            </>
          )}

          {type === 'refund' && (
            <>
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Refund Eligibility</h3>
                <p>
                  Students may request a full refund within 7 days of course purchase, provided that less than
                  20% of the course curriculum has been accessed or completed, and no certificate has been claimed.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Processing Timeline</h3>
                <p>
                  Approved refunds are processed through the original payment method (Razorpay) and typically
                  reflect within 5 to 7 business days, depending on your bank or payment issuer.
                </p>
              </div>
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  );
};
