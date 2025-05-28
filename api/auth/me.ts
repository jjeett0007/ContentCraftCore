import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../server/storage";
import { storage } from "../../server/storage";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectToDatabase();

    // Try to get token from Authorization header or cookie
    let token = req.headers.authorization?.replace("Bearer ", "");

    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(";");
      const authCookie = cookies.find((c) =>
        c.trim().startsWith("auth-token="),
      );
      token = authCookie?.split("=")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get user from database
    const user = await storage.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    console.log("user role", user.role);

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Auth check error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
