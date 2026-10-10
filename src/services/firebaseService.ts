import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Course, Category, Module, Lesson, Order, Coupon, Review, Certificate, SiteSettings, BrandSettings, MediaSlide } from '../types';

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
  role: 'STUDENT' | 'ADMIN';
  emailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: any;
  updatedAt: any;
}

export const isPlatformAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'admin.geniusskills@gmail.com' || clean === 'ashishbarele45@gmail.com';
};

// ==================== USER PROFILE ====================

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const profile = snap.data() as FirestoreUserProfile;
  const isAuthorizedAdmin = isPlatformAdminEmail(profile.email) || profile.role === 'ADMIN';
  if (isAuthorizedAdmin) {
    profile.role = 'ADMIN';
    if (!profile.displayName || profile.displayName === 'Student') {
      profile.displayName = 'Administrator';
    }
  }
  return profile;
}

export async function createUserProfile(
  uid: string,
  data: { displayName: string; email: string; role?: 'STUDENT' | 'ADMIN'; photoURL?: string | null; emailVerified?: boolean }
): Promise<FirestoreUserProfile> {
  const userRef = doc(db, 'users', uid);
  const existing = await getDoc(userRef);
  const isAuthorizedAdmin = isPlatformAdminEmail(data.email) || data.role === 'ADMIN';

  if (existing.exists()) {
    const existingData = existing.data() as FirestoreUserProfile;
    if (isAuthorizedAdmin && (existingData.role !== 'ADMIN' || !existingData.displayName || existingData.displayName === 'Student')) {
      await updateDoc(userRef, {
        role: 'ADMIN',
        name: existingData.displayName && existingData.displayName !== 'Student' ? existingData.displayName : 'Administrator',
        displayName: existingData.displayName && existingData.displayName !== 'Student' ? existingData.displayName : 'Administrator',
        updatedAt: serverTimestamp(),
      });
      existingData.role = 'ADMIN';
      existingData.displayName = existingData.displayName && existingData.displayName !== 'Student' ? existingData.displayName : 'Administrator';
    }
    return existingData;
  }

  const role: 'STUDENT' | 'ADMIN' = isAuthorizedAdmin ? 'ADMIN' : (data.role || 'STUDENT');
  const displayName = isAuthorizedAdmin
    ? (data.displayName && data.displayName !== 'Student' ? data.displayName : 'Administrator')
    : (data.displayName || 'Student');

  const profile: any = {
    uid,
    name: displayName,
    displayName,
    email: data.email.toLowerCase(),
    photoURL: data.photoURL || null,
    role,
    emailVerified: Boolean(data.emailVerified),
    status: 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return profile as FirestoreUserProfile;
}

export async function updateUserProfile(uid: string, updates: Partial<FirestoreUserProfile>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllStudents(): Promise<FirestoreUserProfile[]> {
  const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FirestoreUserProfile);
}

// ==================== COURSES ====================

export async function getCourses(options?: {
  category?: string;
  level?: string;
  featuredOnly?: boolean;
  status?: string;
}): Promise<Course[]> {
  const courseCol = collection(db, 'courses');
  let q = query(courseCol);

  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  } else {
    q = query(q, where('status', '==', 'PUBLISHED'));
  }

  if (options?.featuredOnly) {
    q = query(q, where('featured', '==', true));
  }

  if (options?.category) {
    q = query(q, where('categoryId', '==', options.category));
  }

  if (options?.level && options.level !== 'all') {
    q = query(q, where('level', '==', options.level));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title || '',
      slug: data.slug || d.id,
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      categoryId: data.categoryId || '',
      categoryName: data.categoryName || '',
      instructor: data.instructor || '',
      thumbnail: data.thumbnail || '',
      price: Number(data.price || 0),
      discount: Number(data.discount || 0),
      finalPrice: Math.max(0, Number(data.price || 0) - Number(data.discount || 0)),
      level: data.level || 'All Levels',
      language: data.language || 'English',
      duration: data.duration || '',
      status: data.status || 'DRAFT',
      featured: Boolean(data.featured),
      certificateEnabled: data.certificateEnabled !== false,
      modulesCount: Number(data.modulesCount || 0),
      lessonsCount: Number(data.lessonsCount || 0),
      averageRating: Number(data.averageRating || 0),
      reviewCount: Number(data.reviewCount || 0),
      studentCount: Number(data.studentCount || 0),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
    } as Course;
  });
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const q = query(collection(db, 'courses'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    // Try directly by ID
    const docRef = doc(db, 'courses', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { id: docSnap.id, ...data } as Course;
  }
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    ...data,
    finalPrice: Math.max(0, Number(data.price || 0) - Number(data.discount || 0)),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
  } as Course;
}

