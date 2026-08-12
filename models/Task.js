import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
});

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  assignedMemberId: { type: String, required: true },
  assignedMemberName: { type: String, required: true },
  createdById: { type: String, required: true },
  createdByName: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'], default: 'TODO' },
  dueDate: { type: String, required: true },
  comments: [commentSchema]
}, { timestamps: true });

export const TaskModel = mongoose.model('Task', taskSchema);
