import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/api';
import { Course, Category, Coupon, Order, Certificate, AdminAnalytics, SiteSettings, MediaSlide } from '../../types';
import { GlassCard } from '../../components/ui/glass/GlassCard';
import { GlassButton } from '../../components/ui/glass/GlassButton';
import { GlassTabs } from '../../components/ui/glass/GlassBadge';
import { GlassTable } from '../../components/ui/glass/GlassTable';
import { GlassModal } from '../../components/ui/glass/GlassModal';
import { GlassInput, GlassTextarea, GlassSelect } from '../../components/ui/glass/GlassInput';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { uploadMediaWithProgress, updateBrandSettings } from '../../services/firebaseService';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useBrand } from '../../context/BrandContext';
import {
  BookOpen,
  FolderKanban,
  CreditCard,
  Users,
  Tag,
  Star,
  Award,
  Mail,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Shield,
  Clock,
  Upload,
  LayoutDashboard,
  Receipt,
  Settings as SettingsIcon,
  Sparkles,
  LogOut,
  Menu,
  X,
  Sliders,
  ArrowUp,
  ArrowDown,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
} from 'lucide-react';

interface AdminDashboardPageProps {
  navigate: (route: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const getTabFromPath = (path: string): string => {
    const cleanPath = path.replace(/\/$/, '');
    if (cleanPath === '/admin/courses') return 'courses';
    if (cleanPath === '/admin/categories') return 'categories';
    if (cleanPath === '/admin/modules' || cleanPath === '/admin/lessons' || cleanPath === '/admin/curriculum') return 'curriculum';
    if (cleanPath === '/admin/media-slider' || cleanPath === '/admin/slider') return 'slider';
    if (cleanPath === '/admin/students') return 'students';
    if (cleanPath === '/admin/orders') return 'orders';
    if (cleanPath === '/admin/payments') return 'payments';
    if (cleanPath === '/admin/coupons') return 'coupons';
    if (cleanPath === '/admin/reviews') return 'reviews';
    if (cleanPath === '/admin/certificates') return 'certificates';
    if (cleanPath === '/admin/settings') return 'settings';
    if (cleanPath === '/admin/branding') return 'branding';
    if (cleanPath === '/admin/inquiries') return 'inquiries';
    return 'analytics';
  };

  const getPathFromTab = (tab: string): string => {
    if (tab === 'analytics') return '/admin';
    if (tab === 'curriculum') return '/admin/modules';
    if (tab === 'slider') return '/admin/media-slider';
    return `/admin/${tab}`;
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(window.location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
    const targetPath = getPathFromTab(tabId);
    if (window.location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Data states
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [contactSubmissions, setContactSubmissions] = useState<any[]>([]);
  const [mediaSlides, setMediaSlides] = useState<MediaSlide[]>([]);

  // Media Slider modals & form state
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<MediaSlide | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewSlide, setPreviewSlide] = useState<MediaSlide | null>(null);
  const [slideForm, setSlideForm] = useState({
    title: '',
    caption: '',
    mediaType: 'IMAGE' as 'IMAGE' | 'VIDEO',
    mediaUrl: '',
    thumbnailUrl: '',
    publicId: '',
    posterPublicId: '',
    order: 0,
    active: true,
  });
  const [isUploadingSlideMedia, setIsUploadingSlideMedia] = useState(false);
  const [slideMediaProgress, setSlideMediaProgress] = useState(0);
  const [isUploadingSlidePoster, setIsUploadingSlidePoster] = useState(false);
  const [slidePosterProgress, setSlidePosterProgress] = useState(0);

  // Modals & form state
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    fullDescription: '',
    categoryId: '',
    instructor: '',
    thumbnail: '',
    price: 0,
    discount: 0,
    level: 'All Levels',
    language: 'English',
    duration: '',
    status: 'DRAFT',
    featured: false,
    certificateEnabled: true,
  });

  // Curriculum Builder state
  const [selectedCurriculumCourse, setSelectedCurriculumCourse] = useState<Course | null>(null);
  const [curriculumModules, setCurriculumModules] = useState<any[]>([]);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    videoSource: '',
    duration: '',
    freePreview: false,
    published: true,
  });

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // Coupon modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 10,
    maxUses: 100,
    expiryDate: '',
    minimumAmount: 0,
  });

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  // Student ethical moderation state
  const [selectedStudentForModeration, setSelectedStudentForModeration] = useState<any | null>(null);
  const [moderationTargetStatus, setModerationTargetStatus] = useState<'SUSPENDED' | 'BANNED' | 'ACTIVE'>('SUSPENDED');
  const [moderationReason, setModerationReason] = useState('');
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);

  const handleOpenModeration = (student: any, targetStatus: 'SUSPENDED' | 'BANNED' | 'ACTIVE') => {
    setSelectedStudentForModeration(student);
    setModerationTargetStatus(targetStatus);
    setModerationReason('');
    setIsModerationModalOpen(true);
  };

  const handleConfirmModeration = async () => {
    if (!selectedStudentForModeration) return;
    if (moderationTargetStatus !== 'ACTIVE' && moderationReason.trim().length < 5) {
      showToast('A mandatory reason (at least 5 characters) is required for account suspension or ban.', 'error');
      return;
    }
    setIsSubmittingModeration(true);
    try {
      await apiRequest(`/api/admin/students/${selectedStudentForModeration.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: moderationTargetStatus,
          reason: moderationReason.trim(),
        }),
      });
      showToast(`Account successfully updated to ${moderationTargetStatus}.`, 'success');
      setIsModerationModalOpen(false);
      const res = await apiRequest<{ students: any[] }>('/api/admin/students');
      setStudents(res.students || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to update student account status.', 'error');
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  // Media upload and time filter states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days' | 'this_month'>('all');

  const handleUploadThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);
    try {
      const response = await uploadToCloudinary(file, 'courses/thumbnails', (pct) => {
        setThumbnailProgress(pct);
      });
      setCourseForm((prev) => ({ ...prev, thumbnail: response.secure_url }));
      showToast('Thumbnail uploaded to Cloudinary!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload thumbnail to Cloudinary.', 'error');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleUploadLessonVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setVideoProgress(0);
    try {
      const response = await uploadToCloudinary(file, 'courses/lessons', (pct) => {
        setVideoProgress(pct);
      });
      setLessonForm((prev) => ({ ...prev, videoSource: response.secure_url }));
      showToast('Lesson video uploaded to Cloudinary!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload video to Cloudinary.', 'error');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  const { refreshBrand, logoUrl } = useBrand();

  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setLogoProgress(0);
    try {
      // organizing official branding assets in a dedicated folder
      const response = await uploadToCloudinary(file, 'branding', (pct) => {
        setLogoProgress(pct);
      });
      
      // Update Firestore branding document directly
      await updateBrandSettings({
        logoUrl: response.secure_url,
        logoPublicId: response.public_id
      });
      
      // Refresh global brand context
      await refreshBrand();
      showToast('Official logo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo to Cloudinary.', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [
        analyticsRes,
        coursesRes,
        categoriesRes,
        studentsRes,
        ordersRes,
        couponsRes,
        reviewsRes,
        certsRes,
        settingsRes,
        contactRes,
        slidesRes,
      ] = await Promise.all([
        apiRequest<{ analytics: AdminAnalytics }>('/api/admin/analytics'),
        apiRequest<{ courses: Course[] }>('/api/admin/courses'),
        apiRequest<{ categories: Category[] }>('/api/admin/categories'),
        apiRequest<{ students: any[] }>('/api/admin/students'),
        apiRequest<{ orders: any[] }>('/api/admin/orders'),
        apiRequest<{ coupons: Coupon[] }>('/api/admin/coupons'),
        apiRequest<{ reviews: any[] }>('/api/admin/reviews'),
        apiRequest<{ certificates: Certificate[] }>('/api/admin/certificates'),
        apiRequest<{ settings: SiteSettings }>('/api/settings'),
        apiRequest<{ submissions: any[] }>('/api/admin/contact-submissions'),
        apiRequest<{ slides: MediaSlide[] }>('/api/admin/media-slides'),
      ]);

      setAnalytics(analyticsRes.analytics);
      setCourses(coursesRes.courses);
      setCategories(categoriesRes.categories);
      setStudents(studentsRes.students);
      setOrders(ordersRes.orders);
      setCoupons(couponsRes.coupons);
      setReviews(reviewsRes.reviews);
      setCertificates(certsRes.certificates);
      setSettings(settingsRes.settings || {});
      setContactSubmissions(contactRes.submissions);
      setMediaSlides(slidesRes.slides || []);

      if (coursesRes.courses.length > 0 && !selectedCurriculumCourse) {
        setSelectedCurriculumCourse(coursesRes.courses[0]);
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadCurriculum = async (courseId: string) => {
    try {
      const res = await apiRequest<{ modules: any[] }>(`/api/admin/courses/${courseId}/curriculum`);
      setCurriculumModules(res.modules);
    } catch {
      setCurriculumModules([]);
    }
  };

  useEffect(() => {
    if (selectedCurriculumCourse) {
      loadCurriculum(selectedCurriculumCourse.id);
    }
  }, [selectedCurriculumCourse]);

  // ==================== COURSE ACTIONS ====================

  const handleOpenCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription || '',
        fullDescription: course.fullDescription || '',
        categoryId: course.categoryId || '',
        instructor: course.instructor || '',
        thumbnail: course.thumbnail || '',
        price: course.price,
        discount: course.discount,
        level: course.level,
        language: course.language,
        duration: course.duration || '',
        status: course.status,
        featured: course.featured,
        certificateEnabled: course.certificateEnabled,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        slug: '',
        shortDescription: '',
        fullDescription: '',
        categoryId: categories[0]?.id || '',
        instructor: user?.name || '',
        thumbnail: '',
        price: 0,
        discount: 0,
        level: 'All Levels',
        language: 'English',
        duration: '',
        status: 'PUBLISHED',
        featured: false,
        certificateEnabled: true,
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await apiRequest(`/api/admin/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(courseForm),
        });
        showToast('Course updated successfully!', 'success');
      } else {
        await apiRequest('/api/admin/courses', {
          method: 'POST',
          body: JSON.stringify(courseForm),
        });
        showToast('Course created successfully!', 'success');
      }
      setIsCourseModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save course.', 'error');
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.title}"? All associated modules and lessons will also be deleted.`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/courses/${course.id}`, { method: 'DELETE' });
          showToast('Course deleted successfully.', 'info');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadAllAdminData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete course.', 'error');
        }
      },
    });
  };

  // ==================== CURRICULUM ACTIONS ====================

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCurriculumCourse) return;

    try {
      if (editingModule) {
        await apiRequest(`/api/admin/modules/${editingModule.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: moduleTitle,
            description: moduleDesc,
            orderIndex: editingModule.orderIndex,
          }),
        });
        showToast('Module updated.', 'success');
      } else {
        await apiRequest('/api/admin/modules', {
          method: 'POST',
          body: JSON.stringify({
            courseId: selectedCurriculumCourse.id,
            title: moduleTitle,
            description: moduleDesc,
            orderIndex: curriculumModules.length + 1,
          }),
        });
        showToast('Module added.', 'success');
      }
      setIsModuleModalOpen(false);
      loadCurriculum(selectedCurriculumCourse.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to save module.', 'error');
    }
  };

  const handleDeleteModule = (mod: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Module',
      message: `Delete module "${mod.title}" and all its lessons?`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/modules/${mod.id}`, { method: 'DELETE' });
          showToast('Module deleted.', 'info');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadCurriculum(selectedCurriculumCourse!.id);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete module.', 'error');
        }
      },
    });
  };

  const handleOpenLessonModal = (moduleId: string, lesson?: any) => {
    setTargetModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        videoSource: lesson.videoSource || '',
        duration: lesson.duration || '',
        freePreview: lesson.freePreview,
        published: lesson.published !== false,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        description: '',
        videoSource: '',
        duration: '',
        freePreview: false,
        published: true,
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await apiRequest(`/api/admin/lessons/${editingLesson.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...lessonForm,
            orderIndex: editingLesson.orderIndex,
          }),
        });
        showToast('Lesson updated.', 'success');
      } else {
        await apiRequest('/api/admin/lessons', {
          method: 'POST',
          body: JSON.stringify({
            moduleId: targetModuleId,
            ...lessonForm,
            orderIndex: 0,
          }),
        });
        showToast('Lesson created.', 'success');
      }
      setIsLessonModalOpen(false);
      loadCurriculum(selectedCurriculumCourse!.id);
    } catch (err: any) {
      showToast(err.message || 'Failed to save lesson.', 'error');
    }
  };

  const handleDeleteLesson = (lesson: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Lesson',
      message: `Are you sure you want to delete lesson "${lesson.title}"?`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' });
          showToast('Lesson deleted.', 'info');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadCurriculum(selectedCurriculumCourse!.id);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete lesson.', 'error');
        }
      },
    });
  };

  // ==================== CATEGORIES ACTIONS ====================

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: categoryName,
          slug: categorySlug,
          description: categoryDesc,
        }),
      });
      showToast('Category created!', 'success');
      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategorySlug('');
      setCategoryDesc('');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create category.', 'error');
    }
  };

  const handleDeleteCategory = (cat: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Category',
      message: `Delete category "${cat.name}"? Courses in this category will become uncategorized.`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
          showToast('Category deleted.', 'info');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadAllAdminData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete category.', 'error');
        }
      },
    });
  };

  // ==================== COUPONS ACTIONS ====================

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(couponForm),
      });
      showToast('Coupon created!', 'success');
      setIsCouponModalOpen(false);
      setCouponForm({
        code: '',
        type: 'PERCENTAGE',
        value: 10,
        maxUses: 100,
        expiryDate: '',
        minimumAmount: 0,
      });
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create coupon.', 'error');
    }
  };

  const handleDeleteCoupon = (coupon: any) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Coupon',
      message: `Delete coupon "${coupon.code}"?`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' });
          showToast('Coupon deleted.', 'info');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          loadAllAdminData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete coupon.', 'error');
        }
      },
    });
  };

  // ==================== REVIEWS MODERATION ====================

  const handleReviewStatus = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      showToast(`Review ${status.toLowerCase()}!`, 'success');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update review.', 'error');
    }
  };

  // ==================== MEDIA SLIDER ACTIONS ====================

  const handleOpenSlideModal = (slide?: MediaSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setSlideForm({
        title: slide.title || '',
        caption: slide.caption || '',
        mediaType: slide.mediaType,
        mediaUrl: slide.mediaUrl,
        thumbnailUrl: slide.thumbnailUrl || '',
        publicId: slide.publicId || '',
        posterPublicId: slide.posterPublicId || '',
        order: slide.order ?? 0,
        active: slide.active !== false,
      });
    } else {
      setEditingSlide(null);
      setSlideForm({
        title: '',
        caption: '',
        mediaType: 'IMAGE',
        mediaUrl: '',
        thumbnailUrl: '',
        publicId: '',
        posterPublicId: '',
        order: mediaSlides.length + 1,
        active: true,
      });
    }
    setSlideMediaProgress(0);
    setSlidePosterProgress(0);
    setIsSlideModalOpen(true);
  };

  const handleUploadSlideMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setIsUploadingSlideMedia(true);
    setSlideMediaProgress(0);

    try {
      const response = await uploadToCloudinary(file, 'genius-skills/home-slider', (pct) => {
        setSlideMediaProgress(pct);
      });

      setSlideForm((prev) => ({
        ...prev,
        mediaType: isVideo ? 'VIDEO' : 'IMAGE',
        mediaUrl: response.secure_url,
        publicId: response.public_id,
        thumbnailUrl: isVideo
          ? prev.thumbnailUrl || response.secure_url.replace(/\.[^/.]+$/, '.jpg')
          : response.secure_url,
      }));
      showToast(`${isVideo ? 'Video' : 'Image'} uploaded to Cloudinary!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload media to Cloudinary.', 'error');
    } finally {
      setIsUploadingSlideMedia(false);
    }
  };

  const handleUploadSlidePosterFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSlidePoster(true);
    setSlidePosterProgress(0);

    try {
      const response = await uploadToCloudinary(file, 'genius-skills/home-slider/posters', (pct) => {
        setSlidePosterProgress(pct);
      });

      setSlideForm((prev) => ({
        ...prev,
        thumbnailUrl: response.secure_url,
        posterPublicId: response.public_id,
      }));
      showToast('Poster uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload poster.', 'error');
    } finally {
      setIsUploadingSlidePoster(false);
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.mediaUrl) {
      showToast('Please upload an image or video before saving.', 'error');
      return;
    }

    try {
      if (editingSlide) {
        await apiRequest(`/api/admin/media-slides/${editingSlide.id}`, {
          method: 'PUT',
          body: JSON.stringify(slideForm),
        });
        showToast('Media slide updated successfully!', 'success');
      } else {
        await apiRequest('/api/admin/media-slides', {
          method: 'POST',
          body: JSON.stringify(slideForm),
        });
        showToast('Media slide created successfully!', 'success');
      }

      setIsSlideModalOpen(false);
      const res = await apiRequest<{ slides: MediaSlide[] }>('/api/admin/media-slides');
      setMediaSlides(res.slides || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to save slide.', 'error');
    }
  };

  const handleToggleSlideActive = async (slide: MediaSlide) => {
    const updatedActive = !slide.active;
    try {
      setMediaSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, active: updatedActive } : s))
      );
      await apiRequest(`/api/admin/media-slides/${slide.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: updatedActive }),
      });
      showToast(`Slide ${updatedActive ? 'enabled' : 'disabled'}.`, 'success');
    } catch (err: any) {
      setMediaSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? { ...s, active: slide.active } : s))
      );
      showToast(err.message || 'Failed to update slide status.', 'error');
    }
  };

  const handleDeleteSlide = (slide: MediaSlide) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Media Slide',
      message: `Are you sure you want to permanently delete this slide (${slide.title || slide.mediaType})? This will remove it from the homepage slider and clean up the Cloudinary asset.`,
      action: async () => {
        try {
          await apiRequest(`/api/admin/media-slides/${slide.id}`, {
            method: 'DELETE',
          });
          setMediaSlides((prev) => prev.filter((s) => s.id !== slide.id));
          showToast('Media slide deleted.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Failed to delete slide.', 'error');
        } finally {
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleMoveSlideOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaSlides.length) return;

    const newSlides = [...mediaSlides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    const updated = newSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    setMediaSlides(updated);

    try {
      await apiRequest('/api/admin/media-slides/reorder', {
        method: 'PUT',
        body: JSON.stringify({
          slides: updated.map((s) => ({ id: s.id, order: s.order })),
        }),
      });
      showToast('Slide order saved to database and Firestore!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to persist slide order.', 'error');
    }
  };

  const handleOpenPreview = (slide: MediaSlide) => {
    setPreviewSlide(slide);
    setIsPreviewModalOpen(true);
  };

  // ==================== SITE SETTINGS ====================

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        apiRequest('/api/admin/settings', {
          method: 'POST',
          body: JSON.stringify(settings),
        }),
        updateBrandSettings({
          brandName: settings.brand_name || 'GENIUS',
          tagline: settings.tagline || 'SKILLS'
        })
      ]);
      await refreshBrand();
      showToast('Site settings updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings.', 'error');
    }
  };

  const sidebarItems = [
    { id: 'analytics', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Courses', icon: BookOpen, count: courses.length },
    { id: 'categories', label: 'Categories', icon: FolderKanban, count: categories.length },
    { id: 'curriculum', label: 'Modules & Lessons', icon: Layers },
    { id: 'slider', label: 'Media Slider', icon: Sliders, count: mediaSlides.length },
    { id: 'students', label: 'Students', icon: Users, count: students.length },
    { id: 'orders', label: 'Orders', icon: CreditCard, count: orders.length },
    { id: 'payments', label: 'Payments', icon: Receipt, count: orders.filter((o) => o.status === 'PAID').length },
    { id: 'coupons', label: 'Coupons', icon: Tag, count: coupons.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'branding', label: 'Brand Settings', icon: Sparkles },
    { id: 'certificates', label: 'Certificates', icon: Award, count: certificates.length },
    { id: 'settings', label: 'Site Settings', icon: SettingsIcon },
    { id: 'inquiries', label: 'Inquiries', icon: Mail, count: contactSubmissions.length },
  ];

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col md:flex-row relative">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0a0c10]/95 backdrop-blur-2xl border-b border-white/8 sticky top-0 z-40">
        <BrandLogo size="sm" onClick={() => handleTabChange('analytics')} />
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 rounded-full bg-white/[0.06] border border-white/12 text-white active:scale-95 cursor-pointer"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-72 bg-[#090b0e] border-r border-white/8 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top: Official Logo */}
          <div className="p-6 border-b border-white/8 flex flex-col items-center gap-3">
            <BrandLogo size="md" onClick={() => handleTabChange('analytics')} />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              <span>Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-[0_4px_24px_rgba(255,255,255,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-black/15 text-black'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer: Admin details, Live site link, Logout */}
          <div className="p-4 border-t border-white/8 flex flex-col gap-2 bg-[#08090b]">
            <div className="px-3 py-2 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Administrator</span>
              <span className="text-white font-medium truncate block">Platform Administrator</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              View Public Site
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/admin/login');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-10 max-w-7xl">
        {/* Content Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {sidebarItems.find((i) => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Production database operations: real data from Cloud Firestore.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton variant="outline" size="sm" onClick={() => loadAllAdminData()}>
              Refresh
            </GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={() => navigate('/')}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Public Site
            </GlassButton>
          </div>
        </div>

      {/* 1. OVERVIEW ANALYTICS & REAL EARNINGS */}
      {activeTab === 'analytics' && analytics && (() => {
        const filteredOrders = orders.filter((o) => {
          if (timeFilter === 'all') return true;
          const orderDate = new Date(o.createdAt || o.created_at || 0);
          const now = new Date();
          const target = new Date();
          if (timeFilter === 'today') {
            target.setHours(0, 0, 0, 0);
          } else if (timeFilter === '7days') {
            target.setDate(now.getDate() - 7);
          } else if (timeFilter === '30days') {
            target.setDate(now.getDate() - 30);
          } else if (timeFilter === 'this_month') {
            target.setDate(1);
            target.setHours(0, 0, 0, 0);
          }
          return orderDate >= target;
        });

        const totalRevenue = filteredOrders
          .filter((o) => o.status === 'PAID')
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);

        const paidOrdersCount = filteredOrders.filter((o) => o.status === 'PAID').length;
        const successfulPaymentsCount = filteredOrders.filter(
          (o) => o.status === 'PAID' && (o.razorpay_payment_id || o.razorpayPaymentId)
        ).length || paidOrdersCount;
        const refundedAmount = filteredOrders
          .filter((o) => o.status === 'REFUNDED')
          .reduce((sum, o) => sum + Number(o.amount || 0), 0);
        const pendingPaymentsCount = filteredOrders.filter((o) => o.status === 'PENDING').length;
        const coursesSoldCount = paidOrdersCount;

        const timeFilterLabels: Record<'all' | 'today' | '7days' | '30days' | 'this_month', string> = {
          today: 'Today',
          '7days': '7 Days',
          '30days': '30 Days',
          this_month: 'This Month',
          all: 'All Time',
        };

        return (
          <div className="flex flex-col gap-8">
            {/* Real Financial Earnings & Time Filters Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[28px] bg-white/[0.02] border border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Verified Financial Intelligence</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real Razorpay & Firestore verified transaction metrics. Zero estimated numbers.
                </p>
              </div>

              {/* iOS Pill Time Filter Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/8 backdrop-blur-md overflow-x-auto">
                {(['today', '7days', '30days', 'this_month', 'all'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTimeFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      timeFilter === key
                        ? 'bg-white text-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {timeFilterLabels[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* 6 Real Financial Cards (Section 8) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Total Revenue</span>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1.5">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Paid Orders</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {paidOrdersCount}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Successful Payments</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {successfulPaymentsCount}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Refunded Amount</span>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-400 mt-1.5">
                  ₹{refundedAmount.toLocaleString('en-IN')}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Pending Payments</span>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1.5">
                  {pendingPaymentsCount}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-[11px] text-slate-400 font-medium">Courses Sold</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {coursesSoldCount}
                </div>
              </GlassCard>
            </div>

            {/* Secondary Platform Activity Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-xs text-slate-400 font-medium">Registered Students</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {analytics.totalStudents}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-xs text-slate-400 font-medium">Published Courses</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {analytics.publishedCourses} / {analytics.totalCourses}
                </div>
              </GlassCard>

              <GlassCard interactive={false} className="p-5 rounded-[26px]">
                <span className="text-xs text-slate-400 font-medium">All Time Orders</span>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
                  {analytics.totalOrders}
                </div>
              </GlassCard>
            </div>

          {/* Recent Orders & Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard interactive={false} className="p-7 rounded-[28px]">
              <h3 className="text-base font-bold text-white mb-4">
                Recent Orders
              </h3>
              {analytics.recentOrders.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {analytics.recentOrders.map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{o.userName}</span>
                        <p className="text-slate-400 truncate max-w-[200px]">{o.courseTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">₹{o.amount.toLocaleString('en-IN')}</span>
                        <p className="text-[10px] text-emerald-400 uppercase font-semibold">{o.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No orders placed yet.</p>
              )}
            </GlassCard>

            <GlassCard interactive={false} className="p-7 rounded-[28px]">
              <h3 className="text-base font-bold text-white mb-4">
                Recently Registered Students
              </h3>
              {analytics.recentStudents.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {analytics.recentStudents.map((s) => (
                    <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{s.name}</span>
                        <p className="text-slate-400">{s.email}</p>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No students registered yet.</p>
              )}
            </GlassCard>
          </div>
        </div>
        );
      })()}

      {/* 2. COURSES MANAGEMENT */}
      {activeTab === 'courses' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Courses: {courses.length}</span>
            <GlassButton variant="primary" size="sm" onClick={() => handleOpenCourseModal()}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Course
            </GlassButton>
          </div>

          {courses.length > 0 ? (
            <GlassTable headers={['Title', 'Category', 'Price', 'Status', 'Modules', 'Students', 'Actions']}>
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-5">
                    <span className="text-xs font-semibold text-white block">{c.title}</span>
                    <span className="text-[10px] text-slate-400">/{c.slug}</span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-300">{c.categoryName || 'None'}</td>
                  <td className="py-3.5 px-5 text-xs font-bold text-white">
                    {c.finalPrice === 0 ? 'Free' : `₹${c.finalPrice.toLocaleString('en-IN')}`}
                  </td>
                  <td className="py-3.5 px-5 text-xs">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        c.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">
                    {c.modulesCount || 0} mod · {c.lessonsCount || 0} les
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">{c.studentsCount || 0}</td>
                  <td className="py-3.5 px-5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedCurriculumCourse(c);
                          handleTabChange('curriculum');
                        }}
                        className="w-8 h-8 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-400 hover:text-blue-300 cursor-pointer active:scale-95 transition-all"
                        title="Manage Modules & Lessons"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenCourseModal(c)}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
                        title="Edit course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c)}
                        className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95 transition-all"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No courses created yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Click "Create Course" to add the first real course to the database.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. CURRICULUM BUILDER */}
      {activeTab === 'curriculum' && (
        <div className="flex flex-col gap-6">
          <div className="p-4 sm:p-5 rounded-[28px] bg-white/[0.025] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-300">Select Course:</span>
              <GlassSelect
                pill
                value={selectedCurriculumCourse?.id || ''}
                onChange={(e) => {
                  const found = courses.find((c) => c.id === e.target.value);
                  if (found) setSelectedCurriculumCourse(found);
                }}
                className="w-full sm:w-72"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </GlassSelect>
            </div>

            {selectedCurriculumCourse && (
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingModule(null);
                  setModuleTitle('');
                  setModuleDesc('');
                  setIsModuleModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Module
              </GlassButton>
            )}
          </div>

          {selectedCurriculumCourse && curriculumModules.length > 0 ? (
            <div className="flex flex-col gap-4">
              {curriculumModules.map((mod, mIdx) => (
                <div key={mod.id} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-3.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">Module {mIdx + 1}</span>
                      <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                      {mod.description && <p className="text-xs text-slate-400">{mod.description}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenLessonModal(mod.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Lesson
                      </GlassButton>
                      <button
                        onClick={() => {
                          setEditingModule(mod);
                          setModuleTitle(mod.title);
                          setModuleDesc(mod.description || '');
                          setIsModuleModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod)}
                        className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="flex flex-col gap-2 pl-4 border-l border-white/10">
                    {mod.lessons && mod.lessons.length > 0 ? (
                      mod.lessons.map((lesson: any, lIdx: number) => (
                        <div
                          key={lesson.id}
                          className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500 font-mono">{lIdx + 1}.</span>
                            <span className="font-medium text-white">{lesson.title}</span>
                            {lesson.freePreview && (
                              <span className="text-[9px] text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-bold">
                                Free Preview
                              </span>
                            )}
                            {lesson.duration && (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenLessonModal(mod.id, lesson)}
                              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer active:scale-95"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson)}
                              className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-2">No lessons added to this module yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {courses.length === 0
                  ? 'Create a course first before building curriculum.'
                  : 'No modules created for this course yet.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Categories: {categories.length}</span>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Category
            </GlassButton>
          </div>

          {categories.length > 0 ? (
            <GlassTable headers={['Name', 'Slug', 'Description', 'Courses Count', 'Actions']}>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-5 text-xs font-semibold text-white">{cat.name}</td>
                  <td className="py-3.5 px-5 text-xs font-mono text-slate-400">/{cat.slug}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">{cat.description || '—'}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">{cat.coursesCount || 0}</td>
                  <td className="py-3.5 px-5 text-xs">
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <FolderKanban className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No categories exist yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add categories to organize your courses.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {orders.length > 0 ? (
            <GlassTable headers={['Order ID', 'Student', 'Course', 'Amount', 'Provider', 'Status', 'Date']}>
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-5 text-xs font-mono text-slate-400">{o.id}</td>
                  <td className="py-3.5 px-5 text-xs">
                    <span className="font-semibold text-white block">{o.user_name}</span>
                    <span className="text-[10px] text-slate-400">{o.user_email}</span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-white">{o.course_title}</td>
                  <td className="py-3.5 px-5 text-xs font-bold text-white">
                    ₹{Number(o.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">{o.payment_provider}</td>
                  <td className="py-3.5 px-5 text-xs">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        o.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <CreditCard className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No orders recorded yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Real customer checkout transactions will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5b. PAYMENTS */}
      {activeTab === 'payments' && (() => {
        const paidPayments = orders.filter((o) => o.status === 'PAID');
        return (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] bg-white/[0.02] border border-white/8">
              <div>
                <h3 className="text-base font-bold text-white">Verified Razorpay Payments</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cryptographically signed transactions verified by backend server. Zero fake revenue.</p>
              </div>
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                Total Verified: ₹{paidPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>

            {paidPayments.length > 0 ? (
              <GlassTable headers={['Payment ID / Ref', 'Order ID', 'Student', 'Course', 'Amount', 'Status', 'Date']}>
                {paidPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-5 text-xs font-mono text-emerald-300">
                      {p.razorpay_payment_id || p.razorpayPaymentId || p.payment_id || 'rzp_verified'}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-slate-400">{p.id}</td>
                    <td className="py-3.5 px-5 text-xs">
                      <span className="font-semibold text-white block">{p.user_name}</span>
                      <span className="text-[10px] text-slate-400">{p.user_email}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-white">{p.course_title}</td>
                    <td className="py-3.5 px-5 text-xs font-bold text-emerald-400">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {new Date(p.created_at || p.createdAt || 0).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </GlassTable>
            ) : (
              <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
                <Receipt className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No verified payments yet.</h3>
                <p className="text-xs text-slate-400 mt-1">
                  When students complete checkout via Razorpay, verified payment records appear here.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* 6. STUDENTS */}
      {/* 6. STUDENTS */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Registered Students: {students.length}</span>
          </div>

          {students.length > 0 ? (
            <GlassTable headers={['Student Name', 'Email', 'Account Status', 'Enrolled Courses', 'Paid Orders', 'Certificates', 'Registered', 'Moderation']}>
              {students.map((s) => {
                const status = s.status || 'ACTIVE';
                return (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-5 text-xs font-semibold text-white">{s.name}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-300">{s.email}</td>
                    <td className="py-3.5 px-5 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : status === 'SUSPENDED'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {status}
                      </span>
                      {s.suspension_reason && (
                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs truncate" title={s.suspension_reason}>
                          Reason: {s.suspension_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">{s.enrollments_count || 0}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">{s.paid_orders_count || 0}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">{s.certificates_count || 0}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-xs">
                      <div className="flex items-center gap-1.5">
                        {status !== 'ACTIVE' ? (
                          <button
                            onClick={() => handleOpenModeration(s, 'ACTIVE')}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 cursor-pointer"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModeration(s, 'SUSPENDED')}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 cursor-pointer"
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => handleOpenModeration(s, 'BANNED')}
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer"
                            >
                              Ban
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No students registered yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                New accounts created via registration will be listed here.
              </p>
            </div>
          )}

          {/* Student Account Moderation Modal */}
          <GlassModal
            isOpen={isModerationModalOpen}
            onClose={() => setIsModerationModalOpen(false)}
            title={`Ethical Moderation: ${moderationTargetStatus === 'ACTIVE' ? 'Restore Account' : moderationTargetStatus === 'SUSPENDED' ? 'Suspend Account' : 'Ban Account'}`}
            description={
              moderationTargetStatus === 'ACTIVE'
                ? `Restore access for student ${selectedStudentForModeration?.name} (${selectedStudentForModeration?.email}).`
                : `Specify mandatory audit reason for marking account ${selectedStudentForModeration?.name} (${selectedStudentForModeration?.email}) as ${moderationTargetStatus}.`
            }
          >
            <div className="flex flex-col gap-4 mt-2">
              {moderationTargetStatus !== 'ACTIVE' && (
                <GlassTextarea
                  label="Mandatory Reason for Action"
                  placeholder="e.g. Terms violation, fraudulent chargeback inquiry, spam activity..."
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  required
                  rows={3}
                />
              )}

              <div className="flex justify-end gap-3 pt-3">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModerationModalOpen(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant={moderationTargetStatus === 'ACTIVE' ? 'primary' : 'danger'}
                  size="sm"
                  onClick={handleConfirmModeration}
                  isLoading={isSubmittingModeration}
                >
                  Confirm {moderationTargetStatus}
                </GlassButton>
              </div>
            </div>
          </GlassModal>
        </div>
      )}

      {/* 7. COUPONS */}
      {activeTab === 'coupons' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Coupons: {coupons.length}</span>
            <GlassButton variant="primary" size="sm" onClick={() => setIsCouponModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Coupon
            </GlassButton>
          </div>

          {coupons.length > 0 ? (
            <GlassTable headers={['Coupon Code', 'Type', 'Value', 'Usage', 'Min Amount', 'Status', 'Actions']}>
              {coupons.map((cp: any) => (
                <tr key={cp.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-5 text-xs font-mono font-bold text-white">{cp.code}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-300">{cp.type}</td>
                  <td className="py-3.5 px-5 text-xs font-bold text-white">
                    {cp.type === 'PERCENTAGE' ? `${cp.value}%` : `₹${cp.value}`}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">
                    {cp.used_count || 0} / {cp.max_uses || 100}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">₹{cp.minimum_amount || 0}</td>
                  <td className="py-3.5 px-5 text-xs">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
                        cp.active
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {cp.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs">
                    <button
                      onClick={() => handleDeleteCoupon(cp)}
                      className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Tag className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No coupons created yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Create promotional discount coupons for checkout.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. REVIEWS */}
      {activeTab === 'reviews' && (
        <div>
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{r.user_name}</span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-400">{r.course_title}</span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs font-semibold text-amber-400">★ {r.rating}/5</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{r.comment}"</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">
                      Status: <strong>{r.status}</strong> · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status !== 'APPROVED' && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleReviewStatus(r.id, 'APPROVED')}
                      >
                        Approve
                      </GlassButton>
                    )}
                    {r.status !== 'REJECTED' && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReviewStatus(r.id, 'REJECTED')}
                      >
                        Reject
                      </GlassButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Star className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No reviews yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Reviews submitted by enrolled students will be reviewed here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 9. CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div>
          {certificates.length > 0 ? (
            <GlassTable headers={['Certificate Code', 'Student', 'Course', 'Issue Date', 'Actions']}>
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 px-5 text-xs font-mono font-bold text-white">
                    {cert.certificateCode}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-white">{cert.studentName}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-300">{cert.courseTitle}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-400">
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-5 text-xs">
                    <button
                      onClick={() => navigate(`/verify-certificate/${cert.certificateCode}`)}
                      className="text-xs text-slate-300 hover:text-white underline cursor-pointer"
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Award className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No certificates issued yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Certificates awarded to students upon 100% curriculum completion will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 10. BRAND SETTINGS */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-8">
          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 flex flex-col gap-8">
            <div className="flex items-center gap-4 border-b border-white/8 pb-6">
              <div className="p-3 rounded-2xl bg-white/5 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Official Brand Identity</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage the official GENIUS SKILLS brand assets used across the entire platform.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* Official Logo Section */}
              <div className="flex flex-col gap-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Official Logo</label>
                
                <div className="relative group">
                  <div className="aspect-video w-full rounded-[24px] bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden p-8 relative">
                    {/* Grid background for transparency visualization */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    
                    <BrandLogo size="hero" />
                    
                    {!logoUrl && !isUploadingLogo && (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-500 font-bold uppercase">No logo configured</p>
                      </div>
                    )}

                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="text-center">
                          <div className="text-2xl font-black text-white">{logoProgress}%</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Uploading to Cloudinary</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleUploadLogoFile}
                        disabled={isUploadingLogo}
                      />
                      <div className="inline-flex items-center justify-center rounded-full px-6 h-11 text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all cursor-pointer shadow-[0_8px_20px_rgba(255,255,255,0.15)] active:scale-95">
                        <Upload className="w-4 h-4 mr-2" />
                        {logoUrl ? 'Replace Official Logo' : 'Upload Official Logo'}
                      </div>
                    </label>

                    {logoUrl && (
                      <GlassButton 
                        type="button" 
                        variant="secondary" 
                        size="md" 
                        onClick={() => {
                          setDeleteConfirm({
                            isOpen: true,
                            title: 'Remove Official Logo',
                            message: 'Are you sure you want to remove the official brand logo? The site will fallback to text branding.',
                            action: async () => {
                              await updateBrandSettings({ logoUrl: '', logoPublicId: '' });
                              await refreshBrand();
                              setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                              showToast('Official logo removed.', 'info');
                            }
                          });
                        }}
                      >
                        Remove Logo
                      </GlassButton>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                    Supported: <strong>PNG, WEBP, JPG, SVG</strong>. For best results, use a high-resolution file with a <strong>transparent background</strong>.
                  </p>
                </div>
              </div>

              {/* Brand Text Identity */}
              <div className="flex flex-col gap-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Brand Nomenclature</label>
                
                <div className="space-y-5">
                  <GlassInput
                    pill
                    label="Canonical Brand Name"
                    value={settings.brand_name || ''}
                    onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
                    placeholder="GENIUS"
                  />
                  <GlassInput
                    pill
                    label="Official Tagline"
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    placeholder="SKILLS"
                  />
                </div>
                
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-3 h-3 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">
                    <strong>Centralized System:</strong> Changes saved here will automatically propagate across the entire website, including navigation, footer, auth portals, and legal documents.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/8">
              <GlassButton variant="primary" size="md" type="submit">
                Save Brand Changes
              </GlassButton>
            </div>
          </div>
        </form>
      )}

      {/* 11. SITE SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-8 max-w-4xl">
          {/* Hero & Marketing Content */}
          <GlassCard interactive={false} className="p-8 rounded-[32px] border-white/15 bg-white/[0.03] flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-white/5 text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Hero & Landing Content</h3>
            </div>

            <GlassInput
              pill
              label="Hero Headline"
              value={settings.hero_heading || ''}
              onChange={(e) => setSettings({ ...settings, hero_heading: e.target.value })}
            />

            <GlassTextarea
              label="Hero Description"
              rows={3}
              value={settings.hero_description || ''}
              onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
            />

            <GlassInput
              pill
              label="Primary CTA Button Text"
              value={settings.primary_cta_text || ''}
              onChange={(e) => setSettings({ ...settings, primary_cta_text: e.target.value })}
            />
          </GlassCard>

          <GlassCard interactive={false} className="p-7 rounded-[28px] flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">
              Contact & Social Channels
            </h3>

            <GlassInput
              pill
              label="Contact Email"
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />

            <GlassInput
              pill
              label="Support Phone"
              value={settings.support_phone || ''}
              onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
            />

            <GlassInput
              pill
              label="Twitter / X Profile Link"
              value={settings.social_twitter || ''}
              onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })}
            />

            <GlassInput
              pill
              label="LinkedIn Profile Link"
              value={settings.social_linkedin || ''}
              onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
            />
          </GlassCard>

          <div>
            <GlassButton variant="primary" size="md" type="submit">
              Save All Settings
            </GlassButton>
          </div>
        </form>
      )}

      {/* 11. INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div>
          {contactSubmissions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {contactSubmissions.map((sub: any) => (
                <div key={sub.id} className="p-6 rounded-[28px] bg-white/[0.02] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold text-white">{sub.name}</span>
                      <span className="text-xs text-slate-400 ml-2">({sub.email})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 mb-1">Subject: {sub.subject}</h4>
                  <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">
                    {sub.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-14 rounded-[32px] bg-white/[0.02] border border-white/10 text-center">
              <Mail className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No contact messages yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Submissions from the public contact page will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Course Modal */}
      <GlassModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Create New Course'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveCourse} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
          <GlassInput
            pill
            label="Course Title"
            value={courseForm.title}
            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
            required
          />

          <GlassInput
            pill
            label="Course Slug (URL identifier)"
            value={courseForm.slug}
            onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
            placeholder="e.g. advanced-system-architecture"
          />

          <GlassSelect
            pill
            label="Category"
            value={courseForm.categoryId}
            onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })}
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </GlassSelect>

          <GlassInput
            pill
            label="Instructor Name"
            value={courseForm.instructor}
            onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-300 font-medium">Course Thumbnail</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <GlassInput
                  pill
                  value={courseForm.thumbnail}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                  placeholder="Paste URL or upload image below..."
                />
              </div>
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadThumbnailFile}
                />
                <span className="inline-flex items-center justify-center rounded-full px-4 h-11 text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {isUploadingThumbnail ? `${thumbnailProgress}%` : 'Upload Image'}
                </span>
              </label>
            </div>
            {isUploadingThumbnail && (
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-1">
                <div className="bg-white h-full transition-all" style={{ width: `${thumbnailProgress}%` }} />
              </div>
            )}
            {courseForm.thumbnail && (
              <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img src={courseForm.thumbnail} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              pill
              label="Original Price (₹ INR)"
              type="number"
              min="0"
              value={courseForm.price}
              onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
            />

            <GlassInput
              pill
              label="Discount Amount (₹ INR)"
              type="number"
              min="0"
              value={courseForm.discount}
              onChange={(e) => setCourseForm({ ...courseForm, discount: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <GlassSelect
              pill
              label="Skill Level"
              value={courseForm.level}
              onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
            >
              <option value="All Levels">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </GlassSelect>

            <GlassInput
              pill
              label="Language"
              value={courseForm.language}
              onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })}
            />

            <GlassInput
              pill
              label="Duration (e.g. 12 Hours)"
              value={courseForm.duration}
              onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              pill
              label="Publication Status"
              value={courseForm.status}
              onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as any })}
            >
              <option value="DRAFT">DRAFT (Hidden)</option>
              <option value="PUBLISHED">PUBLISHED (Public)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </GlassSelect>

            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.featured}
                  onChange={(e) => setCourseForm({ ...courseForm, featured: e.target.checked })}
                  className="rounded"
                />
                <span>Feature on Homepage</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseForm.certificateEnabled}
                  onChange={(e) => setCourseForm({ ...courseForm, certificateEnabled: e.target.checked })}
                  className="rounded"
                />
                <span>Enable Certificate</span>
              </label>
            </div>
          </div>

          <GlassTextarea
            label="Short Summary"
            rows={2}
            value={courseForm.shortDescription}
            onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })}
          />

          <GlassTextarea
            label="Full Course Syllabus & Description"
            rows={5}
            value={courseForm.fullDescription}
            onChange={(e) => setCourseForm({ ...courseForm, fullDescription: e.target.value })}
          />

          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCourseModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Course
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Module Modal */}
      <GlassModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        title={editingModule ? 'Edit Module' : 'Add Module'}
      >
        <form onSubmit={handleSaveModule} className="flex flex-col gap-4">
          <GlassInput
            pill
            label="Module Title"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            required
          />

          <GlassTextarea
            label="Description (Optional)"
            rows={2}
            value={moduleDesc}
            onChange={(e) => setModuleDesc(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-3">
            <GlassButton type="button" variant="secondary" size="sm" onClick={() => setIsModuleModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Module
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Lesson Modal */}
      <GlassModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Add Lesson'}
      >
        <form onSubmit={handleSaveLesson} className="flex flex-col gap-4">
          <GlassInput
            pill
            label="Lesson Title"
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
            required
          />

          <div className="flex flex-col gap-1.5">
            <GlassInput
              pill
              label="Video Source (Direct URL, YouTube, Vimeo, or Storage link)"
              value={lessonForm.videoSource}
              onChange={(e) => setLessonForm({ ...lessonForm, videoSource: e.target.value })}
              placeholder="https://..."
            />
            <div className="flex items-center gap-3 px-1">
              <label className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Video File (Cloudinary)</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleUploadLessonVideoFile}
                  className="hidden"
                  disabled={isUploadingVideo}
                />
              </label>
              {isUploadingVideo && (
                <span className="text-[10px] text-amber-400 font-medium">Uploading video {videoProgress}%...</span>
              )}
            </div>
          </div>

          <GlassInput
            pill
            label="Duration (e.g. 15m)"
            value={lessonForm.duration}
            onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
          />

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={lessonForm.freePreview}
                onChange={(e) => setLessonForm({ ...lessonForm, freePreview: e.target.checked })}
                className="rounded"
              />
              <span>Allow Free Preview</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={lessonForm.published}
                onChange={(e) => setLessonForm({ ...lessonForm, published: e.target.checked })}
                className="rounded"
              />
              <span>Published</span>
            </label>
          </div>

          <GlassTextarea
            label="Lesson Notes / Description"
            rows={3}
            value={lessonForm.description}
            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
          />

          <div className="pt-2 flex justify-end gap-3">
            <GlassButton type="button" variant="secondary" size="sm" onClick={() => setIsLessonModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Lesson
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Category Modal */}
      <GlassModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create Category"
      >
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
          <GlassInput
            pill
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />

          <GlassInput
            pill
            label="Slug (Optional)"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            placeholder="e.g. software-engineering"
          />

          <GlassTextarea
            label="Description"
            rows={2}
            value={categoryDesc}
            onChange={(e) => setCategoryDesc(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-3">
            <GlassButton type="button" variant="secondary" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Category
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Coupon Modal */}
      <GlassModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Create Coupon"
      >
        <form onSubmit={handleSaveCoupon} className="flex flex-col gap-4">
          <GlassInput
            pill
            label="Coupon Code (Auto Uppercase)"
            value={couponForm.code}
            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              pill
              label="Discount Type"
              value={couponForm.type}
              onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </GlassSelect>

            <GlassInput
              pill
              label="Discount Value"
              type="number"
              value={couponForm.value}
              onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              pill
              label="Max Uses"
              type="number"
              value={couponForm.maxUses}
              onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
            />

            <GlassInput
              pill
              label="Minimum Order Amount (₹)"
              type="number"
              value={couponForm.minimumAmount}
              onChange={(e) => setCouponForm({ ...couponForm, minimumAmount: Number(e.target.value) })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <GlassButton type="button" variant="secondary" size="sm" onClick={() => setIsCouponModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Coupon
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.action}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
      </main>
    </div>
  );
};
