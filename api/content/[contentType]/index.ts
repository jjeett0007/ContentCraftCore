import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../../lib/auth-middleware';
import { connectToDatabase } from '../../../server/storage';
import { storage } from '../../../server/storage';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    const { contentType } = req.query;
    const contentTypeApiId = contentType as string;

    if (req.method === 'GET') {
      const { page = 1, limit = 20, search, ...filters } = req.query;
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        filters
      };

      const content = await storage.getContent(contentTypeApiId, options);
      res.status(200).json(content);
    } else if (req.method === 'POST') {
      const content = await storage.createContent(contentTypeApiId, req.body);
      
      // Create activity log
      await storage.createActivity({
        userId: req.user!.userId,
        action: 'create',
        entityType: 'content',
        entityId: content._id || content.id,
        details: { contentType: contentTypeApiId }
      });

      res.status(201).json(content);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Content error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});