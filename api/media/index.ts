
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { put } from '@vercel/blob';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const { page = 1, limit = 20, type } = req.query;
      const filters = type ? { type } : {};
      
      const media = await storage.getMediaList(filters);
      res.status(200).json(media);
    } else if (req.method === 'POST') {
      // Handle file upload with FormData
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file || !file.name) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return res.status(400).json({ message: "File type not supported" });
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size too large (max 10MB)" });
      }
      
      try {
        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
          access: 'public',
          addRandomSuffix: true,
        });
        
        // Save media to database
        const media = await storage.createMedia({
          name: file.name,
          url: blob.url,
          type: file.type,
          size: file.size,
          uploadedBy: req.user!.userId,
          blobPathname: blob.pathname, // Store blob pathname for deletion
        });
        
        // Create activity log
        await storage.createActivity({
          userId: req.user!.userId,
          action: 'upload',
          entityType: 'media',
          entityId: media.id.toString(),
          details: { filename: media.name }
        });

        res.status(201).json(media);
      } catch (blobError) {
        console.error("Blob upload error:", blobError);
        return res.status(500).json({ message: "Failed to upload file to blob storage" });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
