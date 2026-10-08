import React, { useEffect, useState } from 'react';
import { Course, Category } from '../types';
import { apiRequest } from '../lib/api';
import { CourseCard } from '../components/course/CourseCard';
import { GlassInput } from '../components/ui/glass/GlassInput';
import { GlassSelect } from '../components/ui/glass/GlassSelect';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { Search, RotateCcw, BookOpen } from 'lucide-react';

interface CoursesPageProps {
  navigate: (route: string) => void;
  initialCategory?: string;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ navigate, initialCategory }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || '');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('newest');

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (level && level !== 'all') params.append('level', level);
      if (sort) params.append('sort', sort);

      const res = await apiRequest<{ courses: Course[] }>(`/api/courses?${params.toString()}`);
      setCourses(res.courses);
    } catch (err) {
      console.error('Fetch courses error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await apiRequest<{ categories: Category[] }>('/api/categories');
        setCategories(res.categories);
      } catch (err) {
        console.error('Fetch categories error:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [category, level, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setLevel('all');
    setSort('newest');
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Course Catalog
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Explore structured courses designed for mastery and practical application.
        </p>
      </div>

      {/* iOS Bubble Search and Filter Capsule */}
      <div className="p-3 sm:p-4 rounded-[32px] bg-white/[0.03] backdrop-blur-2xl border border-white/12 mb-9 flex flex-col md:flex-row gap-3 items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
        {/* Pill Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <GlassInput
              pill
              placeholder="Search courses by title, topic, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11"
            />
          </div>
          <GlassButton type="submit" variant="primary" size="sm">
            Search
          </GlassButton>
        </form>

        {/* Bubble Select Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <div className="w-full sm:w-44">
            <GlassSelect
              pill
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </GlassSelect>
          </div>

          {/* Level Filter */}
          <div className="w-full sm:w-36">
            <GlassSelect
              pill
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </GlassSelect>
          </div>

          {/* Sort Filter */}
          <div className="w-full sm:w-40">
            <GlassSelect
              pill
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </GlassSelect>
          </div>

          {(search || category || level !== 'all' || sort !== 'newest') && (
            <button
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/12 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-[28px] bg-white/[0.03] animate-pulse border border-white/8"
            />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={() => navigate(`/courses/${course.slug}`)}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 rounded-[32px] bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto my-12 shadow-2xl">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">
            No courses available yet.
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            No published courses match your current search or filter criteria.
          </p>
          {(search || category || level !== 'all') && (
            <div className="mt-6">
              <GlassButton variant="secondary" size="sm" onClick={handleReset}>
                Clear All Filters
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
