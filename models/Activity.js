import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  actorId: { type: String, required: true },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  target: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const ActivityModel = mongoose.model('Activity', activitySchema);
