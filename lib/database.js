import mongoose from 'mongoose';
import config from '../config.js';

const userSchema = new mongoose.Schema({
  jid: { type: String, unique: true, required: true },
  messages: { type: Number, default: 0 },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
}, { versionKey: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export async function connectDB() {
  if (!config.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Copy .env.example to .env and add your MongoDB URI.');
  }
  await mongoose.connect(config.MONGO_URI);
  console.log('✅ MongoDB connected');
}

export async function saveUser(jid) {
  await User.findOneAndUpdate(
    { jid },
    {
      $inc: { messages: 1 },
      $set: { lastSeen: new Date() },
      $setOnInsert: { firstSeen: new Date() }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function getStats() {
  const [users, totals] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: null, messages: { $sum: '$messages' } } }])
  ]);
  return { users, messages: totals[0]?.messages || 0 };
}
