import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../server/storage';
import { storage } from '../../server/storage';
import { insertUserSchema } from '../../shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Create user with plain password (will be hashed in storage layer)
    const userData = insertUserSchema.parse({
      username,
      password,
      role
    });

    const user = await storage.createUser(userData);

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}