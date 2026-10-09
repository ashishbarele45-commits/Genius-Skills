import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BrandProvider } from './context/BrandContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { InkSpreadBackground } from './components/ui/InkSpreadBackground';

import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { CoursePlayerPage } from './pages/CoursePlayerPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { DashboardPage } from './pages/DashboardPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { GlassButton } from './components/ui/glass/GlassButton';
import { ShieldAlert } from 'lucide-react';
import appletConfig from '../firebase-applet-config.json';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const mouseGlowRef = useRef<HTMLDivElement>(null);

  // Mouse Glow tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseGlowRef.current) {
        const { clientX, clientY } = e;
        mouseGlowRef.current.style.transform = `translate(${clientX - 300}px, ${clientY - 300}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (mode: 'login' | 'register' | 'forgot-password' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Route matching logic
  const renderRoute = () => {
    // 1. Home & About
    if (currentPath === '/' || currentPath === '/about') {
      return <HomePage navigate={navigate} initialSection={currentPath === '/about' ? 'about' : 'hero'} />;
    }

    // 2. All Courses
    if (currentPath === '/courses') {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category') || undefined;
      return <CoursesPage navigate={navigate} initialCategory={category} />;
    }

    // Auth Routes
    if (currentPath === '/login') {
      return <AuthPage initialMode="login" navigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <AuthPage initialMode="register" navigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <AuthPage initialMode="forgot-password" navigate={navigate} />;
    }

    // 3. Dedicated Admin Login: /admin/login
    if (currentPath === '/admin/login') {
      return <AdminLoginPage navigate={navigate} />;
    }

    // 4. Admin Panel: /admin or /admin/* (Strict 403 for non-admins)
    if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
      const isAuthorizedAdmin = Boolean(
        user &&
        (user.role === 'ADMIN' ||
         user.id === 'Bj7qBJUBTvY97fQFAn1wpZEATUq2' ||
         (user.email || '').toLowerCase() === 'ashishbarele45@gmail.com')
      );
      if (!isLoading && !isAuthorizedAdmin) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 sm:p-10 rounded-[32px] bg-white/[0.025] border border-rose-500/25 shadow-2xl backdrop-blur-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7 text-rose-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                403 Forbidden
              </h1>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Access Denied: Administrator privileges required (admin: true custom claim required). Normal student accounts cannot view admin data.
              </p>
              <div className="flex flex-col gap-2.5">
                <GlassButton variant="primary" size="md" onClick={() => navigate('/admin/login')}>
                  Admin Sign In
                </GlassButton>
                <GlassButton variant="ghost" size="sm" onClick={() => navigate('/')}>
                  Back to Home
                </GlassButton>
              </div>
            </div>
          </div>
        );
      }
      return <AdminDashboardPage navigate={navigate} />;
    }

    // 5. Course Player: /learn/:courseId or /courses/:slug/learn
    const learnMatch1 = currentPath.match(/^\/learn\/([^/]+)$/);
    const learnMatch2 = currentPath.match(/^\/courses\/([^/]+)\/learn$/);
    const learnSlug = (learnMatch1 && learnMatch1[1]) || (learnMatch2 && learnMatch2[1]);
    if (learnSlug) {
      return (
        <CoursePlayerPage
          slug={learnSlug}
          navigate={navigate}
          onOpenAuth={() => openAuth('login')}
        />
      );
    }

    // 6. Course Details: /course/:slug or /courses/:slug
    const courseMatch1 = currentPath.match(/^\/course\/([^/]+)$/);
    const courseMatch2 = currentPath.match(/^\/courses\/([^/]+)$/);
    const courseSlug = (courseMatch1 && courseMatch1[1]) || (courseMatch2 && courseMatch2[1]);
    if (courseSlug) {
      return (
        <CourseDetailsPage
          slug={courseSlug}
          navigate={navigate}
          onOpenAuth={() => openAuth('login')}
        />
      );
    }

    // 7. Checkout: /checkout/:courseId
    const checkoutMatch = currentPath.match(/^\/checkout\/([^/]+)$/);
    if (checkoutMatch) {
      return (
        <CheckoutPage
          courseId={checkoutMatch[1]}
          navigate={navigate}
          onOpenAuth={() => openAuth('login')}
        />
      );
    }

    // 8. Categories page
    if (currentPath === '/categories') {
      return <CoursesPage navigate={navigate} />;
    }

    // 9. My Courses: /my-courses
    if (currentPath === '/my-courses') {
      if (!user && !isLoading) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Student Sign In Required</h2>
              <p className="text-xs text-slate-400 mb-6">
                Please sign in to access your enrolled courses and continue learning.
              </p>
              <GlassButton variant="primary" size="md" onClick={() => openAuth('login')}>
                Sign In
              </GlassButton>
            </div>
          </div>
        );
      }
      return <DashboardPage navigate={navigate} initialTab="courses" />;
    }

    // 10. Student Orders: /orders
    if (currentPath === '/orders') {
      if (!user && !isLoading) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
              <p className="text-xs text-slate-400 mb-6">Please sign in to view your orders.</p>
              <GlassButton variant="primary" size="md" onClick={() => openAuth('login')}>
                Sign In
              </GlassButton>
            </div>
          </div>
        );
      }
      return <DashboardPage navigate={navigate} initialTab="orders" />;
    }

    // 11. Wishlist: /wishlist
    if (currentPath === '/wishlist') {
      if (!user && !isLoading) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
              <p className="text-xs text-slate-400 mb-6">Please sign in to view your wishlist.</p>
              <GlassButton variant="primary" size="md" onClick={() => openAuth('login')}>
                Sign In
              </GlassButton>
            </div>
          </div>
        );
      }
      return <DashboardPage navigate={navigate} initialTab="wishlist" />;
    }

    // 12. Profile / Settings: /profile or /settings
    if (currentPath === '/profile' || currentPath === '/settings') {
      if (!user && !isLoading) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
              <p className="text-xs text-slate-400 mb-6">Please sign in to manage your profile.</p>
              <GlassButton variant="primary" size="md" onClick={() => openAuth('login')}>
                Sign In
              </GlassButton>
            </div>
          </div>
        );
      }
      return <DashboardPage navigate={navigate} initialTab="profile" />;
    }

    // 13. Student Dashboard: /dashboard
    if (currentPath === '/dashboard') {
      if (!user && !isLoading) {
        return (
          <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
            <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Student Sign In Required</h2>
              <p className="text-xs text-slate-400 mb-6">
                Please sign in to access your student dashboard, courses, and progress.
              </p>
              <GlassButton variant="primary" size="md" onClick={() => openAuth('login')}>
                Sign In
              </GlassButton>
            </div>
          </div>
        );
      }
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'overview';
      return <DashboardPage navigate={navigate} initialTab={tab} />;
    }

    // 14. Support / Contact: /support or /contact
    if (currentPath === '/support' || currentPath === '/contact') {
      return <ContactPage />;
    }

    // 15. Verify Certificate
    const verifyMatch = currentPath.match(/^\/verify-certificate(?:\/([^/]+))?$/);
    if (verifyMatch) {
      return <VerifyCertificatePage initialCode={verifyMatch[1]} navigate={navigate} />;
    }

    // Temporary Debug Route
    if (currentPath === '/_debug_config') {
      const firebaseConfig = (import.meta as any).env || {};
      return (
        <div className="pt-36 pb-20 px-4 text-center max-w-2xl mx-auto min-h-screen relative z-10">
          <div className="p-10 rounded-[32px] bg-white/[0.025] border border-white/10 shadow-2xl backdrop-blur-2xl text-left font-mono text-xs overflow-auto max-h-[60vh]">
            <h2 className="text-lg font-bold text-white mb-4">Runtime Config Debug</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-blue-400 font-bold mb-1 underline">import.meta.env:</h3>
                <pre>{JSON.stringify(firebaseConfig, null, 2)}</pre>
              </div>
              <div>
                <h3 className="text-green-400 font-bold mb-1 underline">Bundled Firebase Config (Hardcoded in firebase.ts):</h3>
                <pre>
                  {`apiKey: "AIzaSyC2SDgR1jsvq4TnaVvLu-8mFvKgLsZJv1s"\nappId: "1:465240710133:web:92b9f4b555ff3d915e5ebc"`}
                </pre>
              </div>
              <div>
                <h3 className="text-yellow-400 font-bold mb-1 underline">firebase-applet-config.json:</h3>
                <pre>{JSON.stringify(appletConfig, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 16. Legal pages
    if (currentPath === '/privacy') {
      return <LegalPage type="privacy" />;
    }
    if (currentPath === '/terms') {
      return <LegalPage type="terms" />;
    }
    if (currentPath === '/refund-policy') {
      return <LegalPage type="refund" />;
    }

    // 404 Not Found fallback
    return (
      <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto min-h-screen relative z-10">
        <div className="p-10 rounded-[32px] bg-white/[0.025] border border-white/10 shadow-2xl backdrop-blur-2xl">
          <span className="text-4xl font-extrabold text-white block mb-2">404</span>
          <h2 className="text-lg font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">The requested path does not exist.</p>
          <GlassButton variant="primary" size="sm" onClick={() => navigate('/')}>
            Back to Home
          </GlassButton>
        </div>
      </div>
    );
  };

  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col font-['Inter'] selection:bg-white/20 selection:text-white relative overflow-hidden">
      {/* Signature Liquid Ink-Spread & Mouse-Responsive Lighting Effect */}
      <InkSpreadBackground />
      
      {/* Dynamic Cursor Light Interaction */}
      <div ref={mouseGlowRef} className="mouse-glow hidden lg:block" />

      {!isAdminRoute && (
        <Navbar
          currentRoute={currentPath}
          navigate={navigate}
          onSearchOpen={() => navigate('/courses')}
        />
      )}

      <main className="flex-1 relative z-10">{renderRoute()}</main>

      {!isAdminRoute && <Footer navigate={navigate} />}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrandProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrandProvider>
    </AuthProvider>
  );
}
