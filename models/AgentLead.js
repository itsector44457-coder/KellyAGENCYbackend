import mongoose from 'mongoose';

const AgentLeadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  agentId: { type: String, required: true },
  agentName: { type: String, required: true },
  agentEmail: { type: String, required: true },
  agentReferralCode: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: { type: String, required: true },
  companyName: { type: String, default: '' },
  projectTitle: { type: String, required: true },
  projectType: { type: String, default: 'Custom Web / App' },
  projectBudget: { type: Number, required: true },
  requirements: { type: String, default: '' },
  status: {
    type: String,
    enum: [
      'LEAD_SUBMITTED',     // In initial review
      'IN_DISCUSSION',      // Team discussing with client
      'PROPOSAL_SENT',      // Proposal sent to client
      'PROJECT_CONFIRMED',   // Client accepted & advance paid (Commission Unlocked!)
      'IN_PROGRESS',        // Work in progress
      'COMPLETED',          // Project finished
      'LOST_REJECTED'       // Deal lost
    ],
    default: 'LEAD_SUBMITTED'
  },
  commissionRatePercent: { type: Number, default: 10 },
  commissionAmount: { type: Number, required: true },
  commissionStatus: {
    type: String,
    enum: ['LOCKED_IN_PIPELINE', 'WALLET_CREDITED', 'WITHDRAWN'],
    default: 'LOCKED_IN_PIPELINE'
  },
  linkedProjectId: { type: String, default: null },
  submittedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date, default: null },
  notes: { type: String, default: '' }
});

export const AgentLeadModel = mongoose.model('AgentLead', AgentLeadSchema);
