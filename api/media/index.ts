
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseFormData(req: VercelRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
}

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const media = await storage.getMedia();
      res.status(200).json(media);
    } else if (req.method === 'POST') {
      try {
        const { files } = await parseFormData(req);
        
        if (!files || !files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
        
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
        
        if (!allowedTypes.includes(uploadedFile.mimetype || '')) {
          return res.status(400).json({ message: "File type not supported" });
        }
        
        // Check file size (10MB limit)
        if (uploadedFile.size > 10 * 1024 * 1024) {
          return res.status(400).json({ message: "File size too large (max 10MB)" });
        }
        
        // Read file buffer
        const fileBuffer = readFileSync(uploadedFile.filepath);
        
        // Upload to Vercel Blob
        const blob = await put(uploadedFile.originalFilename || 'untitled', fileBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });
        
        // Save media to database
        const media = await storage.createMedia({
          name: uploadedFile.originalFilename || 'untitled',
          url: blob.url,
          type: uploadedFile.mimetype || 'application/octet-stream',
          size: uploadedFile.size,
          uploadedBy: req.user!.userId,
        });
        
        // Create activity log
        await storage.createActivity({
          userId: req.user!.userId,
          action: 'upload',
          entityType: 'media',
          entityId: media.id?.toString() || '',
          details: { filename: media.name }
        });

        res.status(201).json(media);
      } catch (uploadError) {
        console.error("Upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload file" });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