export async function createCourse(data: Partial<Course>): Promise<string> {
  const courseId = 'course_' + Math.random().toString(36).substring(2, 11);
  const cleanSlug = (data.slug || data.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  await setDoc(doc(db, 'courses', courseId), {
    ...data,
    slug: cleanSlug,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return courseId;
}

export async function updateCourse(courseId: string, updates: Partial<Course>) {
  await updateDoc(doc(db, 'courses', courseId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCourse(courseId: string) {
  await deleteDoc(doc(db, 'courses', courseId));
}

// ==================== MODULES & LESSONS ====================

export async function getCourseCurriculum(courseId: string): Promise<Module[]> {
  const modulesRef = collection(db, 'courses', courseId, 'modules');
  const modSnap = await getDocs(query(modulesRef, orderBy('orderIndex', 'asc')));

  const modules: Module[] = [];
  for (const mDoc of modSnap.docs) {
    const mData = mDoc.data();
    const lessonsRef = collection(db, 'courses', courseId, 'modules', mDoc.id, 'lessons');
    const lesSnap = await getDocs(query(lessonsRef, orderBy('orderIndex', 'asc')));

    const lessons: Lesson[] = lesSnap.docs.map((lDoc) => ({
      id: lDoc.id,
      moduleId: mDoc.id,
      ...lDoc.data(),
    })) as Lesson[];

    modules.push({
      id: mDoc.id,
      courseId,
      title: mData.title || '',
      description: mData.description || '',
      orderIndex: mData.orderIndex || 0,
      lessons,
    });
  }
  return modules;
}

export async function addModule(courseId: string, title: string, description: string, orderIndex: number) {
  const modId = 'mod_' + Math.random().toString(36).substring(2, 9);
  await setDoc(doc(db, 'courses', courseId, 'modules', modId), {
    title,
    description,
    orderIndex,
    createdAt: serverTimestamp(),
  });
  return modId;
}

export async function deleteModule(courseId: string, moduleId: string) {
  await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId));
}

export async function addLesson(
  courseId: string,
  moduleId: string,
  lessonData: { title: string; description: string; videoSource: string; duration: string; freePreview: boolean; published: boolean; orderIndex: number }
) {
  const lessonId = 'les_' + Math.random().toString(36).substring(2, 9);
  await setDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId), {
    ...lessonData,
    createdAt: serverTimestamp(),
  });
  return lessonId;
}

export async function deleteLesson(courseId: string, moduleId: string, lessonId: string) {
  await deleteDoc(doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId));
}

// ==================== CATEGORIES ====================

export async function getCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Category[];
}

export async function addCategory(name: string, slug?: string, description?: string): Promise<string> {
  const catId = 'cat_' + Math.random().toString(36).substring(2, 9);
  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  await setDoc(doc(db, 'categories', catId), {
    name,
    slug: cleanSlug,
    description: description || '',
    active: true,
    createdAt: serverTimestamp(),
  });
  return catId;
}

