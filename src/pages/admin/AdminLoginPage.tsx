import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatFirebaseAuthError } from '../../lib/firebase';
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
  const { login, loginWithGoogle, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AUTHORIZED_ADMIN_EMAILS = [
    'admin.geniusskills@gmail.com',
    'ashishbarele45@gmail.com',
  ];

  const formatAdminAuthError = (err: any): string => {
    const code = err?.code || '';

    if (code === 'auth/user-not-found') {
      return `Administrator account not found in Firebase Authentication (project genius-course). Please verify the administrator email.`;
    }
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Invalid email or password. Please verify your administrator credentials.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in provider is disabled in Firebase Console for project genius-course. Please enable Email/Password in Firebase Authentication > Sign-in method.';
    }
    if (code === 'auth/invalid-api-key') {
      return 'Firebase API key is invalid or restricted for project genius-course.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network connection error. Please verify your internet connection.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in window was closed before completing.';
    }
    return formatFirebaseAuthError(err);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate through centralized AuthContext
      const mappedUser = await login(email.trim(), password);
      const userEmail = (mappedUser.email || '').toLowerCase();
      const isAllowedEmail = AUTHORIZED_ADMIN_EMAILS.includes(userEmail);

      // 2. Strict administrator verification
      if (!isAllowedEmail && mappedUser.role !== 'ADMIN') {
        await logout();
        setError(`Access Denied: Account (${userEmail}) is not authorized for administrator access. Normal students must sign in through the student login page.`);
        return;
      }

      // 3. Immediately transition to Admin Panel
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(formatAdminAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const mappedUser = await loginWithGoogle();
      const userEmail = (mappedUser.email || '').toLowerCase();
      const isAllowedEmail = AUTHORIZED_ADMIN_EMAILS.includes(userEmail);

      if (!isAllowedEmail && mappedUser.role !== 'ADMIN') {
        await logout();
        setError(`Access Denied: Account (${userEmail}) is not authorized for administrator access. Normal students must sign in through the student login page.`);
        return;
      }

      navigate('/admin');
    } catch (err: any) {
      console.error('Admin Google login error:', err);
      setError(formatAdminAuthError(err));
    } finally {
      setIsGoogleLoading(false);
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#0e1015] px-3 text-slate-400">or continue with</span>
            </div>
          </div>

          <GlassButton
            variant="secondary"
            size="lg"
            type="button"
            className="w-full"
            onClick={handleGoogleAdminLogin}
            isLoading={isGoogleLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
              />
            </svg>
            Google Admin Sign In
          </GlassButton>

          <div className="mt-8 pt-4 border-t border-white/8 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>End-to-End Cryptographically Verified Administrative Session</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
