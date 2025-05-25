import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { insertContentTypeSchema } from '../../shared/schema';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const contentTypes = await storage.getContentTypes();
      res.status(200).json(contentTypes);
    } else if (req.method === 'POST') {
      const contentTypeData = insertContentTypeSchema.parse(req.body);
      const contentType = await storage.createContentType(contentTypeData);
      
      // Create activity log
      await storage.createActivity({
        userId: req.user!.userId,
        action: 'create',
        entityType: 'content_type',
        entityId: contentType.id.toString(),
        details: { displayName: contentType.displayName }
      });

      res.status(201).json(contentType);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Content types error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});