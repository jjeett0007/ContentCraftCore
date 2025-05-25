# Vercel-Compatible CMS

A modern, flexible Content Management System built with React, TypeScript, and MongoDB, optimized for deployment on Vercel.

## Key Features

✅ **Vercel-Ready Architecture**
- Serverless API routes compatible with Vercel functions
- Stateless JWT authentication (no sessions)
- MongoDB integration for scalable data storage
- Static frontend build optimized for CDN delivery

✅ **Modern Tech Stack**
- React 18 with TypeScript
- Tailwind CSS for responsive design
- MongoDB with Mongoose ODM
- JWT-based authentication
- React Query for state management

✅ **CMS Capabilities**
- Dynamic content type creation
- Media management with file uploads
- User role management (admin/user)
- Activity logging and audit trails
- RESTful API for content operations

## Deployment to Vercel

### Prerequisites
1. A Vercel account
2. A MongoDB Atlas database (or other MongoDB hosting)
3. Node.js 18+ installed locally

### Environment Variables
Set these environment variables in your Vercel project:

```bash
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Optional: File Upload (if using Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Deploy Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Vercel-compatible CMS"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will automatically detect the configuration

3. **Set Environment Variables**
   - In your Vercel project settings
   - Add all the environment variables listed above

4. **Deploy**
   - Click "Deploy"
   - Your CMS will be live at `your-project.vercel.app`

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file:
   ```bash
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Content Types
- `GET /api/content-types` - List content types
- `POST /api/content-types` - Create content type
- `GET /api/content-types/[id]` - Get content type
- `PUT /api/content-types/[id]` - Update content type
- `DELETE /api/content-types/[id]` - Delete content type

### Content
- `GET /api/content/[contentType]` - List content entries
- `POST /api/content/[contentType]` - Create content entry
- `GET /api/content/[contentType]/[id]` - Get content entry
- `PUT /api/content/[contentType]/[id]` - Update content entry
- `DELETE /api/content/[contentType]/[id]` - Delete content entry

### Media
- `GET /api/media` - List media files
- `POST /api/media` - Upload media file

### Activity
- `GET /api/activity` - Get activity log

## Key Changes for Vercel Compatibility

1. **Replaced Express Server with Vercel Functions**
   - All routes converted to `/api` serverless functions
   - Each endpoint is a separate function for optimal performance

2. **Stateless JWT Authentication**
   - Removed session-based auth
   - JWT tokens stored in localStorage and HTTP-only cookies
   - Stateless authentication middleware

3. **Removed WebSocket Dependencies**
   - Eliminated real-time features that don't work in serverless
   - Can be replaced with polling or third-party real-time services

4. **Optimized for Cold Starts**
   - Database connections optimized for serverless
   - Minimal function initialization time

## Production Considerations

- **Database Indexing**: Add indexes for frequently queried fields
- **Rate Limiting**: Implement rate limiting for production API
- **File Storage**: Use cloud storage (Cloudinary, AWS S3) for media files
- **Monitoring**: Set up error tracking and performance monitoring
- **Security**: Enable CORS properly and validate all inputs

## Troubleshooting

**Build Errors**: Make sure all environment variables are set in Vercel
**Authentication Issues**: Check JWT_SECRET is properly configured
**Database Connection**: Verify MongoDB connection string and network access
**Function Timeout**: Vercel functions have execution time limits

Your CMS is now ready for scalable deployment on Vercel! 🚀