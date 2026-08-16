import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  referralCode: { type: String, required: true, unique: true },
  isEmailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'PENDING', 'SUSPENDED'], default: 'ACTIVE' },
  commissionRatePercent: { type: Number, default: 10 },
  walletBalance: { type: Number, default: 0 },
  pendingPipelineAmount: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  totalLifetimeEarned: { type: Number, default: 0 },
  payoutDetails: {
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' },
  },
  createdAt: { type: Date, default: Date.now },
});

export const AgentModel = mongoose.model('Agent', AgentSchema);
