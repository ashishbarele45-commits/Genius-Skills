import { Router } from 'express';
import { db } from '../db';
import { requireAdmin, AuthenticatedRequest } from '../auth';
import { deleteResource } from '../services/cloudinaryService';
import { adminDb } from '../firebaseAdmin';

const router = Router();

// ==================== PUBLIC ENDPOINT ====================

// GET /api/media-slides - Public active slides
router.get('/media-slides', async (_req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM media_slides WHERE active = 1 ORDER BY order_index ASC, created_at ASC`,
      args: [],
    });

    const slides = result.rows.map((r) => ({
      id: String(r.id),
      title: r.title ? String(r.title) : undefined,
      caption: r.caption ? String(r.caption) : undefined,
      mediaType: String(r.media_type) as 'IMAGE' | 'VIDEO',
      mediaUrl: String(r.media_url),
      thumbnailUrl: r.thumbnail_url ? String(r.thumbnail_url) : undefined,
      publicId: r.public_id ? String(r.public_id) : undefined,
      posterPublicId: r.poster_public_id ? String(r.poster_public_id) : undefined,
      order: Number(r.order_index) || 0,
      active: Boolean(r.active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    return res.json({ slides });
  } catch (error) {
    console.error('Error fetching public media slides:', error);
    return res.status(500).json({ error: 'Failed to retrieve media slides.' });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// GET /api/admin/media-slides - Admin list all slides
router.get('/admin/media-slides', requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT * FROM media_slides ORDER BY order_index ASC, created_at ASC`,
      args: [],
    });

    const slides = result.rows.map((r) => ({
      id: String(r.id),
      title: r.title ? String(r.title) : undefined,
      caption: r.caption ? String(r.caption) : undefined,
      mediaType: String(r.media_type) as 'IMAGE' | 'VIDEO',
      mediaUrl: String(r.media_url),
      thumbnailUrl: r.thumbnail_url ? String(r.thumbnail_url) : undefined,
      publicId: r.public_id ? String(r.public_id) : undefined,
      posterPublicId: r.poster_public_id ? String(r.poster_public_id) : undefined,
      order: Number(r.order_index) || 0,
      active: Boolean(r.active),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    return res.json({ slides });
  } catch (error) {
    console.error('Admin get media slides error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin media slides.' });
  }
});

