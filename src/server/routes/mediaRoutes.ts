import { Router } from 'express';
import { generateSignature, deleteResource } from '../services/cloudinaryService';
import { requireAdmin, AuthenticatedRequest } from '../auth';

const router = Router();

// Only admin can get upload signatures or delete resources
router.use(requireAdmin);

/**
 * GET /api/media/sign
 * Generates a signature for secure Cloudinary uploads.
 */
router.get('/sign', (req: AuthenticatedRequest, res) => {
  try {
    const { folder } = req.query;
    const params = generateSignature(folder as string || 'genius-skills');
    return res.json(params);
  } catch (error) {
    console.error('Signature generation error:', error);
    return res.status(500).json({ error: 'Failed to generate upload signature.' });
  }
});

/**
 * DELETE /api/media/:publicId
 * Deletes a resource from Cloudinary.
 */
router.delete('/:publicId', async (req: AuthenticatedRequest, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required.' });
    }
    const result = await deleteResource(publicId);
    return res.json({ success: true, result });
  } catch (error) {
    console.error('Media deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete media resource.' });
  }
});

export default router;