export async function deleteCategory(categoryId: string) {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// ==================== ENROLLMENTS ====================

export async function checkEnrollment(userId: string, courseId: string): Promise<boolean> {
  const q = query(
    collection(db, 'enrollments'),
    where('userId', '==', userId),
    where('courseId', '==', courseId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function getUserEnrollments(userId: string): Promise<any[]> {
  const q = query(collection(db, 'enrollments'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const enrollments = [];

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    // Fetch associated course info
    const courseRef = doc(db, 'courses', data.courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      enrollments.push({
        id: docSnap.id,
        courseId: data.courseId,
        enrolledAt: data.enrolledAt?.toDate ? data.courseId : new Date().toISOString(),
        course: { id: courseSnap.id, ...courseSnap.data() },
      });
    }
  }
  return enrollments;
}

// ==================== LESSON PROGRESS ====================

export async function getUserLessonProgress(userId: string, courseId: string): Promise<string[]> {
  const progressRef = collection(db, 'users', userId, 'progress');
  const q = query(progressRef, where('courseId', '==', courseId), where('completed', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

export async function markLessonProgress(userId: string, courseId: string, lessonId: string, completed: boolean) {
  const docRef = doc(db, 'users', userId, 'progress', lessonId);
  if (completed) {
    await setDoc(docRef, {
      courseId,
      lessonId,
      completed: true,
      completedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(docRef);
  }
}

// ==================== WISHLIST ====================

export async function getUserWishlist(userId: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'wishlist'));
  return snap.docs.map((d) => d.id);
}

export async function toggleUserWishlist(userId: string, courseId: string): Promise<boolean> {
  const docRef = doc(db, 'users', userId, 'wishlist', courseId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, { courseId, addedAt: serverTimestamp() });
    return true;
  }
}

// ==================== CERTIFICATES ====================

export async function verifyCertificateFromFirestore(code: string): Promise<any | null> {
  const q1 = query(collection(db, 'certificates'), where('certificateCode', '==', code.toUpperCase()), limit(1));
  let snap = await getDocs(q1);

  if (snap.empty) {
    const q2 = query(collection(db, 'certificates'), where('verificationToken', '==', code), limit(1));
    snap = await getDocs(q2);
  }

  if (snap.empty) return null;
  return snap.docs[0].data();
}

export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  const q = query(collection(db, 'certificates'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Certificate[];
}

// ==================== ORDERS & REVIEWS ====================

export async function getUserOrders(userId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
  } catch {
    // Fallback if index pending
    const fallbackQ = query(collection(db, 'orders'), where('userId', '==', userId));
    const snap = await getDocs(fallbackQ);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
  }
}

export async function getCourseReviews(courseId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('courseId', '==', courseId),
    where('status', '==', 'APPROVED')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Review[];
}

// ==================== CONTACT & SETTINGS ====================

export async function submitContactForm(data: { name: string; email: string; subject: string; message: string }) {
  const id = 'msg_' + Math.random().toString(36).substring(2, 10);
  await setDoc(doc(db, 'contactSubmissions', id), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const snap = await getDoc(doc(db, 'siteSettings', 'main'));
  if (!snap.exists()) return {};
  return snap.data() as SiteSettings;
}

export async function updateSiteSettings(settings: SiteSettings) {
  await setDoc(doc(db, 'siteSettings', 'main'), settings, { merge: true });
}

export async function getBrandSettings(): Promise<BrandSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'branding'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      logoUrl: data.logoUrl || '',
      logoPublicId: data.logoPublicId || '',
      faviconUrl: data.faviconUrl || '',
      faviconPublicId: data.faviconPublicId || '',
      brandName: data.brandName || 'GENIUS SKILLS',
      tagline: data.tagline || 'Learn Skills. Build Your Future.',
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
    } as BrandSettings;
  } catch (error: any) {
    // If client is offline or network connecting, warn gracefully without crashing caller
    console.warn('[BrandSettings] Remote brand settings unreachable (using defaults/cache):', error?.message || error);
    return null;
  }
}

export async function updateBrandSettings(settings: Partial<BrandSettings>) {
  await setDoc(doc(db, 'siteSettings', 'branding'), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ==================== STORAGE UPLOAD ====================

export async function uploadMedia(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export function uploadMediaWithProgress(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(percent);
        }
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });
}

// ==================== MEDIA SLIDES ====================

export async function getPublicMediaSlides(): Promise<MediaSlide[]> {
  try {
    const q = query(
      collection(db, 'mediaSlides'),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MediaSlide[];
    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  } catch (err) {
    console.warn('Notice: Firestore public media slides unreachable, attempting backend API fallback:', err);
    try {
      const res = await fetch('/api/media-slides');
      if (res.ok) {
        const data = await res.json();
        const slides = Array.isArray(data.slides) ? data.slides : [];
        return slides.filter((s: MediaSlide) => s.active);
      }
    } catch {}
    return [];
  }
}

export async function getAllMediaSlides(): Promise<MediaSlide[]> {
  try {
    const snap = await getDocs(collection(db, 'mediaSlides'));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as MediaSlide[];
    return list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  } catch (err) {
    console.warn('Error fetching all media slides from Firestore, attempting backend API fallback:', err);
    try {
      const res = await fetch('/api/media-slides');
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.slides) ? data.slides : [];
      }
    } catch {}
    return [];
  }
}

export async function createMediaSlide(data: {
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  thumbnailUrl?: string;
  publicId?: string;
  posterPublicId?: string;
  order?: number;
  active?: boolean;
  title?: string;
  caption?: string;
}): Promise<string> {
  const newRef = doc(collection(db, 'mediaSlides'));
  const now = new Date().toISOString();
  await setDoc(newRef, {
    ...data,
    order: Number(data.order) || 0,
    active: data.active !== false,
    createdAt: now,
    updatedAt: now,
  });
  return newRef.id;
}

export async function updateMediaSlide(id: string, updates: Partial<MediaSlide>): Promise<void> {
  const slideRef = doc(db, 'mediaSlides', id);
  await updateDoc(slideRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteMediaSlide(id: string): Promise<void> {
  const slideRef = doc(db, 'mediaSlides', id);
  await deleteDoc(slideRef);
}

export async function reorderMediaSlides(slides: { id: string; order: number }[]): Promise<void> {
  await Promise.all(
    slides.map((s) =>
      updateDoc(doc(db, 'mediaSlides', s.id), {
        order: Number(s.order) || 0,
        updatedAt: new Date().toISOString(),
      })
    )
  );
}
