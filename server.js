// ============================================================
// KELLY AGENCY — TEAM OS BACKEND SERVER
// DNS SETUP MUST BE FIRST IMPORT (before mongoose/models)
// ============================================================
import './dns-setup.js';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { v2 as cloudinary } from 'cloudinary';

import { sendMemberNotificationEmail, sendClientProjectPortalEmail, sendPaymentApprovalConfirmationEmail } from './services/emailService.js';
import { MemberModel } from './models/Member.js';
import { TaskModel } from './models/Task.js';
import { ProjectModel } from './models/Project.js';
import { ActivityModel } from './models/Activity.js';
import { NotificationModel } from './models/Notification.js';
import { AgencyFinanceModel } from './models/AgencyFinance.js';
import { AgencySettingsModel } from './models/AgencySettings.js';

dotenv.config();

// Frontend URL — set FRONTEND_URL env var on Render to your live frontend URL
// e.g. https://kelly-agency-xyz.vercel.app  or  https://yourdomain.com
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
const PORT = parseInt(process.env.PORT) || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://kellyagency4_db_user:MvSopu3TkK9icr3k@kellyagency.nbcs078.mongodb.net/kellyagency?retryWrites=true&w=majority&appName=KellyAgency';

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.json());

// ============================================================
// ROLE → PERMISSIONS AUTO-MAP
// Detects finance / marketing / tech / ops from role+department text
// ============================================================
function getRolePermissions(role = '', department = '') {
  const r = role.toLowerCase();
  const d = department.toLowerCase();

  if (r.includes('ceo') || r.includes('founder') || r.includes('chief executive')) {
    return ['manage_members','manage_roles','view_financials','view_marketing','view_technology','create_projects','assign_tasks','approve_changes','manage_availability','view_assigned_projects'];
  }
  if (r.includes('coo') || r.includes('operations') || d.includes('operations')) {
    return ['manage_members','create_projects','assign_tasks','view_financials','view_marketing','view_technology','manage_availability','view_assigned_projects'];
  }
  if (r.includes('cfo') || r.includes('finance') || r.includes('financial') || d.includes('finance') || d.includes('financial') || d.includes('accounts')) {
    return ['view_financials','create_projects','view_assigned_projects'];
  }
  if (r.includes('cmo') || r.includes('marketing') || r.includes('growth') || d.includes('marketing') || d.includes('growth') || d.includes('brand')) {
    return ['view_marketing','create_projects','assign_tasks','view_assigned_projects'];
  }
  if (r.includes('dev') || r.includes('engineer') || r.includes('tech') || r.includes('cto') || d.includes('tech') || d.includes('engineering') || d.includes('development') || d.includes('software')) {
    return ['view_technology','create_projects','assign_tasks','view_assigned_projects'];
  }
  if (r.includes('design') || r.includes('creative') || r.includes('ui') || r.includes('ux') || d.includes('design') || d.includes('creative')) {
    return ['assign_tasks','view_assigned_projects'];
  }
  return ['view_assigned_projects'];
}

// ============================================================
// SEED DATA — ONLY JAY SINGH SENGAR (CEO)
// ============================================================
const initialMembersSeed = [
  {
    id: 'jay-singh',
    name: 'Jay Singh Sengar',
    email: 'jay.sengar@kellyagency.in',
    password: 'Jay@kelly2026',
    role: 'Founder & CEO / Creative Director',
    department: 'Leadership',
    reportsTo: 'Board / Strategic Direction',
    status: 'AVAILABLE',
    profileImage: '/assets/founder.jpeg',
    bio: "Leads Kelly Agency's vision, project strategy, and high-value client relationships, ensuring digital solutions align with core business goals.",
    responsibilities: [
      'Company vision & long-term growth',
      'Business strategy & partnerships',
      'Client relationship management',
      'Creative direction & brand identity',
      'High-value decision making & final approvals',
    ],
    permissions: [
      'manage_members',
      'manage_roles',
      'view_financials',
      'view_marketing',
      'view_technology',
      'create_projects',
      'assign_tasks',
      'approve_changes',
      'manage_availability',
    ],
    skills: ['Executive Leadership', 'Brand Strategy', 'Creative Direction', 'Client Negotiation', 'Venture Growth'],
    activeProjectsCount: 0,
    assignedTasksCount: 0,
    completedTasksCount: 0,
    performanceScore: 100,
    privateNotes: ['Key priority: Agency expansion and executive team onboarding.'],
  },
];

