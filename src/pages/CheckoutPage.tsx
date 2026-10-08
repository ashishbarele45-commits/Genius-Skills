import React, { useEffect, useState } from 'react';
import { Course } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassInput } from '../components/ui/glass/GlassInput';
import {
  Tag,
  CreditCard,
  Lock,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

interface CheckoutPageProps {
  courseId: string;
  navigate: (route: string) => void;
  onOpenAuth: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  courseId,
  navigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await apiRequest<{ courses: Course[] }>('/api/courses');
        const found = res.courses.find((c) => c.id === courseId);
        if (found) {
          setCourse(found);
        } else {
          const detailsRes = await apiRequest<{ course: Course }>(`/api/courses/${courseId}`);
          setCourse(detailsRes.course);
        }
      } catch (err) {
        console.error('Checkout fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const basePrice = course ? Math.max(0, course.price - course.discount) : 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - couponDiscount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await apiRequest('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode,
          courseId: course?.id,
        }),
      });

      if (res.valid) {
        setAppliedCoupon(res.coupon);
        showToast(`Coupon ${res.coupon.code} applied! Saved ₹${res.coupon.discountAmount}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid or expired coupon code.', 'error');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!course) return;

    setIsProcessing(true);

    try {
      const orderData = await apiRequest('/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          courseId: course.id,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      if (orderData.isFree) {
        showToast('Successfully enrolled in course!', 'success');
        navigate(`/courses/${course.slug}/learn`);
        return;
      }

      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.amountInSubunits,
        currency: orderData.currency,
        name: 'GENIUS SKILLS',
        description: `Enrollment: ${course.title}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: orderData.userName,
          email: orderData.userEmail,
        },
        theme: {
          color: '#08090a',
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await apiRequest('/api/orders/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: orderData.orderId,
                razorpayOrderId: response.razorpay_order_id || orderData.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyRes.success) {
              showToast('Payment verified! Course successfully unlocked.', 'success');
              navigate(`/courses/${course.slug}/learn`);
            }
          } catch (err: any) {
            showToast(err.message || 'Payment verification failed.', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', (response: any) => {
          showToast(response.error?.description || 'Payment failed.', 'error');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        showToast('Razorpay payment gateway could not be loaded. Please ensure checkout.razorpay.com is reachable.', 'error');
        setIsProcessing(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete checkout.', 'error');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-1/4 bg-white/[0.04] rounded-full" />
        <div className="h-80 w-full bg-white/[0.03] rounded-[32px]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-36 pb-20 px-4 text-center max-w-md mx-auto">
        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10">
          <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Course Not Found</h2>
          <div className="mt-4">
            <GlassButton variant="primary" size="sm" onClick={() => navigate('/courses')}>
              Back to Catalog
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-screen">
      <button
        onClick={() => navigate(`/courses/${course.slug}`)}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Course Overview
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">
          Checkout & Enrollment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your course selection and complete enrollment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Course Summary & Coupon (2 Columns) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <GlassCard interactive={false} className="p-7 rounded-[28px]">
            <h3 className="text-base font-bold text-white mb-4">
              Selected Course
            </h3>

            <div className="flex gap-4 items-center">
              <div className="w-28 h-20 rounded-[20px] overflow-hidden bg-[#111317] border border-white/10 shrink-0">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-slate-500" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {course.title}
                  </h4>
                  {course.instructor && (
                    <p className="text-xs text-slate-400 mt-1">
                      Instructor: {course.instructor}
                    </p>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05]">{course.level}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05]">Lifetime Access</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Coupon Code Section */}
          <GlassCard interactive={false} className="p-7 rounded-[28px]">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-slate-300" />
              <h3 className="text-sm font-bold text-white">
                Apply Coupon Code
              </h3>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="flex-1">
                <GlassInput
                  pill
                  placeholder="e.g. SKILLS2026"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
              </div>
              <GlassButton
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={couponLoading}
              >
                Apply
              </GlassButton>
            </form>

            {appliedCoupon && (
              <div className="mt-3.5 flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-full">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Coupon <strong>{appliedCoupon.code}</strong> applied!
                </span>
                <span className="font-bold">-₹{appliedCoupon.discountAmount}</span>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Order Summary & Payment Button (1 Column) */}
        <div className="md:col-span-1">
          <GlassCard interactive={false} className="p-7 rounded-[32px] flex flex-col gap-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Order Summary
            </h3>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300 border-b border-white/10 pb-4">
              <div className="flex justify-between">
                <span>Course Price</span>
                <span className="text-white font-semibold">₹{course.price.toLocaleString('en-IN')}</span>
              </div>

              {course.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Special Discount</span>
                  <span>-₹{course.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total Amount</span>
              <span className="text-2xl font-extrabold text-white">
                ₹{finalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <GlassButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handlePayment}
              isLoading={isProcessing}
            >
              {finalPrice === 0 ? (
                'Enroll for Free'
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Razorpay
                </>
              )}
            </GlassButton>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-Bit Encrypted Payment with Razorpay</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
