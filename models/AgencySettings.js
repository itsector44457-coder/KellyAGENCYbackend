import mongoose from 'mongoose';

const agencySettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'kelly-agency-settings', unique: true },
  bankName: { type: String, default: 'HDFC Bank' },
  accountName: { type: String, default: 'Kelly Agency Digital Media Private Limited' },
  accountNumber: { type: String, default: '50200084920192' },
  ifscCode: { type: String, default: 'HDFC0001234' },
  upiId: { type: String, default: 'kellyagency@upi' },
  upiQrUrl: { type: String, default: '' },
  companyAddress: { type: String, default: 'Kelly Agency HQ, Connaught Place, New Delhi - 110001' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  contactEmail: { type: String, default: 'finance@kellyagency.in' }
}, { timestamps: true });

export const AgencySettingsModel = mongoose.model('AgencySettings', agencySettingsSchema);
