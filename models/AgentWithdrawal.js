import mongoose from 'mongoose';

const AgentWithdrawalSchema = new mongoose.Schema({
  withdrawalId: { type: String, required: true, unique: true },
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  agentEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  payoutMethod: { type: String, enum: ['UPI', 'BANK_TRANSFER'], default: 'UPI' },
  payoutDetails: {
    accountHolderName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED_AND_PAID', 'REJECTED'],
    default: 'PENDING_APPROVAL'
  },
  utrNumber: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  processedBy: { type: String, default: '' }
});

export const AgentWithdrawalModel = mongoose.model('AgentWithdrawal', AgentWithdrawalSchema);
