import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, requireAuth, AuthenticatedRequest } from '../auth';
import { adminAuth } from '../firebaseAdmin';

const router = Router();

// Sync admin custom claim admin: true for ONLY the authorized admin account
router.post('/sync-admin-claim', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const AUTHORIZED_ADMIN_EMAILS = [
      'admin.geniusskills@gmail.com',
      'ashishbarele45@gmail.com',
    ];
    const AUTHORIZED_ADMIN_UIDS = [
      'PJc1v6mqLXh4qk757GW5eVtEJmS2',
    ];

    let uid = '';
    let email = '';

    try {
      const decoded = await adminAuth.verifyIdToken(token);
      email = (decoded.email || '').toLowerCase();
      uid = decoded.uid;
    } catch {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload.iss === 'https://securetoken.google.com/genius-course' || payload.aud === 'genius-course') {
            uid = payload.user_id || payload.sub;
            email = (payload.email || '').toLowerCase();
          }
        }
      } catch {
        // failed parse
      }
    }

    // Strictly check authorized admin UID or email
    if ((AUTHORIZED_ADMIN_UIDS.includes(uid) || AUTHORIZED_ADMIN_EMAILS.includes(email)) && uid) {
      let claimsProvisioned = false;
      try {
        await adminAuth.setCustomUserClaims(uid, {
          admin: true,
          role: 'ADMIN',
        });
        claimsProvisioned = true;
      } catch (err: any) {
        console.warn('[sync-admin-claim] Set claims notice:', err.message);
      }
      return res.json({
        success: true,
        message: 'Admin account verified.',
        claimsProvisioned,
        uid,
        email,
        role: 'ADMIN',
      });
    }

    return res.status(403).json({ error: '403 Forbidden: Account is not authorized for administrator access.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to sync admin claim.' });
  }
});

// Register a new student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? LIMIT 1',
      args: [cleanEmail],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const id = 'user_' + Math.random().toString(36).substring(2, 12);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, cleanName, cleanEmail, passwordHash, 'STUDENT', now, now],
    });

    const token = generateToken({ id, email: cleanEmail, role: 'STUDENT' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: { id, name: cleanName, email: cleanEmail, role: 'STUDENT' },
      token,
      message: 'Account registered successfully.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const result = await db.execute({
      sql: 'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      args: [cleanEmail],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRow = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, String(userRow.password_hash));

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: String(userRow.id),
      name: String(userRow.name),
      email: String(userRow.email),
      role: String(userRow.role) as 'STUDENT' | 'ADMIN',
    };

    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user,
      token,
      message: 'Logged in successfully.',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});

// Get current user session
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// Update profile name
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    const cleanName = String(name).trim();
    const now = new Date().toISOString();

    await db.execute({
      sql: 'UPDATE users SET name = ?, updated_at = ? WHERE id = ?',
      args: [cleanName, now, req.user!.id],
    });

    req.user!.name = cleanName;
    return res.json({ user: req.user, message: 'Profile updated successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Change password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const result = await db.execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [req.user!.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentHash = String(result.rows[0].password_hash);
    const match = await bcrypt.compare(currentPassword, currentHash);
    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      args: [newHash, now, req.user!.id],
    });

    return res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
