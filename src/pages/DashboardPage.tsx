import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../lib/api';
import { Order, Certificate, Course } from '../types';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassTabs } from '../components/ui/glass/GlassBadge';
import { GlassTable } from '../components/ui/glass/GlassTable';
import { GlassInput } from '../components/ui/glass/GlassInput';
import { useBrand } from '../context/BrandContext';
import {
  BookOpen,
  Award,
  CreditCard,
  Heart,
  PlayCircle,
  ExternalLink,
  Trash2,
  Shield,
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (route: string) => void;
  initialTab?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
  initialTab = 'overview',
}) => {
  const { brandName, tagline } = useBrand();
  const { user, updateProfileName } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, certsRes, ordersRes, wishRes] = await Promise.all([
        apiRequest<{ courses: any[] }>('/api/enrollments/my-courses'),
        apiRequest<{ certificates: Certificate[] }>('/api/certificates/my-certificates'),
        apiRequest<{ orders: Order[] }>('/api/orders/my-orders'),
        apiRequest<{ courses: Course[] }>('/api/wishlist'),
      ]);

      setEnrolledCourses(coursesRes.courses);
      setCertificates(certsRes.certificates);
      setOrders(ordersRes.orders);
      setWishlist(wishRes.courses);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfileName(name);
      showToast('Profile name updated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRemoveWishlist = async (courseId: string) => {
    try {
      await apiRequest('/api/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      setWishlist((prev) => prev.filter((c) => c.id !== courseId));
      showToast('Removed from wishlist.', 'info');
    } catch {
      showToast('Failed to update wishlist.', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'My Courses', count: enrolledCourses.length },
    { id: 'certificates', label: 'Certificates', count: certificates.length },
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'wishlist', label: 'Wishlist', count: wishlist.length },
    { id: 'profile', label: 'Profile & Security' },
  ];

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            {brandName} {tagline} Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <strong className="text-white">{user?.name}</strong>. Track your progress and credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(user?.role === 'ADMIN' || user?.id === 'Bj7qBJUBTvY97fQFAn1wpZEATUq2' || (user?.email || '').toLowerCase() === 'ashishbarele45@gmail.com') && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin')}
              className="bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
            >
              <Shield className="w-4 h-4 mr-1.5 text-amber-400" />
              Go to Admin Panel
            </GlassButton>
          )}
          <GlassButton variant="outline" size="sm" onClick={() => navigate('/courses')}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Browse More Courses
          </GlassButton>
        </div>
      </div>

      {/* iOS Segmented Bubble Tabs navigation */}
      <div className="mb-8 overflow-x-auto pb-1">
        <GlassTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          {/* Real Metrics Bubble Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <GlassCard interactive={false} className="p-7 rounded-[28px]">
              <span className="text-xs text-slate-400 font-medium">Enrolled Courses</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {enrolledCourses.length}
              </div>
            </GlassCard>

            <GlassCard interactive={false} className="p-7 rounded-[28px]">
              <span className="text-xs text-slate-400 font-medium">Certificates Earned</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {certificates.length}
              </div>
            </GlassCard>

            <GlassCard interactive={false} className="p-7 rounded-[28px]">
              <span className="text-xs text-slate-400 font-medium">Total Orders Placed</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {orders.length}
              </div>
            </GlassCard>
          </div>

          {/* Quick Continue Learning */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Continue Learning
            </h3>

            {enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledCourses.slice(0, 3).map((c) => (
                  <GlassCard key={c.id} interactive={false} className="p-5 rounded-[28px] flex flex-col justify-between">
                    <div>
                      <div className="aspect-video w-full rounded-[20px] overflow-hidden bg-[#111317] mb-3">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-slate-500" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{c.instructor}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/8">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Progress</span>
                        <span className="text-white font-semibold">{c.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-3.5">
                        <div
                          className="h-full bg-white rounded-full transition-all"
                          style={{ width: `${c.progressPercent}%` }}
                        />
                      </div>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/courses/${c.slug}/learn`)}
                      >
                        <PlayCircle className="w-4 h-4 mr-1.5" />
                        Continue
                      </GlassButton>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="p-10 rounded-[28px] bg-white/[0.02] border border-white/10 text-center">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">No courses yet</h4>
                <p className="text-xs text-slate-400">Enroll in a course to start learning practical skills.</p>
                <div className="mt-4">
                  <GlassButton variant="primary" size="sm" onClick={() => navigate('/courses')}>
                    Explore Courses
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MY COURSES */}
      {activeTab === 'courses' && (
        <div>
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((c) => (
                <GlassCard key={c.id} interactive={false} className="p-5 rounded-[28px] flex flex-col justify-between">
                  <div>
                    <div className="aspect-video w-full rounded-[20px] overflow-hidden bg-[#111317] mb-3">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{c.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{c.instructor}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/8">
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>Completed</span>
                      <span className="text-white font-semibold">
                        {c.completedLessons} / {c.totalLessons} lessons ({c.progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-3.5">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${c.progressPercent}%` }}
                      />
                    </div>
                    <GlassButton
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/courses/${c.slug}/learn`)}
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      Resume Learning
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-[32px] bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No courses yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                You haven't enrolled in any courses yet.
              </p>
              <div className="mt-5">
                <GlassButton variant="primary" size="sm" onClick={() => navigate('/courses')}>
                  Explore Courses
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div>
          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificates.map((cert) => (
                <GlassCard key={cert.id} interactive={false} className="p-7 rounded-[28px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-full bg-white/10 text-white">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-slate-300">
                        {cert.certificateCode}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {cert.courseTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Awarded to {cert.studentName || user?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Issued on {new Date(cert.issueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/8 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/verify-certificate/${cert.certificateCode}`)}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Verify Public Registry
                    </button>

                    <GlassButton
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/verify-certificate/${cert.certificateCode}`)}
                    >
                      View Certificate
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-[32px] bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto">
              <Award className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No certificates issued yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Certificates are unlocked and issued automatically once you complete 100% of a course's curriculum.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {orders.length > 0 ? (
            <GlassTable headers={['Order ID', 'Course Title', 'Amount', 'Provider', 'Status', 'Date']}>
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">{o.id}</td>
                  <td className="py-3 px-4 text-xs font-medium text-white">{o.courseTitle}</td>
                  <td className="py-3 px-4 text-xs font-bold text-white">
                    ₹{o.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{o.paymentProvider}</td>
                  <td className="py-3 px-4 text-xs">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        o.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                          : o.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </GlassTable>
          ) : (
            <div className="p-16 rounded-[32px] bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto">
              <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No orders yet.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your completed transactions and invoices will be recorded here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. WISHLIST */}
      {activeTab === 'wishlist' && (
        <div>
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((c) => (
                <GlassCard key={c.id} interactive={false} className="p-5 rounded-[28px] flex flex-col justify-between">
                  <div>
                    <div className="aspect-video w-full rounded-[20px] overflow-hidden bg-[#111317] mb-3">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{c.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{c.instructor}</p>
                    <div className="mt-2 text-base font-bold text-white">
                      ₹{c.finalPrice.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/8 flex items-center gap-2">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/courses/${c.slug}`)}
                    >
                      View Course
                    </GlassButton>
                    <button
                      onClick={() => handleRemoveWishlist(c.id)}
                      className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-rose-500/20 border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer active:scale-95"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-[32px] bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto">
              <Heart className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Your wishlist is empty.</h3>
              <p className="text-xs text-slate-400 mt-1">
                Save courses you want to enroll in later.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <GlassCard interactive={false} className="p-7 rounded-[28px]">
            <h3 className="text-base font-bold text-white mb-4">
              Profile Details
            </h3>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <GlassInput
                pill
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <GlassInput
                pill
                label="Email Address"
                value={user?.email || ''}
                disabled
                helperText="Account email cannot be modified."
              />

              <div className="pt-2">
                <GlassButton variant="primary" size="sm" type="submit" isLoading={profileLoading}>
                  Save Profile
                </GlassButton>
              </div>
            </form>
          </GlassCard>

          <GlassCard interactive={false} className="p-7 rounded-[28px]">
            <h3 className="text-base font-bold text-white mb-4">
              Security & Password
            </h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <GlassInput
                pill
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <GlassInput
                pill
                label="New Password"
                type="password"
                placeholder="•••••••• (Min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <div className="pt-2">
                <GlassButton variant="secondary" size="sm" type="submit" isLoading={passwordLoading}>
                  Update Password
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
