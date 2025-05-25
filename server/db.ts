
import { connectToDatabase } from './storage';

// Export the MongoDB connection function
export { connectToDatabase };

// Initialize MongoDB connection
export const initializeDatabase = async () => {
  const connected = await connectToDatabase();
  if (!connected) {
    console.warn("Failed to connect to MongoDB, falling back to memory storage");
  }
  return connected;
};
