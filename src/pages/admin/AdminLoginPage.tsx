import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, formatFirebaseAuthError } from '../../lib/firebase';
import { getUserProfile } from '../../services/firebaseService';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { GlassInput } from '../../components/ui/glass/GlassInput';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useBrand } from '../../context/BrandContext';
import { Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AdminLoginPageProps {
  navigate: (route: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const { brandName, tagline } = useBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Firebase login
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCred.user;

      const AUTHORIZED_ADMIN_UID = 'Bj7qBJUBTvY97fQFAn1wpZEATUq2';
      const AUTHORIZED_ADMIN_EMAIL = 'ashishbarele45@gmail.com';

      // 2. Verify account matches authorized administrator
      const isAuthorized =
        fbUser.uid === AUTHORIZED_ADMIN_UID ||
        (fbUser.email || '').toLowerCase() === AUTHORIZED_ADMIN_EMAIL;

      if (!isAuthorized) {
        await signOut(auth);
        localStorage.removeItem('genius_token');
        setError('403 Forbidden: Account is not authorized for administrator access.');
        return;
      }

      // 3. Ensure custom claim is synced by trusted backend
      try {
        const idToken = await fbUser.getIdToken();
        await fetch('/api/auth/sync-admin-claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        });
      } catch (syncErr) {
        console.warn('[AdminLogin] sync-admin-claim network notice:', syncErr);
      }

      // 4. Force refresh ID token
      try {
        await fbUser.getIdTokenResult(true);
      } catch {
        // Continue
      }

      // 5. Store fresh ID token & navigate to /admin
      const refreshedToken = await fbUser.getIdToken();
      localStorage.setItem('genius_token', refreshedToken);

      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(formatFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-20 px-4 min-h-screen flex items-center justify-center relative z-10">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Site
        </button>

        <GlassCard interactive={false} className="p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/15">
          {/* Official Brand Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <BrandLogo size="lg" className="mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Admin Login
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Secure administrative access for {brandName} {tagline} platform operations.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <GlassInput
              pill
              label="Admin Email"
              type="email"
              placeholder="admin@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <div className="relative">
              <GlassInput
                pill
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-8.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <GlassButton
                variant="primary"
                size="lg"
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                <Lock className="w-4 h-4 mr-2" />
                Sign In to Admin Panel
              </GlassButton>
            </div>
          </form>

          <div className="mt-8 pt-4 border-t border-white/8 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>End-to-End Cryptographically Verified Administrative Session</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
