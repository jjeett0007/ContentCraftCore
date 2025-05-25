import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
}

export function authenticate(req: AuthenticatedRequest): boolean {
  try {
    // Try to get token from Authorization header or cookie
    let token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
      token = authCookie?.split('=')[1];
    }

    if (!token) {
      return false;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    return true;
  } catch (error) {
    return false;
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<any>) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (!authenticate(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    return handler(req, res);
  };
}

export function requireRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<any>) => {
    return async (req: AuthenticatedRequest, res: VercelResponse) => {
      if (!authenticate(req)) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      
      return handler(req, res);
    };
  };
}