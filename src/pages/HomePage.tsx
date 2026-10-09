import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Course, Category, SiteSettings } from '../types';
import { apiRequest } from '../lib/api';
import { CourseCard } from '../components/course/CourseCard';
import { BrandLogo } from '../components/common/BrandLogo';
import { useBrand } from '../context/BrandContext';
import { HomeMediaSlider } from '../components/home/HomeMediaSlider';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Video,
  Layers,
  Phone,
  ShoppingCart,
  BookOpen,
  CheckCircle2,
  Award,
  Play,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
  initialSection?: string;
}

const FloatingChip: React.FC<{
  icon: React.ElementType;
  label: string;
  className?: string;
  delay?: number;
}> = ({ icon: Icon, label, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{
      opacity: 1,
      y: 0,
      transition: { delay, duration: 0.7 },
    }}
    whileInView={{
      y: [0, -6, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay * 0.4,
      },
    }}
    viewport={{ once: true }}
    className={`absolute ios-glass-pill px-3.5 sm:px-4 py-2 flex items-center gap-2 sm:gap-2.5 z-20 pointer-events-none shadow-[0_12px_32px_rgba(0,0,0,0.6)] ${className}`}
  >
    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center shadow-inner shrink-0">
      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
    </div>
    <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-wide uppercase whitespace-nowrap">{label}</span>
  </motion.div>
);

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, catRes, setRes] = await Promise.all([
          apiRequest<{ courses: Course[] }>('/api/courses?featured=true'),
          apiRequest<{ categories: Category[] }>('/api/categories'),
          apiRequest<{ settings: SiteSettings }>('/api/settings'),
        ]);
        setFeaturedCourses(coursesRes.courses);
        setCategories(catRes.categories);
        setSettings(setRes.settings || {});
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const { brandName, tagline } = useBrand();

  const heroHeading = settings.hero_heading || 'Learn Skills. Build Your Future.';
  const heroDescription =
    settings.hero_description ||
    'Learn website development, AI usage, AI-powered workflows, ad-free video generation and more practical digital skills.';

  const featureCards = [
    {
      icon: Code2,
      title: 'Website Development',
      description: 'Learn to build modern websites step by step.',
    },
    {
      icon: Cpu,
      title: 'AI Usage',
      description: 'Understand and use AI tools properly in real projects.',
    },
    {
      icon: Video,
      title: 'Ad-Free Video Generation',
      description: 'Create high-quality videos without unwanted ads.',
    },
    {
      icon: Layers,
      title: 'Practical Skills',
      description: 'Real-world skills for your digital journey.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Cinematic Hero Section */}
      <section className="relative pt-28 sm:pt-36 md:pt-40 lg:pt-44 pb-20 sm:pb-28 lg:pb-32 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col z-10 text-left"
          >
            <div className="mb-6 sm:mb-8">
              <BrandLogo size="md" className="!h-10 sm:!h-12" />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-5 sm:mb-6 tracking-tight">
              {heroHeading}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl mb-8 sm:mb-10 leading-relaxed font-medium">
              {heroDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="btn-primary h-12 sm:h-13 px-7 sm:px-9 text-xs sm:text-sm flex items-center gap-2.5"
              >
                <span>Explore Courses</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/about');
                }}
                className="btn-secondary h-12 sm:h-13 px-7 sm:px-9 text-xs sm:text-sm font-semibold flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[3.5px] border-t-transparent border-l-[6px] border-l-white border-b-[3.5px] border-b-transparent ml-0.5" />
                </div>
                <span>How It Works</span>
              </button>
            </div>
          </motion.div>

          {/* Right Visual Composition */}
          <div className="relative w-full min-h-[340px] sm:min-h-[420px] lg:min-h-[520px] flex items-center justify-center py-4">
            {/* Ambient Lighting Sheen */}
            <div className="absolute w-[90%] sm:w-[110%] h-[90%] sm:h-[110%] bg-gradient-to-br from-white/[0.04] to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* Admin-Controlled Media Slider / Brand Composition */}
            <HomeMediaSlider />

            {/* Floating Glass Chips - Integrated smoothly with safe positioning */}
            <div className="hidden sm:block">
              <FloatingChip
                icon={Code2}
                label="Website Development"
                className="top-2 sm:top-4 left-0 sm:-left-3"
                delay={0.2}
              />
              <FloatingChip
                icon={Cpu}
                label="AI Usage"
                className="top-10 sm:top-14 right-0 sm:-right-3"
                delay={0.4}
              />
              <FloatingChip
                icon={Video}
                label="Ad-Free Video Generation"
                className="bottom-10 sm:bottom-12 left-0 sm:-left-4"
                delay={0.6}
              />
              <FloatingChip
                icon={Layers}
                label="Practical Skills"
                className="bottom-2 sm:bottom-3 right-0 sm:-right-3"
                delay={0.8}
              />
            </div>
          </div>
        </div>

        {/* Feature Cards Row */}
        <div className="mt-20 sm:mt-28 lg:mt-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featureCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="ios-glass-card p-6 sm:p-7 flex flex-col gap-4 group cursor-default"
            >
              <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/12 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner shrink-0">
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Featured Courses</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Explore practical, high-value digital skill programs.</p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="btn-secondary h-9 px-5 text-xs self-start sm:self-auto"
          >
            View All Courses
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] rounded-[28px] bg-white/[0.02] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={() => navigate(`/course/${course.slug || course.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="ios-glass-card p-12 sm:p-16 text-center flex flex-col items-center max-w-xl mx-auto">
            <Layers className="w-10 h-10 text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Published Courses Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              New practical learning courses will be published directly by the instructor soon.
            </p>
          </div>
        )}
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">
            Step-by-Step Learning
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Genius Skills Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed font-medium">
            From seamless enrollment to authenticated certificate verification, your complete digital learning path is structured for real-world mastery.
          </p>
        </div>

        {/* 4 Interactive Process Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="ios-glass-card p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">01</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Course Selection & Purchase</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Browse practical curricula and complete fast, secure checkout powered by verified Razorpay integration.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/8 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Enrollment</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="ios-glass-card p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">02</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Instant Lesson Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Access structured video lessons, modular step-by-step guides, code samples and actionable exercises in your dashboard.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/8 text-[11px] text-white/80 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Self-Paced Learning</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="ios-glass-card p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">03</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Project Completion</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Build real web applications, master AI-powered workflows, and generate ad-free video assets hands-on.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/8 text-[11px] text-white/80 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Practical Skills</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="ios-glass-card p-6 sm:p-7 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">04</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">Certificate Claiming</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Upon completing lessons, instantly claim your verifiable digital certificate with unique QR verification code.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/8 text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verifiable Credential</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Section */}
      <section className="pb-24 sm:pb-32 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full">
        <div className="ios-glass-card p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 sm:gap-10">
          <div className="max-w-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">Direct Support</span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">
              Have questions before starting?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Get in touch with support directly. We help you choose the right path for your digital future.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <a
              href="tel:7796021948"
              className="btn-primary h-11 px-6 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call 7796021948</span>
            </a>
            <button
              onClick={() => navigate('/contact')}
              className="btn-secondary h-11 px-6 text-xs sm:text-sm"
            >
              Send Message
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
