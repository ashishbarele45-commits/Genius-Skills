import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ExternalLink, Video, CheckCircle2, Award, BookOpen, ShoppingCart, Sparkles } from 'lucide-react';
import { MediaSlide } from '../../types';
import { GlassCard } from '../ui/glass/GlassCard';
import { GlassButton } from '../ui/glass/GlassButton';

export interface HowItWorksSlot {
  id: string;
  slotNumber: string;
  defaultTitle: string;
  defaultDescription: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const HOW_IT_WORKS_SLOTS: HowItWorksSlot[] = [
  {
    id: 'welcome',
    slotNumber: '01',
    defaultTitle: 'Welcome to GENIUS SKILLS',
    defaultDescription: 'Discover our mission, industry-standard curriculum, and how to fast-track your high-income skills.',
    icon: Sparkles,
  },
  {
    id: 'browse-purchase',
    slotNumber: '02',
    defaultTitle: 'How to Browse and Purchase a Course',
    defaultDescription: 'Explore verified skill paths, select your curriculum, and complete instant enrollment via Razorpay.',
    icon: ShoppingCart,
  },
  {
    id: 'access-lessons',
    slotNumber: '03',
    defaultTitle: 'How to Access Lessons',
    defaultDescription: 'Navigate modules, access downloadable learning materials, and track your active lecture progress.',
    icon: BookOpen,
  },
  {
    id: 'complete-course',
    slotNumber: '04',
    defaultTitle: 'How to Complete a Course',
    defaultDescription: 'Complete interactive lessons, quizzes, and projects to meet 100% completion criteria.',
    icon: CheckCircle2,
  },
  {
    id: 'claim-certificate',
    slotNumber: '05',
    defaultTitle: 'How to Claim an Eligible Certificate',
    defaultDescription: 'Receive and verify your cryptographically signed, verifiable certificate with an authenticated QR code.',
    icon: Award,
  },
];

export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const HowItWorksVideoSection: React.FC<{ className?: string; placement?: 'home' | 'about' }> = ({
  className = '',
  placement = 'home',
}) => {
  const [configuredSlides, setConfiguredSlides] = useState<MediaSlide[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    description?: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSlides = async () => {
      try {
        const res = await fetch('/api/media-slides');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.slides)) {
            // Filter video slides configured
            const vSlides = data.slides.filter((s: MediaSlide) => s.active && s.mediaType === 'VIDEO');
            setConfiguredSlides(vSlides);
          }
        }
      } catch (err) {
        console.warn('Could not load informational videos:', err);
      }
    };
    fetchSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Match configured video slide by slot index or keyword
  const getVideoForSlot = (index: number, slot: HowItWorksSlot): MediaSlide | undefined => {
    // 1. Direct title or caption match
    const foundByName = configuredSlides.find((s) => {
      const t = (s.title || '').toLowerCase();
      const c = (s.caption || '').toLowerCase();
      return (
        t.includes(slot.id) ||
        t.includes(slot.defaultTitle.toLowerCase()) ||
        c.includes(slot.id)
      );
    });
    if (foundByName) return foundByName;

    // 2. Fallback to order/index if configured
    return configuredSlides[index];
  };

  return (
    <section id="how-it-works" className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full ${className}`}>
      <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 block">
          Platform Video Guides
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          How Genius Skills Works
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed font-medium">
          Step-by-step video walk-throughs covering enrollment, curriculum access, course completion, and verifiable certification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {HOW_IT_WORKS_SLOTS.map((slot, index) => {
          const videoSlide = getVideoForSlot(index, slot);
          const Icon = slot.icon;
          const ytId = videoSlide?.mediaUrl ? parseYouTubeVideoId(videoSlide.mediaUrl) : null;
          const thumbnail =
            videoSlide?.thumbnailUrl ||
            (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="ios-glass-card rounded-[28px] overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-white/20 transition-all duration-300"
            >
              {/* Video Thumbnail Area */}
              <div className="relative aspect-video w-full bg-[#0a0c10] overflow-hidden flex items-center justify-center">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={videoSlide?.title || slot.defaultTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-white/[0.04] to-transparent">
                    <Icon className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-[11px] text-slate-500 font-medium">Informational Video Slot</span>
                  </div>
                )}

                {/* Glass Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Slot Tag */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white/90">
                  Step {slot.slotNumber}
                </div>

                {/* Play Button Overlay if configured */}
                {videoSlide?.mediaUrl ? (
                  <button
                    onClick={() =>
                      setSelectedVideo({
                        title: videoSlide.title || slot.defaultTitle,
                        description: videoSlide.caption || slot.defaultDescription,
                        url: videoSlide.mediaUrl,
                      })
                    }
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] active:scale-90 transition-all cursor-pointer z-10 group-hover:scale-110"
                    aria-label={`Play video: ${videoSlide.title || slot.defaultTitle}`}
                  >
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </button>
                ) : (
                  <div className="absolute bottom-3 right-3 text-[10px] font-medium text-slate-400 bg-black/50 px-2 py-0.5 rounded-full border border-white/5">
                    Admin Video Slot
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-2 tracking-tight group-hover:text-slate-100">
                    {videoSlide?.title || slot.defaultTitle}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {videoSlide?.caption || slot.defaultDescription}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    <span>{videoSlide ? 'Available' : 'Configured Slot'}</span>
                  </div>

                  {videoSlide?.mediaUrl && (
                    <button
                      onClick={() =>
                        setSelectedVideo({
                          title: videoSlide.title || slot.defaultTitle,
                          description: videoSlide.caption || slot.defaultDescription,
                          url: videoSlide.mediaUrl,
                        })
                      }
                      className="text-xs text-white font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Watch Guide
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Video Playback Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl rounded-[32px] bg-[#0c0e14] border border-white/15 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                {(() => {
                  const ytId = parseYouTubeVideoId(selectedVideo.url);
                  if (ytId) {
                    return (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                        title={selectedVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <video
                      src={selectedVideo.url}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                })()}
              </div>

              {selectedVideo.description && (
                <div className="p-4 sm:p-6 bg-white/[0.02] border-t border-white/10">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {selectedVideo.description}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
export default HowItWorksVideoSection;
