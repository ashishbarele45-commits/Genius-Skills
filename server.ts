import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './src/server/db';
import { initAdminClaims } from './src/server/firebaseAdmin';

import authRoutes from './src/server/routes/authRoutes';
import courseRoutes from './src/server/routes/courseRoutes';
import categoryRoutes from './src/server/routes/categoryRoutes';
import enrollmentRoutes from './src/server/routes/enrollmentRoutes';
import progressRoutes from './src/server/routes/progressRoutes';
import orderRoutes from './src/server/routes/orderRoutes';
import couponRoutes from './src/server/routes/couponRoutes';
import reviewRoutes from './src/server/routes/reviewRoutes';
import wishlistRoutes from './src/server/routes/wishlistRoutes';
import certificateRoutes from './src/server/routes/certificateRoutes';
import contactRoutes from './src/server/routes/contactRoutes';
import siteSettingsRoutes from './src/server/routes/siteSettingsRoutes';
import adminRoutes from './src/server/routes/adminRoutes';
import mediaRoutes from './src/server/routes/mediaRoutes';
import mediaSlideRoutes from './src/server/routes/mediaSlideRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'public')));

// Initialize database schema and admin account
await initDatabase();
await initAdminClaims();

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', siteSettingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api', mediaSlideRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GENIUS SKILLS' });
});

// Setup Vite in Dev or serve build in Production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[GENIUS SKILLS] Platform running on http://0.0.0.0:${PORT}`);
});
