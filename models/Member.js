import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, default: "Radha@44457" },
  role: { type: String, required: true },
  department: { type: String, required: true },
  reportsTo: { type: String, default: "Jay Singh Sengar" },
  status: { type: String, enum: ['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'], default: 'AVAILABLE' },
  profileImage: { type: String, required: true },
  bio: { type: String },
  responsibilities: [{ type: String }],
  permissions: [{ type: String }],
  skills: [{ type: String }],
  activeProjectsCount: { type: Number, default: 0 },
  assignedTasksCount: { type: Number, default: 0 },
  completedTasksCount: { type: Number, default: 0 },
  performanceScore: { type: Number, default: 95 },
  privateNotes: [{ type: String }]
}, { timestamps: true });

export const MemberModel = mongoose.model('Member', memberSchema);
