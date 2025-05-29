import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, type AuthenticatedRequest } from '../../lib/auth-middleware';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { put } from '@vercel/blob';
// import formidable from 'formidable';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export default requireAuth(async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const media = await storage.getMedia();
      res.status(200).json(media);
    } else if (req.method === 'POST') {
      try {
        // Parse the form data
        // const form = formidable({
        //   maxFileSize: 50 * 1024 * 1024, // 50MB
        // });

        // const [fields, files] = await form.parse(req);
        // const file = Array.isArray(files.file) ? files.file[0] : files.file;

        const { file, name, mimetype, size } = req.body;

        if (!mimetype) {
          return res.status(400).json({ message: "No mimetype uploaded" });
        }

        // console.log('Upload request received:', {
        //   fileName: file.originalFilename,
        //   fileSize: file.size,
        //   mimeType: file.mimetype
        // });

        // Validate file type
        const allowedMimeTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm',
          'audio/mp3', 'audio/wav', 'audio/ogg',
          'application/pdf',
          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain'
        ];

        if (!allowedMimeTypes.includes(mimetype || '')) {
          return res.status(400).json({ message: "Invalid file type" });
        }

        // Read file buffer
        const base64Body = file.split(',')[1]; // Remove "data:image/...;base64,"
        const buffer = Buffer.from(base64Body, 'base64');


        // Upload to Vercel Blob
        const { url } = await put(name || 'unnamed-file', buffer, {
          access: 'public',
        });

        // Save media metadata to database
        const mediaData = {
          name: name || 'unnamed-file',
          url: url,
          type: mimetype?.split('/')[1] || 'unknown',
          size: size || 0,
          uploadedBy: req.user!.userId,
        };

        const media = await storage.createMedia(mediaData);

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