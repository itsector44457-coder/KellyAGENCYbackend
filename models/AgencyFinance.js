import mongoose from 'mongoose';

const agencyFinanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['CLIENT_PAYMENT', 'SALARIES_PAYROLL', 'AD_CAMPAIGN', 'OFFICE_RENT', 'SOFTWARE_TOOLS', 'TAXES', 'MISC_EXPENSE'], 
    default: 'MISC_EXPENSE' 
  },
  amount: { type: Number, required: true },
  party: { type: String, default: 'General' },
  date: { type: String, required: true },
  paymentMethod: { type: String, default: 'BANK_TRANSFER' },
  notes: { type: String },
  recordedBy: { type: String }
}, { timestamps: true });

export const AgencyFinanceModel = mongoose.model('AgencyFinance', agencyFinanceSchema);
