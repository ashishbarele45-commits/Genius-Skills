import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassCard } from '../components/ui/glass/GlassCard';
import {
  PlayCircle,
  Clock,
  BookOpen,
  Award,
  Lock,
  Heart,
  Star,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CourseDetailsPageProps {
  slug: string;
  navigate: (route: string) => void;
  onOpenAuth: () => void;
}

export const CourseDetailsPage: React.FC<CourseDetailsPageProps> = ({
  slug,
  navigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ course: Course }>(`/api/courses/${slug}`);
        setCourse(res.course);

        // Expand first module by default
        if (res.course.modules && res.course.modules.length > 0) {
          setExpandedModules({ [res.course.modules[0].id]: true });
        }
      } catch (err: any) {
        setError(err.message || 'Course not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleWishlist = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!course) return;

    try {
      const res = await apiRequest<{ inWishlist: boolean; message: string }>('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ courseId: course.id }),
      });
      setIsWishlisted(res.inWishlist);
      showToast(res.message, 'success');
    } catch {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  const handleAction = () => {
    if (!course) return;
    if (course.isEnrolled) {
      navigate(`/courses/${course.slug}/learn`);
    } else {
      if (!user) {
        onOpenAuth();
      } else {
        navigate(`/checkout/${course.id}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-2/3 bg-white/[0.04] rounded-full" />
        <div className="h-6 w-1/3 bg-white/[0.04] rounded-full" />
        <div className="h-96 w-full bg-white/[0.03] rounded-[32px]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="pt-36 pb-20 px-4 max-w-md mx-auto text-center">
        <div className="p-10 rounded-[32px] bg-white/[0.02] border border-white/10 shadow-2xl">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Course Not Found</h2>
          <p className="text-xs text-slate-400 mt-2">{error || 'This course is currently unavailable.'}</p>
          <div className="mt-6">
            <GlassButton variant="primary" size="sm" onClick={() => navigate('/courses')}>
              Back to Courses
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Course Header & Curriculum */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div>
            {/* Metadata in Pill Format */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-slate-300">
                {course.categoryName || 'General'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-slate-300">
                {course.level}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-slate-300">
                {course.language}
              </span>
              {course.duration && (
                <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {course.duration}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>

            {course.shortDescription && (
              <p className="text-base text-slate-400 mt-3 leading-relaxed">
                {course.shortDescription}
              </p>
            )}

            {/* Instructor and Rating */}
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {course.instructor && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-white">
                    <User className="w-3 h-3" />
                  </div>
                  <span>Instructor: <strong className="text-white">{course.instructor}</strong></span>
                </div>
              )}

              {course.reviewCount && course.reviewCount > 0 ? (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{course.averageRating}</span>
                  <span className="text-slate-400">({course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'})</span>
                </div>
              ) : null}

              {course.certificateEnabled && (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
                  <Award className="w-3.5 h-3.5" />
                  <span>Certificate Included</span>
                </div>
              )}
            </div>
          </div>

          {/* Full Description */}
          {course.fullDescription && (
            <div className="p-7 rounded-[28px] bg-white/[0.025] border border-white/10 shadow-lg">
              <h3 className="text-base font-bold text-white mb-3">
                About this Course
              </h3>
              <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {course.fullDescription}
              </div>
            </div>
          )}

          {/* Curriculum Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Course Curriculum
              </h3>
              <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10">
                {course.modules?.length || 0} modules · {totalLessons} lessons
              </span>
            </div>

            {course.modules && course.modules.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {course.modules.map((module, mIdx) => {
                  const isExpanded = !!expandedModules[module.id];
                  return (
                    <div
                      key={module.id}
                      className="rounded-[24px] border border-white/10 bg-white/[0.02] overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.025] transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="text-[11px] text-slate-500 font-mono">Module {mIdx + 1}</span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{module.title}</h4>
                          {module.description && (
                            <p className="text-xs text-slate-400 mt-1">{module.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-slate-500">
                            {module.lessons?.length || 0} lessons
                          </span>
                          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {isExpanded && module.lessons && module.lessons.length > 0 && (
                        <div className="border-t border-white/5 divide-y divide-white/5 bg-black/20 px-2 pb-2 pt-1">
                          {module.lessons.map((lesson, lIdx) => (
                            <div
                              key={lesson.id}
                              className="px-4 py-3 rounded-2xl flex items-center justify-between gap-4 text-xs hover:bg-white/[0.02]"
                            >
                              <div className="flex items-center gap-3 truncate">
                                {lesson.freePreview || course.isEnrolled ? (
                                  <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                                    <PlayCircle className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                )}
                                <span className="text-slate-300 truncate font-medium">
                                  {lIdx + 1}. {lesson.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                {lesson.freePreview && !course.isEnrolled && (
                                  <span className="text-[10px] text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase font-bold">
                                    Free Preview
                                  </span>
                                )}
                                {lesson.duration && (
                                  <span className="text-slate-500 font-mono">{lesson.duration}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-[24px] border border-white/10 bg-white/[0.02] text-center text-xs text-slate-400">
                Curriculum is being prepared for this course.
              </div>
            )}
          </div>

          {/* Real Reviews Section */}
          {course.reviews && course.reviews.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Student Reviews ({course.reviews.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-[24px] bg-white/[0.025] border border-white/10 flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white">{rev.userName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-4 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Card: Bubble Purchase Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GlassCard interactive={false} className="p-6 rounded-[32px] flex flex-col gap-6 shadow-2xl">
              {/* Rounded Image Container */}
              <div className="aspect-video w-full rounded-[22px] overflow-hidden bg-[#111317] border border-white/10 relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <BookOpen className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400">GENIUS SKILLS</span>
                  </div>
                )}
              </div>

              {/* Pricing Display */}
              <div>
                {course.finalPrice === 0 ? (
                  <div className="text-2xl font-bold text-emerald-400 uppercase">
                    Free Course
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-white">
                      ₹{course.finalPrice.toLocaleString('en-IN')}
                    </span>
                    {course.discount > 0 && (
                      <span className="text-sm text-slate-500 line-through">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                )}
                {course.discount > 0 && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    Save ₹{course.discount.toLocaleString('en-IN')} today
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <GlassButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleAction}
                >
                  {course.isEnrolled ? (
                    <>
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Continue Learning
                    </>
                  ) : course.finalPrice === 0 ? (
                    'Enroll for Free'
                  ) : (
                    'Buy Now'
                  )}
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleWishlist}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                  />
                  <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
                </GlassButton>
              </div>

              {/* Course Features */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5 text-xs text-slate-300">
                <span className="font-semibold text-white mb-1">This course includes:</span>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-slate-400" />
                  <span>{totalLessons} lessons with on-demand video</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{course.duration} full course content</span>
                  </div>
                )}
                {course.certificateEnabled && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>Certificate of Completion</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Full lifetime access to course material</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};
