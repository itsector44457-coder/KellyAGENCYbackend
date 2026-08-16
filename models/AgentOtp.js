import mongoose from 'mongoose';

const AgentOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const AgentOtpModel = mongoose.model('AgentOtp', AgentOtpSchema);
