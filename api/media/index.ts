import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const { page = 1, limit = 20, type } = req.query;
      const filters = type ? { type } : {};
      
      const media = await storage.getMediaList(filters);
      res.status(200).json(media);
    } else if (req.method === 'POST') {
      // For now, return a placeholder response
      // In a real implementation, you'd handle file uploads here
      const mediaData = {
        filename: req.body.filename || 'placeholder.jpg',
        originalName: req.body.originalName || 'placeholder.jpg',
        mimetype: req.body.mimetype || 'image/jpeg',
        size: req.body.size || 0,
        url: req.body.url || '/placeholder.jpg',
        uploadedBy: req.user!.userId
      };

      const media = await storage.createMedia(mediaData);
      
      // Create activity log
      await storage.createActivity({
        userId: req.user!.userId,
        action: 'upload',
        entityType: 'media',
        entityId: media.id.toString(),
        details: { filename: media.filename }
      });

      res.status(201).json(media);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});