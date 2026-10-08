import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaSlide } from '../../types';
import { ChevronLeft, ChevronRight, Play, VolumeX } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface HomeMediaSliderProps {
  slides?: MediaSlide[];
  className?: string;
}

// Utility to inject Cloudinary optimization transformations
function getOptimizedCloudinaryUrl(url: string, type: 'IMAGE' | 'VIDEO'): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('/f_auto,q_auto/')) return url;
  if (type === 'IMAGE') {
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,c_limit/');
  }
  return url.replace('/upload/', '/upload/f_auto,q_auto:eco/');
}

export const HomeMediaSlider: React.FC<HomeMediaSliderProps> = ({
  slides: initialSlides,
  className = '',
}) => {
  const [slides, setSlides] = useState<MediaSlide[]>(initialSlides || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward (right to left), -1 = backward
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch active slides if not provided via props
  useEffect(() => {
    if (initialSlides && initialSlides.length > 0) {
      setSlides(initialSlides.filter((s) => s.active));
      return;
    }

    let isMounted = true;
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/media-slides');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.slides)) {
            setSlides(data.slides.filter((s: MediaSlide) => s.active));
          }
        }
      } catch (err) {
        console.warn('Could not fetch active media slides:', err);
      }
    };
    fetchSlides();
    return () => {
      isMounted = false;
    };
  }, [initialSlides]);

  const total = slides.length;

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay handler (Right -> Left progression)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    // Respect user's reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        goToNext();
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [total, isPaused, goToNext]);

  // Pause on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      setTouchDeltaX(e.touches[0].clientX - touchStartX);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchDeltaX < -45) {
      // Swiped left -> advance right to left
      goToNext();
    } else if (touchDeltaX > 45) {
      // Swiped right -> go prev
      goToPrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // When zero active slides exist: show clean neutral brand presentation plaque (no fake media!)
  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md sm:max-w-lg aspect-[16/11] rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-[#141720]/90 via-[#0d0f14]/95 to-[#06070a] border border-white/15 shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden flex flex-col items-center justify-center p-6 sm:p-10 group ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.06] via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col items-center justify-center text-center z-10">
          <BrandLogo size="xl" className="group-hover:scale-105 transition-transform duration-500" />
        </div>
      </motion.div>
    );
  }

  const currentSlide = slides[currentIndex];

  // Motion variants for smooth Right -> Left entry/exit
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      filter: 'blur(4px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 32 },
        opacity: { duration: 0.4 },
        filter: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      filter: 'blur(4px)',
      transition: {
        x: { type: 'spring', stiffness: 280, damping: 32 },
        opacity: { duration: 0.35 },
        filter: { duration: 0.3 },
      },
    }),
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full max-w-md sm:max-w-lg aspect-[16/11] rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-[#141720]/90 via-[#0d0f14]/95 to-[#06070a] border border-white/15 shadow-[0_32px_90px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden select-none ${className}`}
    >
      {/* Subtle glass reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.08] via-transparent to-transparent pointer-events-none z-20" />

      {/* Main Slide Carousel Track */}
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/40"
          >
            {currentSlide.mediaType === 'VIDEO' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  key={currentSlide.mediaUrl}
                  src={getOptimizedCloudinaryUrl(currentSlide.mediaUrl, 'VIDEO')}
                  poster={currentSlide.thumbnailUrl ? getOptimizedCloudinaryUrl(currentSlide.thumbnailUrl, 'IMAGE') : undefined}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[9px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 pointer-events-none">
                  <VolumeX className="w-2.5 h-2.5" />
                  <span>Video</span>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center bg-[#090b0e]">
                <img
                  src={getOptimizedCloudinaryUrl(currentSlide.mediaUrl, 'IMAGE')}
                  alt={currentSlide.title || 'Slide presentation'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Optional Slide Caption / Badge */}
            {currentSlide.title && (
              <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
                <div className="inline-block max-w-full px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-semibold text-white truncate shadow-lg">
                  {currentSlide.title}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows: Left and Right (Only when > 1 slide) */}
      {total > 1 && (
        <>
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous slide"
            className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/35 hover:bg-black/60 active:scale-90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all cursor-pointer z-30 pointer-events-auto hover:border-white/40"
          >
            <ChevronLeft className="w-5 h-5 text-white stroke-[2.2]" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next slide"
            className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/35 hover:bg-black/60 active:scale-90 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all cursor-pointer z-30 pointer-events-auto hover:border-white/40"
          >
            <ChevronRight className="w-5 h-5 text-white stroke-[2.2]" />
          </button>

          {/* Bottom Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-auto">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-5 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default HomeMediaSlider;
