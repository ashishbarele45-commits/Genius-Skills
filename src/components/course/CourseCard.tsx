import React from 'react';
import { Course } from '../../types';
import { useBrand } from '../../context/BrandContext';
import { BookOpen, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const { brandName, tagline } = useBrand();
  return (
    <div
      onClick={() => onSelect(course)}
      className="ios-glass-card flex flex-col h-full cursor-pointer group p-3.5 sm:p-5"
    >
      {/* Course Thumbnail */}
      <div className="relative aspect-[16/10] w-full rounded-[24px] overflow-hidden bg-[#0e1116] border border-white/8 shrink-0">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-white/[0.04] to-transparent">
            <BookOpen className="w-8 h-8 text-slate-600 mb-2 group-hover:text-slate-400 transition-colors" />
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">{brandName} {tagline}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content Details */}
      <div className="pt-5 flex-1 flex flex-col justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {course.level || 'All Levels'}
            </span>
            {course.categoryName && (
              <span className="text-[10px] text-slate-500 font-semibold">• {course.categoryName}</span>
            )}
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-premium-silver transition-colors line-clamp-2 leading-snug tracking-tight">
            {course.title}
          </h3>

          {course.shortDescription && (
            <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed font-medium">
              {course.shortDescription}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
          <div>
            {course.finalPrice === 0 ? (
              <span className="text-sm font-extrabold text-emerald-400 uppercase tracking-widest">
                Free
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">
                  ₹{course.finalPrice.toLocaleString('en-IN')}
                </span>
                {course.discount > 0 && (
                  <span className="text-[10px] text-slate-500 line-through">
                    ₹{course.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(course);
            }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
