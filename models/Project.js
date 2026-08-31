import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  client: { type: String, required: true },
  clientEmail: { type: String, default: 'client@example.com' },
  clientPhone: { type: String, default: '+91 98765 43210' },
  clientPassword: { type: String }, // Auto-generated password e.g. "RadhaClient#9821"
  clientPortalToken: { type: String, unique: true, sparse: true },
  status: { 
    type: String, 
    enum: ['PLANNING', 'PROPOSAL_SENT', 'PAYMENT_PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'ON_HOLD'], 
    default: 'IN_PROGRESS' 
  },
  startDate: { type: String },
  deadline: { type: String },
  progress: { type: Number, default: 0 },
  description: { type: String },
  price: { type: String, default: '₹25,000' },
  leadId: { type: String },
  members: [{ type: String }],
  memberRoles: { type: Map, of: String },
  
  // 📁 Client Acceptance Package Details
  proposal: {
    overview: { type: String, default: 'High-performance digital platform solution designed by Radha Agency.' },
    features: [{ type: String }],
    pages: [{ type: String }],
    technologies: [{ type: String }],
    timeline: { type: String, default: '3 to 4 Weeks' },
    totalCost: { type: Number, default: 25000 },
    revisionsCount: { type: Number, default: 3 },
    supportPeriod: { type: String, default: '30 Days Post Launch Maintenance' }
  },

  contract: {
    scope: { type: String, default: 'Design, Development, Testing and Deployment of Client Digital Deliverable.' },
    paymentTerms: { type: String, default: '50% Advance Payment required to start work. Remaining 50% upon final signoff before launch.' },
    revisionPolicy: { type: String, default: 'Up to 3 major revision cycles included during active development.' },
    cancellationTerms: { type: String, default: 'Advance payment non-refundable after project work initiation.' },
    clientAccepted: { type: Boolean, default: false },
    acceptedAt: { type: String },
    clientIp: { type: String }
  },

  advancePayment: {
    totalValue: { type: Number, default: 25000 },
    advanceRequiredPercent: { type: Number, default: 50 },
    advanceAmount: { type: Number, default: 12500 },
    remainingAmount: { type: Number, default: 12500 },
    status: { type: String, enum: ['UNPAID', 'PENDING_APPROVAL', 'CONFIRMED'], default: 'UNPAID' },
    utrNumber: { type: String },
    screenshotUrl: { type: String }, // Cloudinary URL or base64
    submittedAt: { type: String },
    approvedAt: { type: String },
    approvedBy: { type: String }
  },

  expenses: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'AD_CAMPAIGN' },
    amount: { type: Number, required: true },
    paidTo: { type: String },
    date: { type: String },
    notes: { type: String },
    createdBy: { type: String }
  }],

  // 📝 Client Content & Assets Checklist
  assetsChecklist: {
    logoUrl: { type: String },
    brandColors: { type: String },
    productPhotosUrl: { type: String },
    sampleProducts: [{
      name: { type: String },
      description: { type: String },
      mrp: { type: String },
      sellingPrice: { type: String },
      sizes: { type: String },
      stock: { type: String },
      category: { type: String }
    }],
    bulkProductsFileUrl: { type: String },
    aboutUsText: { type: String },
    contactInfo: {
      phone: { type: String },
      whatsapp: { type: String },
      email: { type: String },
      address: { type: String }
    },
    policies: { type: String },
    socialLinks: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      other: { type: String }
    },
    domainCredentials: { type: String },
    driveFolderUrl: { type: String },
    additionalNotes: { type: String },
    submittedAt: { type: String }
  }
}, { timestamps: true });

export const ProjectModel = mongoose.model('Project', projectSchema);