// ============================================================
// MONGODB ATLAS CONNECTION WITH AUTO-RETRY
// ============================================================
let isDBConnected = false;

async function connectDB() {
  const options = {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4,                   // Force IPv4 — avoids IPv6 DNS issues on Windows
    maxPoolSize: 10,
  };

  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`🔄 [MongoDB Atlas] Connection attempt ${attempt}/${maxAttempts}...`);
      await mongoose.connect(MONGO_URI, options);
      isDBConnected = true;
      console.log('✅ [MongoDB Atlas] Connected successfully!');

      // Seed / cleanup on first connect
      await seedDatabase();
      return;
    } catch (error) {
      console.warn(`⚠️ [MongoDB Atlas] Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxAttempts) {
        const delay = attempt * 3000; // 3s, 6s, 9s, 12s backoff
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.error('❌ [MongoDB Atlas] All connection attempts failed. Server running in offline mode with seed data.');
}

async function seedDatabase() {
  try {
    // Ensure Jay CEO exists (never wipe other members)
    const ceo = await MemberModel.findOne({ id: 'jay-singh' });
    if (!ceo) {
      await MemberModel.create(initialMembersSeed[0]);
      console.log('✨ [DB Seed] Jay Singh Sengar (CEO) created in MongoDB Atlas.');
    } else {
      // Keep existing data but ensure password & permissions are correct
      await MemberModel.updateOne(
        { id: 'jay-singh' },
        {
          $set: {
            password: 'Jay@kelly2026',
            permissions: initialMembersSeed[0].permissions,
          },
        }
      );
      console.log('✅ [DB Seed] Jay Singh Sengar (CEO) verified in MongoDB Atlas.');
    }

    console.log('🏁 [DB Ready] Production database is clean and ready!');
  } catch (err) {
    console.warn('⚠️ [DB Seed] Seed error:', err.message);
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'OK',
    database: dbState[mongoose.connection.readyState] || 'unknown',
    dbConnected: isDBConnected,
    system: 'Kelly Agency Team OS Backend',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// AUTH — LOGIN
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // If DB is offline, allow CEO login via seed data
    if (!isDBConnected) {
      const ceoSeed = initialMembersSeed.find(
        (m) => m.email === email.toLowerCase().trim() && m.password === password
      );
      if (ceoSeed) {
        const { password: _p, ...safeData } = ceoSeed;
        return res.json({
          success: true,
          token: `token-${ceoSeed.id}-${Date.now()}`,
          member: safeData,
          offlineMode: true,
        });
      }
      return res.status(503).json({ error: 'Database is connecting. Please try again in a moment.' });
    }

    const member = await MemberModel.findOne({ email: email.toLowerCase().trim() });
    if (!member) return res.status(401).json({ error: 'Invalid email or password' });
    if (member.password !== password) return res.status(401).json({ error: 'Invalid email or password' });

    // Log login activity
    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: member.id,
        actorName: member.name,
        action: 'MEMBER_LOGIN',
        target: `Logged into Team OS as ${member.role}`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    const memberData = member.toObject();
    delete memberData.password;

    res.json({ success: true, token: `token-${member.id}-${Date.now()}`, member: memberData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MEMBERS — CRUD
// ============================================================

// GET all members
app.get('/api/members', async (req, res) => {
  try {
    if (!isDBConnected) {
      const safeSeeds = initialMembersSeed.map(({ password: _p, ...m }) => m);
      return res.json(safeSeeds);
    }
    const members = await MemberModel.find({}, '-password').lean();
    res.json(members || []);
  } catch (err) {
    const safeSeeds = initialMembersSeed.map(({ password: _p, ...m }) => m);
    res.json(safeSeeds);
  }
});

// POST create new member (CEO only)
app.post('/api/members', async (req, res) => {
  try {
    const { name, email, password, role, department, responsibilities, permissions, requesterId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Verify requester is CEO or has manage_members permission
    if (isDBConnected) {
      const requester = await MemberModel.findOne({ id: requesterId });
      if (!requester || (!requester.permissions.includes('manage_members') && !requester.role.includes('CEO'))) {
        return res.status(403).json({ error: 'Access Denied: Only CEO can create team members.' });
      }
    }

    const existing = isDBConnected ? await MemberModel.findOne({ email: email.toLowerCase().trim() }) : null;
    if (existing) return res.status(400).json({ error: 'A member with this email already exists' });

    const memberId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newMember = new MemberModel({
      id: memberId,
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      department: department || 'General',
      reportsTo: 'Jay Singh Sengar',
      status: 'AVAILABLE',
      profileImage: '/assets/founder.jpeg',
      bio: `${role} at Kelly Agency.`,
      responsibilities: responsibilities || [role],
      permissions: permissions || getRolePermissions(role, department || 'General'),
      skills: ['Agency Workflow'],
      activeProjectsCount: 0,
      assignedTasksCount: 0,
      completedTasksCount: 0,
      performanceScore: 95,
      privateNotes: [`Added on ${new Date().toLocaleDateString()}`],
    });

    await newMember.save();

    // Log activity
    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: requesterId,
        actorName: 'Jay Singh Sengar',
        action: 'CREATED_MEMBER',
        target: `Added ${newMember.name} as ${newMember.role}`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    // Send welcome email
    try {
      await sendMemberNotificationEmail({
        to: newMember.email,
        subject: `Welcome to Kelly Agency Team OS - Your Credentials`,
        title: `Welcome to the Team, ${newMember.name}!`,
        message: `You have been added to <strong>Kelly Agency Team OS</strong>.`,
        details: `<strong>Role:</strong> ${newMember.role}<br/><strong>Email:</strong> ${newMember.email}<br/><strong>Password:</strong> ${password}`,
        actionUrl: `${FRONTEND_URL}/member-management/login`,
      });
    } catch (_) { /* email failure non-critical */ }

    const memberObj = newMember.toObject();
    delete memberObj.password;

    res.status(201).json({ success: true, member: memberObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update member profile
app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;

    const member = await MemberModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: id,
        actorName: member.name,
        action: 'UPDATED_PROFILE',
        target: `Updated profile for ${member.name}`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    const memberObj = member.toObject();
    delete memberObj.password;
    res.json({ success: true, member: memberObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member (CEO only)
app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'jay-singh') {
      return res.status(403).json({ error: 'Cannot delete primary Founder & CEO account' });
    }
    const member = await MemberModel.findOneAndDelete({ id });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, message: `Member ${member.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PROJECTS — CRUD
// ============================================================

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    if (!isDBConnected) return res.json([]);
    const projects = await ProjectModel.find().sort({ createdAt: -1 }).lean();
    res.json(projects || []);
  } catch (err) {
    res.json([]);
  }
});

