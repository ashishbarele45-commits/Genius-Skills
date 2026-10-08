import crypto from 'crypto';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'file:./genius_skills.db';
export const db = createClient({
  url: dbUrl,
});

export async function initDatabase() {
  // Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Categories table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Courses table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT,
      full_description TEXT,
      category_id TEXT,
      instructor TEXT,
      thumbnail TEXT,
      price REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      level TEXT NOT NULL DEFAULT 'All Levels',
      language TEXT NOT NULL DEFAULT 'English',
      duration TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      featured INTEGER NOT NULL DEFAULT 0,
      certificate_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Modules table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Lessons table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_source TEXT,
      duration TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      free_preview INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Enrollments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      enrolled_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    )
  `);

  // Lesson progress table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, lesson_id)
    )
  `);

  // Orders table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      payment_provider TEXT NOT NULL DEFAULT 'RAZORPAY',
      payment_id TEXT,
      status TEXT NOT NULL DEFAULT 'CREATED',
      coupon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Payments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Coupons table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'PERCENTAGE',
      value REAL NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 100,
      used_count INTEGER NOT NULL DEFAULT 0,
      expiry_date TEXT,
      minimum_amount REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);

  // Reviews table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    )
  `);

  // Wishlist table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    )
  `);

  // Certificates table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      certificate_code TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      verification_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, course_id)
    )
  `);

  // Contact submissions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Site settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Media Slides table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS media_slides (
      id TEXT PRIMARY KEY,
      title TEXT,
      caption TEXT,
      media_type TEXT NOT NULL,
      media_url TEXT NOT NULL,
      thumbnail_url TEXT,
      public_id TEXT,
      poster_public_id TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create indexes for fast lookup
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id)`);

  // Ensure default Admin account exists (never duplicate)
  const existingAdmin = await db.execute({
    sql: 'SELECT id, email FROM users WHERE role = ? LIMIT 1',
    args: ['ADMIN'],
  });

  if (existingAdmin.rows.length === 0) {
    const adminEmail = (process.env.ADMIN_EMAIL || 'ashishbarele45@gmail.com').toLowerCase();
    // Admin authenticates primarily via Firebase Authentication with verified admin custom claims
    const initialPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(24).toString('hex');
    const hash = await bcrypt.hash(initialPassword, 10);
    const now = new Date().toISOString();
    const adminId = 'admin_' + Math.random().toString(36).substring(2, 10);

    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [adminId, 'Platform Administrator', adminEmail, hash, 'ADMIN', now, now],
    });
    console.log(`[Database] Initial Administrator user registered for ${adminEmail}`);
  }

  // Ensure default brand settings exist if not already set
  const brandSettings = [
    ['brand_name', 'GENIUS SKILLS'],
    ['tagline', 'Learn Skills. Build Your Future.'],
    ['hero_heading', 'Learn Skills. Build Your Future.'],
    ['hero_description', 'Practical digital skills: learn website development, proper AI usage, AI-assisted workflows, and ad-free video generation.'],
    ['primary_cta_text', 'Explore Courses'],
    ['contact_email', ''],
    ['support_phone', '7796021948'],
    ['social_twitter', ''],
    ['social_linkedin', ''],
    ['social_github', ''],
    ['faq_list', JSON.stringify([])],
  ];

  for (const [key, value] of brandSettings) {
    const exists = await db.execute({
      sql: 'SELECT key FROM site_settings WHERE key = ? LIMIT 1',
      args: [key],
    });
    if (exists.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO site_settings (key, value) VALUES (?, ?)',
        args: [key, value],
      });
    }
  }

  // Update support phone and clear any private email in site_settings
  await db.execute({
    sql: `UPDATE site_settings SET value = '7796021948' WHERE key = 'support_phone'`,
  });
  await db.execute({
    sql: `UPDATE site_settings SET value = '' WHERE key = 'contact_email' AND value LIKE '%ashish%'`,
  });
}