import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanSubject = String(subject || 'General Inquiry').trim();
    const cleanMessage = String(message).trim();

    const id = 'msg_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO contact_submissions (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, cleanName, cleanEmail, cleanSubject, cleanMessage, now],
    });

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. Our team will get back to you shortly.',
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

export default router;
