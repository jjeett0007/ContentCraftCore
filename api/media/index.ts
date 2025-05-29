
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { put } from '@vercel/blob';

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const media = await storage.getMedia();
      res.status(200).json(media);
    } else if (req.method === 'POST') {
      try {
        const { file, fileName } = req.body;
        
        console.log('Upload request received:', {
          hasFile: !!file,
          fileType: typeof file,
          fileName,
          fileLength: file ? file.length : 0
        });
        
        if (!file || !fileName) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Validate file type based on filename extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'];
        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({ message: "File type not supported" });
        }
        
        // Convert base64 back to buffer if needed
        let fileBuffer;
        let fileSize;
        
        if (typeof file === 'string') {
          // Handle base64 string
          fileBuffer = Buffer.from(file, 'base64');
          fileSize = fileBuffer.length;
        } else if (file instanceof Buffer) {
          fileBuffer = file;
          fileSize = file.length;
        } else if (file.constructor && file.constructor.name === 'File') {
          // Handle File object directly
          fileBuffer = file;
          fileSize = file.size;
        } else {
          return res.status(400).json({ message: "Invalid file format" });
        }
        
        // Check file size (10MB limit)
        if (fileSize > 10 * 1024 * 1024) {
          return res.status(400).json({ message: "File size too large (max 10MB)" });
        }
        
        // Upload to Vercel Blob
        const blob = await put(fileName, fileBuffer, {
          access: 'public',
          addRandomSuffix: true,
        });
        
        // Determine MIME type from extension
        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.mp4': 'video/mp4',
          '.webm': 'video/webm',
          '.mp3': 'audio/mp3',
          '.wav': 'audio/wav',
          '.ogg': 'audio/ogg',
          '.pdf': 'application/pdf',
          '.txt': 'text/plain'
        };
        
        const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';
        
        // Save media to database
        const media = await storage.createMedia({
          name: fileName,
          url: blob.url,
          type: mimeType,
          size: fileSize,
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
