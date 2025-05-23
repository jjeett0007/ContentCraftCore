import { storage } from './storage';
import bcrypt from 'bcryptjs';
import { User } from './models';
import mongoose from 'mongoose';
import { setMongoDBConnected } from './storage';

/**
 * Seeds the database with initial data like an admin user
 */
export const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://support:8L8VbabHqthCsJrk@cluster0.idavw.mongodb.net/Corebase";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding");
    setMongoDBConnected(true);

    // Check if admin user exists
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};