import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

// Validate coupon for a course and amount
router.post('/validate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { code, courseId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();

    // Fetch course
    const courseRes = await db.execute({
      sql: 'SELECT id, price, discount FROM courses WHERE id = ? LIMIT 1',
      args: [courseId],
    });

    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const course = courseRes.rows[0];
    const basePrice = Math.max(0, Number(course.price) - Number(course.discount));

    // Fetch coupon
    const couponRes = await db.execute({
      sql: 'SELECT * FROM coupons WHERE code = ? LIMIT 1',
      args: [cleanCode],
    });

    if (couponRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code.' });
    }

    const coupon = couponRes.rows[0];

    if (!coupon.active) {
      return res.status(400).json({ error: 'This coupon is inactive.' });
    }

    if (Number(coupon.used_count) >= Number(coupon.max_uses)) {
      return res.status(400).json({ error: 'This coupon has reached its maximum usage limit.' });
    }

    if (coupon.expiry_date) {
      const expiry = new Date(String(coupon.expiry_date));
      if (expiry < new Date()) {
        return res.status(400).json({ error: 'This coupon has expired.' });
      }
    }

    if (basePrice < Number(coupon.minimum_amount)) {
      return res.status(400).json({
        error: `Coupon requires a minimum order amount of ₹${coupon.minimum_amount}.`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (basePrice * Number(coupon.value)) / 100;
    } else {
      discountAmount = Number(coupon.value);
    }

    discountAmount = Math.min(discountAmount, basePrice);
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount: Math.round(discountAmount),
        finalPrice: Math.round(finalPrice),
      },
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return res.status(500).json({ error: 'Failed to validate coupon.' });
  }
});

export default router;
