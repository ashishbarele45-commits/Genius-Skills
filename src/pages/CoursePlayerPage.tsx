import React, { useEffect, useState } from 'react';
import { Module, Lesson } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassButton } from '../components/ui/glass/GlassButton';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Award,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';

interface CoursePlayerPageProps {
  slug: string;
  navigate: (route: string) => void;
  onOpenAuth: () => void;
}

export const CoursePlayerPage: React.FC<CoursePlayerPageProps> = ({
  slug,
  navigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<{ id: string; title: string; slug: string; certificateEnabled: boolean } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState({ totalLessons: 0, completedCount: 0, progressPercent: 0, completedLessonIds: [] as string[] });
  const [isLoading, setIsLoading] = useState(true);
  const [isClaimingCert, setIsClaimingCert] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true);
      try {
        const res = await apiRequest<{
          course: { id: string; title: string; slug: string; certificateEnabled: boolean };
          isEnrolled: boolean;
          progress: { totalLessons: number; completedCount: number; progressPercent: number; completedLessonIds: string[] };
          modules: Module[];
        }>(`/api/courses/${slug}/player`);

        setCourse(res.course);
        setIsEnrolled(res.isEnrolled);
        setProgress(res.progress);
        setModules(res.modules);

        // Expand all modules by default
        const exp: Record<string, boolean> = {};
        res.modules.forEach((m) => {
          exp[m.id] = true;
        });
        setExpandedModules(exp);

        // Select initial lesson: first incomplete lesson or first available lesson
        const allLessons: Lesson[] = [];
        res.modules.forEach((m) => m.lessons.forEach((l) => allLessons.push(l)));

        if (allLessons.length > 0) {
          const firstIncomplete = allLessons.find((l) => !res.progress.completedLessonIds.includes(l.id) && !l.isLocked);
          setCurrentLesson(firstIncomplete || allLessons[0]);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load course player.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [slug]);

  // Flatten lessons list for Next / Prev navigation
  const allLessons: Lesson[] = [];
  modules.forEach((m) => m.lessons.forEach((l) => allLessons.push(l)));
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleComplete = async () => {
    if (!currentLesson || !user) {
      if (!user) onOpenAuth();
      return;
    }

    const isCurrentlyCompleted = progress.completedLessonIds.includes(currentLesson.id);
    const newStatus = !isCurrentlyCompleted;

    try {
      const res = await apiRequest('/api/progress/mark', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: currentLesson.id,
          completed: newStatus,
        }),
      });

      if (res.success) {
        setProgress((prev) => {
          const newCompleted = newStatus
            ? [...prev.completedLessonIds, currentLesson.id]
            : prev.completedLessonIds.filter((id) => id !== currentLesson.id);
          return {
            ...prev,
            completedLessonIds: newCompleted,
            completedCount: newCompleted.length,
            progressPercent: prev.totalLessons > 0 ? Math.round((newCompleted.length / prev.totalLessons) * 100) : 0,
          };
        });

        showToast(newStatus ? 'Lesson marked as completed!' : 'Lesson unmarked.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update progress.', 'error');
    }
  };

  const handleClaimCertificate = async () => {
    if (!course || !user) return;
    setIsClaimingCert(true);
    try {
      const res = await apiRequest<{ success: boolean; certificate: any; message: string }>('/api/certificates/claim', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id }),
      });
      showToast(res.message, 'success');
      navigate('/dashboard?tab=certificates');
    } catch (err: any) {
      showToast(err.message || 'Failed to claim certificate.', 'error');
    } finally {
      setIsClaimingCert(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-28 pb-20 px-4 max-w-7xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-1/3 bg-white/[0.04] rounded-full" />
        <div className="h-[500px] w-full bg-white/[0.03] rounded-[32px]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-36 pb-20 px-4 text-center">
        <p className="text-slate-400">Course player unavailable.</p>
      </div>
    );
  }

  const isCurrentLessonCompleted = currentLesson ? progress.completedLessonIds.includes(currentLesson.id) : false;

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Top Header Pill Container */}
      <div className="mb-6 p-4 rounded-[28px] bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/courses/${course.slug}`)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Course Details
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {course.title}
          </h1>
        </div>

        {/* Real Progress Capsule */}
        <div className="flex items-center gap-4 bg-white/[0.04] px-4 py-2 rounded-full border border-white/8">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-white">
              {progress.progressPercent}% Completed
            </span>
            <span className="text-[11px] text-slate-400">
              {progress.completedCount} of {progress.totalLessons} lessons
            </span>
          </div>

          <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 rounded-full"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          {progress.progressPercent === 100 && course.certificateEnabled && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleClaimCertificate}
              isLoading={isClaimingCert}
            >
              <Award className="w-4 h-4 mr-1.5" />
              Claim Certificate
            </GlassButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CENTER / VIDEO PLAYER (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Video Bubble Container */}
          <div className="rounded-[32px] bg-[#090b0e] border border-white/12 overflow-hidden shadow-2xl relative">
            {currentLesson?.isLocked ? (
              <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-black/60">
                <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  This Lesson is Locked
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
                  Enroll in this course to unlock all lessons, assignments, and certificates.
                </p>
                <GlassButton
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/checkout/${course.id}`)}
                >
                  Enroll Now
                </GlassButton>
              </div>
            ) : currentLesson?.videoSource ? (
              <div className="aspect-video w-full bg-black">
                {currentLesson.videoSource.includes('youtube.com') ||
                currentLesson.videoSource.includes('youtu.be') ? (
                  <iframe
                    src={
                      currentLesson.videoSource.includes('embed')
                        ? currentLesson.videoSource
                        : `https://www.youtube.com/embed/${
                            currentLesson.videoSource.split('v=')[1]?.split('&')[0] ||
                            currentLesson.videoSource.split('/').pop()
                          }`
                    }
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : currentLesson.videoSource.includes('vimeo.com') ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${currentLesson.videoSource.split('/').pop()}`}
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={currentLesson.videoSource}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-white/[0.02]">
                <BookOpen className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-white">Lesson Content</p>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Video lecture for this lesson will be uploaded by the instructor.
                </p>
              </div>
            )}
          </div>

          {/* Lesson Details & Bubble Controls */}
          {currentLesson && (
            <div className="p-7 rounded-[28px] bg-white/[0.025] border border-white/10 flex flex-col gap-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider font-mono">
                    CURRENT LESSON
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {currentLesson.title}
                  </h2>
                </div>

                {isEnrolled && (
                  <GlassButton
                    variant={isCurrentLessonCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleToggleComplete}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 mr-1.5 ${
                        isCurrentLessonCompleted ? 'text-emerald-400' : ''
                      }`}
                    />
                    <span>{isCurrentLessonCompleted ? 'Completed' : 'Mark as Complete'}</span>
                  </GlassButton>
                )}
              </div>

              {currentLesson.description && (
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/8">
                  {currentLesson.description}
                </p>
              )}

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/8">
                <GlassButton
                  variant="outline"
                  size="sm"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous Lesson
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="sm"
                  disabled={!nextLesson}
                  onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                >
                  Next Lesson
                  <ChevronRight className="w-4 h-4 ml-1" />
                </GlassButton>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Course Curriculum Bubble Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="p-4 px-6 rounded-full bg-white/[0.04] border border-white/10 font-bold text-xs text-white uppercase tracking-wider">
            Curriculum Navigation
          </div>

          <div className="flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-1">
            {modules.map((mod, mIdx) => {
              const isExpanded = !!expandedModules[mod.id];
              return (
                <div
                  key={mod.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">Module {mIdx + 1}</span>
                      <h4 className="text-xs font-bold text-white">{mod.title}</h4>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 divide-y divide-white/5 bg-black/20 p-1.5">
                      {mod.lessons.map((lesson) => {
                        const isCurrent = currentLesson?.id === lesson.id;
                        const isCompleted = progress.completedLessonIds.includes(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setCurrentLesson(lesson)}
                            className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer text-xs ${
                              isCurrent
                                ? 'bg-white/12 text-white font-semibold'
                                : 'text-slate-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : lesson.isLocked ? (
                                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            {lesson.freePreview && !isEnrolled && (
                              <span className="text-[9px] text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase font-bold">
                                Preview
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
