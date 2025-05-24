import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import mongoose from "mongoose";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "corebase-secret-key";
const JWT_EXPIRES_IN = "7d";

// Generate JWT token
export const generateToken = (userId: string | number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string | number } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware to authenticate requests
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Find user by ID (support both numeric IDs and MongoDB ObjectIDs)
    let user;
    if (typeof decoded.userId === 'string' && mongoose.Types.ObjectId.isValid(decoded.userId)) {
      // For MongoDB ObjectID string
      user = await storage.getUser(decoded.userId as any);
    } else {
      // For numeric ID
      user = await storage.getUser(Number(decoded.userId));
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check user roles
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (roles.length && !roles.includes(user.role)) {
      return res.status(403).json({ 
        message: "Access denied - insufficient permissions" 
      });
    }
    
    next();
  };
};

// Login handler
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Find user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ 
      user: userWithoutPassword, 
      token 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register handler
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      role: role || "viewer"
    });
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      user: userWithoutPassword, 
      token 
    });
    
    // Create activity
    await storage.createActivity({
      userId: newUser.id,
      action: "create",
      entityType: "user",
      entityId: String(newUser.id),
      details: { username: newUser.username }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logout handler
export const logout = (req: Request, res: Response) => {
  try {
    // Clear cookie
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get current user handler
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user info (without password)
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
