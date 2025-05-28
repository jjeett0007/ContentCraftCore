
import { connectToDatabase } from './storage';

// Export the MongoDB connection function
export { connectToDatabase };

// Initialize MongoDB connection
export const initializeDatabase = async () => {
  const connected = await connectToDatabase();
  if (!connected) {
    throw new Error("Failed to connect to MongoDB");
  }
  return connected;
};
