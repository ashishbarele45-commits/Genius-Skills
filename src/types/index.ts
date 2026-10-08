export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt?: string;
  enrollmentsCount?: number;
  paidOrdersCount?: number;
  certificatesCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  coursesCount?: number;
  active?: boolean;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoSource?: string | null;
  duration?: string;
  orderIndex: number;
  freePreview: boolean;
  published?: boolean;
  completed?: boolean;
  isLocked?: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  instructor?: string;
  thumbnail?: string;
  price: number;
  discount: number;
  finalPrice: number;
  level: string;
  language: string;
  duration?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  certificateEnabled: boolean;
  modulesCount?: number;
  lessonsCount?: number;
  studentsCount?: number;
  averageRating?: number;
  reviewCount?: number;
  studentCount?: number;
  createdAt: string;
  updatedAt?: string;
  modules?: Module[];
  reviews?: Review[];
  isEnrolled?: boolean;
  progressPercent?: number;
}

export interface Review {
  id: string;
  courseId?: string;
  courseTitle?: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Order {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  userName?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentId?: string;
  status: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  coupon?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  max_uses?: number;
  used_count?: number;
  maxUses?: number;
  usedCount?: number;
  expiry_date?: string;
  expiryDate?: string;
  minimum_amount?: number;
  minimumAmount?: number;
  active: boolean | number;
  created_at?: string;
}

export interface Certificate {
  id: string;
  certificateCode: string;
  courseId: string;
  courseTitle: string;
  courseSlug?: string;
  studentName?: string;
  studentEmail?: string;
  instructorName?: string;
  issueDate: string;
  verificationToken: string;
}

export interface AdminAnalytics {
  totalStudents: number;
  totalCourses: number;
  publishedCourses: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalCertificates: number;
  pendingReviews: number;
  recentOrders: Array<{
    id: string;
    userName: string;
    courseTitle: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  recentStudents: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

export interface SiteSettings {
  brand_name?: string;
  tagline?: string;
  hero_heading?: string;
  hero_description?: string;
  primary_cta_text?: string;
  contact_email?: string;
  support_phone?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_github?: string;
  faq_list?: Array<{ question: string; answer: string }>;
  [key: string]: any;
}

export interface BrandSettings {
  logoUrl: string;
  logoPublicId?: string;
  faviconUrl?: string;
  faviconPublicId?: string;
  brandName: string;
  tagline: string;
  updatedAt?: string;
}

export interface MediaSlide {
  id: string;
  title?: string;
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  publicId?: string;
  posterPublicId?: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