// POST /api/admin/media-slides - Admin create new slide
router.post('/admin/media-slides', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      caption,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      publicId,
      posterPublicId,
      order,
      active,
    } = req.body;

    if (!mediaType || !mediaUrl) {
      return res.status(400).json({ error: 'mediaType (IMAGE|VIDEO) and mediaUrl are required.' });
    }

    const id = 'slide_' + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();
    const cleanOrder = typeof order === 'number' ? order : 0;
    const cleanActive = active !== false ? 1 : 0;

    await db.execute({
      sql: `INSERT INTO media_slides (id, title, caption, media_type, media_url, thumbnail_url, public_id, poster_public_id, order_index, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title || null,
        caption || null,
        mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        mediaUrl,
        thumbnailUrl || null,
        publicId || null,
        posterPublicId || null,
        cleanOrder,
        cleanActive,
        now,
        now,
      ],
    });

    // Mirror to Firestore collection if available
    try {
      if (adminDb) {
        await adminDb.collection('mediaSlides').doc(id).set({
          id,
          title: title || '',
          caption: caption || '',
          mediaType: mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          mediaUrl,
          thumbnailUrl: thumbnailUrl || '',
          publicId: publicId || '',
          posterPublicId: posterPublicId || '',
          order: cleanOrder,
          active: cleanActive === 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (fsErr) {
      console.warn('Firestore mirror notice for new slide:', fsErr);
    }

    return res.status(201).json({ success: true, slideId: id });
  } catch (error) {
    console.error('Create media slide error:', error);
    return res.status(500).json({ error: 'Failed to create media slide.' });
  }
});

// PUT /api/admin/media-slides/reorder - Reorder slides
router.put('/admin/media-slides/reorder', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { slides } = req.body;
    if (!Array.isArray(slides)) {
      return res.status(400).json({ error: 'slides must be an array of { id, order }' });
    }

    const now = new Date().toISOString();
    for (const item of slides) {
      if (item && item.id) {
        await db.execute({
          sql: `UPDATE media_slides SET order_index = ?, updated_at = ? WHERE id = ?`,
          args: [Number(item.order) || 0, now, String(item.id)],
        });

        try {
          if (adminDb) {
            await adminDb.collection('mediaSlides').doc(String(item.id)).set(
              { order: Number(item.order) || 0, updatedAt: now },
              { merge: true }
            );
          }
        } catch {
          // ignore
        }
      }
    }

    return res.json({ success: true, message: 'Slides reordered successfully.' });
  } catch (error) {
    console.error('Reorder slides error:', error);
    return res.status(500).json({ error: 'Failed to reorder media slides.' });
  }
});

// PUT /api/admin/media-slides/:id - Update slide
router.put('/admin/media-slides/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      caption,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      publicId,
      posterPublicId,
      order,
      active,
    } = req.body;

    const existing = await db.execute({
      sql: `SELECT id FROM media_slides WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Media slide not found.' });
    }

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE media_slides SET
              title = ?, caption = ?, media_type = ?, media_url = ?,
              thumbnail_url = ?, public_id = ?, poster_public_id = ?,
              order_index = ?, active = ?, updated_at = ?
            WHERE id = ?`,
      args: [
        title || null,
        caption || null,
        mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        mediaUrl,
        thumbnailUrl || null,
        publicId || null,
        posterPublicId || null,
        Number(order) || 0,
        active ? 1 : 0,
        now,
        id,
      ],
    });

    try {
      if (adminDb) {
        await adminDb.collection('mediaSlides').doc(id).set(
          {
            title: title || '',
            caption: caption || '',
            mediaType: mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
            mediaUrl,
            thumbnailUrl: thumbnailUrl || '',
            publicId: publicId || '',
            posterPublicId: posterPublicId || '',
            order: Number(order) || 0,
            active: Boolean(active),
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch (fsErr) {
      console.warn('Firestore mirror notice for updated slide:', fsErr);
    }

    return res.json({ success: true, message: 'Slide updated successfully.' });
  } catch (error) {
    console.error('Update slide error:', error);
    return res.status(500).json({ error: 'Failed to update slide.' });
  }
});

// DELETE /api/admin/media-slides/:id - Delete slide
router.delete('/admin/media-slides/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await db.execute({
      sql: `SELECT public_id, poster_public_id, media_type FROM media_slides WHERE id = ? LIMIT 1`,
      args: [id],
    });

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const pubId = row.public_id ? String(row.public_id) : null;
      const posterPubId = row.poster_public_id ? String(row.poster_public_id) : null;
      const mediaType = String(row.media_type) as 'IMAGE' | 'VIDEO';

      // Clean up Cloudinary asset if possible
      if (pubId) {
        try {
          await deleteResource(pubId, mediaType === 'VIDEO' ? 'video' : 'image');
        } catch (cErr) {
          console.warn('Cloudinary cleanup notice:', cErr);
        }
      }
      if (posterPubId) {
        try {
          await deleteResource(posterPubId, 'image');
        } catch (cErr) {
          console.warn('Cloudinary poster cleanup notice:', cErr);
        }
      }
    }

    await db.execute({
      sql: `DELETE FROM media_slides WHERE id = ?`,
      args: [id],
    });

    try {
      if (adminDb) {
        await adminDb.collection('mediaSlides').doc(id).delete();
      }
    } catch {
      // ignore
    }

    return res.json({ success: true, message: 'Slide deleted successfully.' });
  } catch (error) {
    console.error('Delete slide error:', error);
    return res.status(500).json({ error: 'Failed to delete slide.' });
  }
});

export default router;
