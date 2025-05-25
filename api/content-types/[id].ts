import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { insertContentTypeSchema } from '../../shared/schema';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    const { id } = req.query;
    const contentTypeId = parseInt(id as string);

    if (isNaN(contentTypeId)) {
      return res.status(400).json({ message: 'Invalid content type ID' });
    }

    if (req.method === 'GET') {
      const contentType = await storage.getContentType(contentTypeId);
      if (!contentType) {
        return res.status(404).json({ message: 'Content type not found' });
      }
      res.status(200).json(contentType);
    } else if (req.method === 'PUT') {
      const updateData = insertContentTypeSchema.partial().parse(req.body);
      const contentType = await storage.updateContentType(contentTypeId, updateData);
      
      if (!contentType) {
        return res.status(404).json({ message: 'Content type not found' });
      }

      // Create activity log
      await storage.createActivity({
        userId: req.user!.userId,
        action: 'update',
        entityType: 'content_type',
        entityId: contentType.id.toString(),
        details: { displayName: contentType.displayName }
      });

      res.status(200).json(contentType);
    } else if (req.method === 'DELETE') {
      const success = await storage.deleteContentType(contentTypeId);
      
      if (!success) {
        return res.status(404).json({ message: 'Content type not found' });
      }

      // Create activity log
      await storage.createActivity({
        userId: req.user!.userId,
        action: 'delete',
        entityType: 'content_type',
        entityId: contentTypeId.toString()
      });

      res.status(204).end();
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Content type error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});