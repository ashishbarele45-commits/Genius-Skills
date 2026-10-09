import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { GlassButton } from '../ui/glass/GlassButton';
import { AuthModal } from '../auth/AuthModal';
import { BrandLogo } from '../common/BrandLogo';
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Search,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onSearchOpen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, onSearchOpen }) => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/courses');
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', route: '/' },
    { label: 'Courses', route: '/courses' },
    { label: 'About', route: '/about' },
    { label: 'Support', route: '/support' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 pt-4 sm:pt-6 pointer-events-none">
        <div
          className={`max-w-6xl mx-auto ios-glass-pill px-3.5 sm:px-6 md:px-7 py-2.5 sm:py-3 flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 ${
            isScrolled ? 'py-2 sm:py-2.5 scale-[0.99] shadow-[0_24px_64px_rgba(0,0,0,0.85)]' : ''
          }`}
        >
          {/* Brand Logo inside Premium Container */}
          <BrandLogo
            size="md"
            className="shrink-0"
            onClick={() => {
              navigate('/');
              setIsMobileMenuOpen(false);
            }}
          />

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-full bg-white/[0.03] border border-white/5 shrink-0">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => navigate(link.route)}
                  className={`relative px-3.5 lg:px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/[0.1] border border-white/20 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.06)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-2.5 lg:gap-3.5 shrink-0">
            {/* Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-32 lg:w-44 bg-white/[0.04] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/10 focus:border-white/25 rounded-full py-1.5 pl-8 pr-3 text-[11px] text-white placeholder:text-slate-500 focus:outline-none transition-all"
              />
            </form>

            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Panel</span>
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-medium text-white transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[80px] lg:max-w-[120px] truncate">{user.name}</span>
                  </button>
                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 w-64 rounded-[28px] bg-[#0d0f14]/98 backdrop-blur-3xl border border-white/15 p-2.5 shadow-[0_32px_80px_rgba(0,0,0,0.85)] z-50 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-white/8 mb-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-white truncate">{user.name}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                user.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-white/10 text-slate-300 border border-white/15'
                              }`}>
                                {user.role === 'ADMIN' ? 'Admin' : 'Student'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{user.email}</p>
                          </div>

                          {user.role === 'ADMIN' && (
                            <button
                              onClick={() => { navigate('/admin'); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-all text-left font-bold"
                            >
                              <Shield className="w-4 h-4 text-amber-400" />
                              Admin Panel
                            </button>
                          )}

                          <button
                            onClick={() => { navigate('/dashboard'); setIsUserDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </button>
                          <button
                            onClick={() => { navigate('/my-courses'); setIsUserDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                          >
                            <BookOpen className="w-4 h-4" />
                            My Courses
                          </button>
                          <div className="h-px bg-white/8 my-1.5 mx-2" />
                          <button
                            onClick={async () => { await logout(); setIsUserDropdownOpen(false); navigate('/'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left font-bold"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="btn-secondary h-9 px-4 lg:px-5 text-xs"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="btn-primary h-9 px-4 lg:px-5 text-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Search button & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => navigate('/courses')}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/12 flex items-center justify-center text-slate-300 active:scale-95"
              aria-label="Search courses"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/12 flex items-center justify-center text-white active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className="md:hidden mt-3 max-w-sm mx-auto rounded-[32px] bg-[#0c0e14]/98 backdrop-blur-3xl border border-white/15 p-4 shadow-[0_32px_80px_rgba(0,0,0,0.9)] pointer-events-auto"
            >
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="w-full bg-white/[0.06] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-white/30"
                  />
                </div>
              </form>

              <div className="flex flex-col gap-1 pb-3 border-b border-white/8">
                {navLinks.map((link) => (
                  <button
                    key={link.route}
                    onClick={() => { navigate(link.route); setIsMobileMenuOpen(false); }}
                    className={`text-left px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                      currentRoute === link.route ? 'bg-white text-black' : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="pt-3 flex flex-col gap-2">
                {user ? (
                  <>
                    {user.role === 'ADMIN' && (
                      <button
                        onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                      >
                        <Shield className="w-4 h-4 text-amber-400" />
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}
                      className="btn-primary w-full h-10 text-xs"
                    >
                      Dashboard
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAuth('login')}
                      className="btn-secondary flex-1 h-10 text-xs"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => openAuth('register')}
                      className="btn-primary flex-1 h-10 text-xs"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
};
