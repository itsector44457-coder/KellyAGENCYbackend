import mongoose from 'mongoose';

const PasswordResetOtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  userType: { type: String, required: true, enum: ['TEAM', 'AGENT', 'CLIENT'] },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

PasswordResetOtpSchema.index({ email: 1, userType: 1 }, { unique: true });

export const PasswordResetOtpModel = mongoose.model('PasswordResetOtp', PasswordResetOtpSchema);
