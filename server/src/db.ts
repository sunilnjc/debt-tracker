import mongoose from 'mongoose';

export const DEFAULT_URI = 'mongodb://127.0.0.1:27017/budgettracker';

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? DEFAULT_URI;
  await mongoose.connect(uri);
  console.log(`db connected: ${uri}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