// POST create project
app.post('/api/projects', async (req, res) => {
  try {
    const projectData = req.body;
    const projectId = `proj-${Date.now()}`;
    const priceStr = projectData.price || '₹25,000';
    const numericPrice = Number(priceStr.replace(/[^0-9.]/g, '')) || 25000;
    const advancePercent = Number(projectData.advanceRequiredPercent || projectData.advancePercent) || 50;
    const advanceVal = Math.round(numericPrice * (advancePercent / 100));
    const remainingVal = numericPrice - advanceVal;

    const autoPassword = `KellyClient#${Math.floor(1000 + Math.random() * 9000)}`;
    const portalToken = `portal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newProject = new ProjectModel({
      id: projectId,
      title: projectData.title,
      client: projectData.client,
      clientEmail: projectData.clientEmail || `${projectData.client.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`,
      clientPhone: projectData.clientPhone || '+91 98765 43210',
      clientPassword: autoPassword,
      clientPortalToken: portalToken,
      status: projectData.status || 'PROPOSAL_SENT',
      startDate: projectData.startDate || new Date().toISOString().split('T')[0],
      deadline: projectData.deadline || '4 Weeks',
      progress: projectData.progress || 0,
      description: projectData.description || '',
      price: priceStr,
      advanceRequiredPercent: advancePercent,
      leadId: projectData.leadId || 'jay-singh',
      members: projectData.members || ['jay-singh'],
      memberRoles: projectData.memberRoles || {},
      proposal: {
        overview: projectData.proposal?.overview || `${projectData.title} custom digital solution developed by Kelly Agency.`,
        features: projectData.proposal?.features || ['Responsive Web App UI', 'Fast Backend API Integration', 'SEO & Analytics Setup'],
        pages: projectData.proposal?.pages || ['Home Page', 'Services Page', 'Client Dashboard / Portal', 'Contact & Lead Booking'],
        technologies: projectData.proposal?.technologies || ['React', 'Node.js', 'MongoDB Atlas', 'Tailwind CSS'],
        timeline: projectData.proposal?.timeline || '3 to 4 Weeks',
        totalCost: numericPrice,
        revisionsCount: projectData.proposal?.revisionsCount || 3,
        supportPeriod: projectData.proposal?.supportPeriod || '30 Days Post-Launch Maintenance'
      },
      contract: {
        scope: 'Design, Development, Quality Assurance and Production Deployment.',
        paymentTerms: `${advancePercent}% Advance Payment upon Contract Acceptance. ${100 - advancePercent}% Balance upon final delivery.`,
        revisionPolicy: 'Up to 3 major revision cycles included during development.',
        cancellationTerms: 'Advance payment non-refundable after work initiation.',
        clientAccepted: false,
      },
      advancePayment: {
        totalValue: numericPrice,
        advanceRequiredPercent: advancePercent,
        advanceAmount: advanceVal,
        remainingAmount: remainingVal,
        status: 'UNPAID'
      }
    });

    await newProject.save();

    // Auto-dispatch Client Acceptance Package Portal Email
    const portalUrl = `${FRONTEND_URL}/client-portal/${portalToken}`;
    const clientLoginUrl = `${FRONTEND_URL}/client-login`;
    sendClientProjectPortalEmail({
      to: newProject.clientEmail,
      clientName: newProject.client,
      projectTitle: newProject.title,
      portalUrl,
      clientLoginUrl,
      clientPassword: autoPassword,
      advancePercent,
      advanceAmount: advanceVal
    }).catch(e => console.warn('[Client Email Async Dispatch]:', e.message));

    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: projectData.createdById || 'jay-singh',
        actorName: projectData.createdByName || 'Jay Singh Sengar',
        action: 'CREATED_PROJECT',
        target: `Created project '${newProject.title}' for ${newProject.client} (Client Portal Link Sent)`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.status(201).json(newProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates._id;

    const project = await ProjectModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await ProjectModel.findOneAndDelete({ id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true, message: `Project ${project.title} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CLIENT PROJECT ACCEPTANCE PORTAL — PUBLIC ENDPOINTS
// ============================================================

// GET project proposal & portal package by token or ID
app.get('/api/client-portal/:tokenOrId', async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    let project = await ProjectModel.findOne({ clientPortalToken: tokenOrId });
    if (!project) {
      project = await ProjectModel.findOne({ id: tokenOrId });
    }
    if (!project) return res.status(404).json({ error: 'Client Project Package not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Client Login with Email & Password
app.post('/api/client-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const project = await ProjectModel.findOne({ 
      clientEmail: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
      clientPassword: password.trim()
    });

    if (!project) {
      return res.status(401).json({ error: 'Invalid Client Login Email or Password' });
    }

    res.json({ success: true, token: project.clientPortalToken || project.id, project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Client Accepts Agreement
app.post('/api/client-portal/:tokenOrId/accept-contract', async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    let project = await ProjectModel.findOne({ clientPortalToken: tokenOrId });
    if (!project) project = await ProjectModel.findOne({ id: tokenOrId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.contract.clientAccepted = true;
    project.contract.acceptedAt = new Date().toISOString();
    project.contract.clientIp = req.ip || '127.0.0.1';
    await project.save();

    res.json({ success: true, message: 'Contract agreement accepted', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Client Submits Payment (UTR + Screenshot)
app.post('/api/client-portal/:tokenOrId/submit-payment', async (req, res) => {
  try {
    const { tokenOrId } = req.params;
    const { utrNumber, screenshotUrl } = req.body;
    if (!utrNumber) return res.status(400).json({ error: 'UTR Transaction number is required' });

    let project = await ProjectModel.findOne({ clientPortalToken: tokenOrId });
    if (!project) project = await ProjectModel.findOne({ id: tokenOrId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.advancePayment.utrNumber = utrNumber;
    project.advancePayment.screenshotUrl = screenshotUrl || '';
    project.advancePayment.status = 'PENDING_APPROVAL';
    project.advancePayment.submittedAt = new Date().toISOString();
    project.status = 'PAYMENT_PENDING_APPROVAL';

    await project.save();

    // Create Notification for Kelly Agency Finance & Leadership Team
    try {
      const leadershipMembers = await MemberModel.find({ 
        $or: [
          { role: { $regex: /ceo|founder|director|finance/i } },
          { department: { $regex: /leadership|finance/i } }
        ]
      }).lean();

      for (const m of leadershipMembers) {
        await NotificationModel.create({
          id: `notif-${Date.now()}-${m.id}`,
          memberId: m.id,
          type: 'PAYMENT_PENDING',
          title: '💳 Client Advance Payment Verification Required',
          message: `Client ${project.client} submitted ₹${project.advancePayment.advanceAmount?.toLocaleString('en-IN')} advance payment with UTR ${utrNumber} for project "${project.title}".`,
          timestamp: new Date().toISOString(),
          isRead: false,
        });
      }
    } catch (_) { /* non-critical */ }

    res.json({ success: true, message: 'Payment verification submitted to Finance', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Finance & Leadership Approve Advance Payment
app.post('/api/projects/:id/approve-advance', async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const project = await ProjectModel.findOne({ id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const advanceVal = project.advancePayment.advanceAmount || 12500;

    project.advancePayment.status = 'CONFIRMED';
    project.advancePayment.approvedAt = new Date().toISOString();
    project.advancePayment.approvedBy = approvedBy || 'Finance Officer';
    project.status = 'CONFIRMED';
    project.progress = 10; // Work officially started

    await project.save();

    // Automatically record entry in Agency Finance Ledger as Income!
    try {
      await AgencyFinanceModel.create({
        id: `afin-${Date.now()}`,
        type: 'INCOME',
        title: `Advance Payment - ${project.title}`,
        category: 'CLIENT_PAYMENT',
        amount: advanceVal,
        party: project.client,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        notes: `UTR: ${project.advancePayment.utrNumber || 'VERIFIED'}`,
        recordedBy: approvedBy || 'Finance Officer'
      });
    } catch (_) { /* non-critical */ }

    // Email Confirmation & Documents Package to Client Email!
    sendPaymentApprovalConfirmationEmail({
      to: project.clientEmail,
      clientName: project.client,
      projectTitle: project.title,
      utrNumber: project.advancePayment.utrNumber || 'N/A',
      advanceAmount: advanceVal,
      remainingAmount: project.advancePayment.remainingAmount || (project.proposal?.totalCost - advanceVal)
    }).catch(e => console.warn('[Payment Approval Email Error]:', e.message));

    res.json({ success: true, message: 'Advance payment verified, project confirmed and work started!', project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Agency Payment Settings (Bank & UPI QR)
app.get('/api/agency-settings', async (req, res) => {
  try {
    let settings = await AgencySettingsModel.findOne({ id: 'kelly-agency-settings' });
    if (!settings) {
      settings = await AgencySettingsModel.create({ id: 'kelly-agency-settings' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Upload Image to Cloudinary
app.post('/api/upload-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image content required' });

    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadRes = await cloudinary.uploader.upload(image, {
          folder: 'kelly_agency_uploads',
        });
        console.log('✅ [Cloudinary Uploaded Successfully]:', uploadRes.secure_url);
        return res.json({ success: true, url: uploadRes.secure_url });
      } catch (cloudErr) {
        console.warn('⚠️ [Cloudinary Upload Warning]:', cloudErr.message);
      }
    }

    res.json({ success: true, url: image });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Update Agency Payment Settings (Leadership & Finance)
app.post('/api/agency-settings', async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await AgencySettingsModel.findOneAndUpdate(
      { id: 'kelly-agency-settings' },
      { $set: updateData },
      { new: true, upsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add expense to project
app.post('/api/projects/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const expenseData = req.body;
    const newExpense = {
      id: `exp-${Date.now()}`,
      title: expenseData.title,
      category: expenseData.category || 'AD_CAMPAIGN',
      amount: Number(expenseData.amount) || 0,
      paidTo: expenseData.paidTo || 'Vendor',
      date: expenseData.date || new Date().toISOString().split('T')[0],
      notes: expenseData.notes || '',
      createdBy: expenseData.createdBy || 'Finance'
    };

    const project = await ProjectModel.findOneAndUpdate(
      { id },
      { $push: { expenses: newExpense } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: expenseData.createdById || 'finance',
        actorName: expenseData.createdByName || 'Finance Team',
        action: 'RECORDED_EXPENSE',
        target: `Recorded expense of ₹${newExpense.amount} for project '${project.title}' (${newExpense.category})`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE expense from project
app.delete('/api/projects/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const project = await ProjectModel.findOneAndUpdate(
      { id },
      { $pull: { expenses: { id: expenseId } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// AGENCY-WIDE FINANCE & EXPENSE LEDGER — CRUD
// ============================================================

// GET all agency transactions
app.get('/api/agency-finance', async (req, res) => {
  try {
    if (!isDBConnected) return res.json([]);
    const records = await AgencyFinanceModel.find().sort({ createdAt: -1 }).lean();
    res.json(records || []);
  } catch (err) {
    res.json([]);
  }
});

// POST create agency finance entry
app.post('/api/agency-finance', async (req, res) => {
  try {
    const data = req.body;
    const newRecord = new AgencyFinanceModel({
      id: `afin-${Date.now()}`,
      type: data.type || 'EXPENSE',
      title: data.title,
      category: data.category || 'MISC_EXPENSE',
      amount: Number(data.amount) || 0,
      party: data.party || 'General',
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
      notes: data.notes || '',
      recordedBy: data.recordedBy || 'Finance'
    });

    await newRecord.save();

    try {
      await ActivityModel.create({
        id: `act-${Date.now()}`,
        actorId: data.recordedById || 'finance',
        actorName: data.recordedByName || 'Finance Officer',
        action: 'AGENCY_FINANCE_ENTRY',
        target: `Recorded agency ${newRecord.type.toLowerCase()} of ₹${newRecord.amount} (${newRecord.title})`,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE agency finance entry
app.delete('/api/agency-finance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AgencyFinanceModel.findOneAndDelete({ id });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ success: true, message: 'Agency finance entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TASKS — CRUD
// ============================================================

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (!isDBConnected) return res.json([]);
    const tasks = await TaskModel.find().sort({ createdAt: -1 }).lean();
    res.json(tasks || []);
  } catch (err) {
    res.json([]);
  }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  try {
    const taskData = req.body;
    const newTask = new TaskModel({
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      ...taskData,
    });

    await newTask.save();

    try {
      await NotificationModel.create({
        id: `notif-${Date.now()}`,
        memberId: newTask.assignedMemberId,
        title: 'New Task Assigned',
        message: `${newTask.createdByName} assigned you '${newTask.title}'`,
        type: 'TASK_ASSIGNED',
        isRead: false,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* non-critical */ }

    // Send email notification
    try {
      const assignedMember = await MemberModel.findOne({ id: newTask.assignedMemberId });
      const targetEmail = assignedMember?.email || 'kellyagency4@gmail.com';
      await sendMemberNotificationEmail({
        to: targetEmail,
        subject: `New Task Assigned: ${newTask.title}`,
        title: `You have been assigned a new task`,
        message: `${newTask.createdByName} assigned you to <strong>${newTask.title}</strong> under <strong>${newTask.projectName}</strong>.`,
        details: `<strong>Priority:</strong> ${newTask.priority}<br/><strong>Due Date:</strong> ${newTask.dueDate}`,
        actionUrl: `${FRONTEND_URL}/member-management/tasks`,
      });
    } catch (_) { /* email non-critical */ }

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await TaskModel.findOne({ id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const oldStatus = task.status;
    Object.assign(task, updates);
    task.updatedAt = new Date().toISOString();
    await task.save();

    if (updates.status && updates.status !== oldStatus) {
      try {
        await NotificationModel.create({
          id: `notif-${Date.now()}`,
          memberId: task.createdById,
          title: 'Task Status Updated',
          message: `'${task.title}' changed from ${oldStatus} to ${updates.status}`,
          type: 'STATUS_CHANGE',
          isRead: false,
          timestamp: new Date().toISOString(),
        });
      } catch (_) { /* non-critical */ }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ACTIVITY LOG & NOTIFICATIONS
// ============================================================

app.get('/api/activity', async (req, res) => {
  try {
    if (!isDBConnected) return res.json([]);
    const activities = await ActivityModel.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(activities || []);
  } catch (err) {
    res.json([]);
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    if (!isDBConnected) return res.json([]);
    const notifs = await NotificationModel.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(notifs || []);
  } catch (err) {
    res.json([]);
  }
});

// ============================================================
// START SERVER → THEN CONNECT DB
// ============================================================
app.listen(PORT, () => {
  console.log('\n==================================================');
  console.log('🚀 KELLY AGENCY TEAM OS BACKEND SERVER');
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('🔒 Authentication: Email & Password login');
  console.log('👑 CEO: Jay Singh Sengar (FULL ACCESS)');
  console.log('==================================================\n');

  // Connect AFTER server is up, so port is guaranteed
  connectDB();
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallback = Number(PORT) + 1;
    console.warn(`\n⚠️  Port ${PORT} is in use. Trying port ${fallback}...`);
    app.listen(fallback, () => {
      console.log('\n==================================================');
      console.log('🚀 KELLY AGENCY TEAM OS BACKEND SERVER');
      console.log(`📡 URL: http://localhost:${fallback}  (fallback port)`);
      console.log('⚠️  Tip: run  taskkill /F /IM node.exe  to free port ' + PORT);
      console.log('==================================================\n');
      connectDB();
    });
  } else {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  }
});
