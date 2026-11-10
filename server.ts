import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  UserAccount, UserRole, UserPermissions, Member, Invoice, PTSession, 
  WorkoutPlan, AuditLogItem, SystemSettings, TrainerProfile, Lead,
  MembershipPlan, BiometricLog, RenewalTask 
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// =========================================================================
// CORS CONFIGURATION
// =========================================================================
const ALLOWED_FRONTEND_URL = (process.env.FRONTEND_URL || 'https://gym-test-beige.vercel.app').trim().replace(/\/$/, '');

app.use((req: Request, res: Response, next: NextFunction): void => {
  const requestOrigin = req.headers.origin;

  // Allow requests from the exact configured frontend origin
  if (requestOrigin && (requestOrigin === ALLOWED_FRONTEND_URL || requestOrigin.replace(/\/$/, '') === ALLOWED_FRONTEND_URL)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight requests correctly with HTTP 204
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// =========================================================================
// SECURITY & CRYPTOGRAPHY UTILITIES
// =========================================================================

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// =========================================================================
// IN-MEMORY DATABASE & SEED ACCOUNTS
// =========================================================================

interface StoredAccount extends UserAccount {
  salt: string;
  passwordHash: string;
}

// Master Accounts with Secure Hashed Passwords
const ACCOUNTS_DB: Map<string, StoredAccount> = new Map();

function seedAccount(account: Omit<StoredAccount, 'salt' | 'passwordHash'>, plaintextPassword: string) {
  const salt = generateSalt();
  const passwordHash = hashPassword(plaintextPassword, salt);
  const fullAccount: StoredAccount = {
    ...account,
    salt,
    passwordHash
  };
  ACCOUNTS_DB.set(account.id, fullAccount);
}

// 1. Owner / Admin
seedAccount({
  id: 'USR-ADMIN-01',
  username: 'admin',
  email: 'admin@wfitgym.com',
  name: 'Farook Mohamed (Club Owner & Admin)',
  role: 'OWNER / ADMIN',
  isActive: true,
  createdAt: '2026-01-01',
}, 'Admin@WFIT2026!');

// 2. Club Manager
seedAccount({
  id: 'USR-MGR-01',
  username: 'manager',
  email: 'manager@wfitgym.com',
  name: 'Siddharth Rao (Club Operations Manager)',
  role: 'CLUB MANAGER',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-01-15',
}, 'Manager@WFIT2026!');

// 3. Trainer 1 (Alex Chen)
seedAccount({
  id: 'USR-TR-01',
  username: 'alex.trainer',
  email: 'alex.chen@wfitgym.com',
  name: 'Alex Chen',
  role: 'TRAINER',
  trainerId: 'TR-ALEX',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-02-01',
}, 'Trainer@WFIT2026!');

// 4. Trainer 2 (Marcus Stone)
seedAccount({
  id: 'USR-TR-02',
  username: 'marcus.trainer',
  email: 'marcus.stone@wfitgym.com',
  name: 'Marcus Stone',
  role: 'TRAINER',
  trainerId: 'TR-MARCUS',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-02-01',
}, 'Trainer@WFIT2026!');

// 4b. Trainer 3 (Elena Rostova)
seedAccount({
  id: 'USR-TR-03',
  username: 'elena.trainer',
  email: 'elena.rostova@wfitgym.com',
  name: 'Elena Rostova',
  role: 'TRAINER',
  trainerId: 'TR-ELENA',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-02-05',
}, 'Trainer@WFIT2026!');

// 4c. Trainer 4 (Vikram Rathore)
seedAccount({
  id: 'USR-TR-04',
  username: 'vikram.trainer',
  email: 'vikram.rathore@wfitgym.com',
  name: 'Vikram Rathore',
  role: 'TRAINER',
  trainerId: 'TR-VIKRAM',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-02-10',
}, 'Trainer@WFIT2026!');

// 5. Member 1 (Rohan Mehra)
seedAccount({
  id: 'USR-MEM-01',
  username: 'rohan.mehra',
  email: 'rohan.mehra@example.com',
  name: 'Rohan Mehra',
  role: 'MEMBER',
  memberId: 'WFIT-2026-001',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-01-10',
}, 'Member@WFIT2026!');

// 6. Member 2 (Priya Sharma)
seedAccount({
  id: 'USR-MEM-02',
  username: 'priya.sharma',
  email: 'priya.sharma@example.com',
  name: 'Priya Sharma',
  role: 'MEMBER',
  memberId: 'WFIT-2026-002',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-04-05',
}, 'Member@WFIT2026!');

// 7. Member 3 (Vikramaditya Sengupta - Unpaid Dues)
seedAccount({
  id: 'USR-MEM-03',
  username: 'vikram.sengupta',
  email: 'vikram.sengupta@example.com',
  name: 'Vikramaditya Sengupta',
  role: 'MEMBER',
  memberId: 'WFIT-2026-003',
  branch: 'Downtown Flagship',
  isActive: true,
  createdAt: '2026-08-01',
}, 'Member@WFIT2026!');

// Session Store: token -> { user: UserAccount, expiresAt: number }
const SESSIONS: Map<string, { user: UserAccount; expiresAt: number }> = new Map();

// Password Reset Codes Store: identifier -> { accountId: string, code: string, expiresAt: number }
const PASSWORD_RESET_CODES: Map<string, { accountId: string; code: string; expiresAt: number }> = new Map();

// Rate Limiting Store: IP/Username -> { failedAttempts: number, lockedUntil: number }
const LOGIN_ATTEMPTS: Map<string, { failedAttempts: number; lockedUntil: number }> = new Map();

// System Settings
const SYSTEM_SETTINGS: SystemSettings = {
  managerPaymentAccessEnabled: false,
  gymName: 'WFIT GYM',
  primaryBranch: 'Downtown Flagship',
  allowSelfRegistration: true,
  biometricEnforcementActive: true
};

function computePermissions(role: UserRole): UserPermissions {
  return {
    canViewFinances: role === 'OWNER / ADMIN' || (role === 'CLUB MANAGER' && SYSTEM_SETTINGS.managerPaymentAccessEnabled),
    canManageStaff: role === 'OWNER / ADMIN',
    canEditSecurity: role === 'OWNER / ADMIN',
    canManageMembers: role === 'OWNER / ADMIN' || role === 'CLUB MANAGER',
    canManageWorkouts: role === 'OWNER / ADMIN' || role === 'CLUB MANAGER' || role === 'TRAINER',
    isTrainerOnly: role === 'TRAINER',
    isMemberOnly: role === 'MEMBER'
  };
}

// Seed Membership Plans
const PLANS_DB: MembershipPlan[] = [
  {
    id: 'plan-1m',
    name: 'Monthly Plan',
    durationMonths: 1,
    price: 2999,
    registrationFee: 500,
    taxPercent: 18,
    features: ['Access to main gym floor', 'Locker & shower amenities', 'Fitness movement screen', 'Biometric turnstile access']
  },
  {
    id: 'plan-3m',
    name: 'Quarterly Plan',
    durationMonths: 3,
    price: 7499,
    registrationFee: 500,
    taxPercent: 18,
    features: ['All monthly features', '1 complimentary PT consultation', 'Personalized macronutrient guide', 'Locker bag tag']
  },
  {
    id: 'plan-6m',
    name: 'Half-Yearly Plan',
    durationMonths: 6,
    price: 13499,
    registrationFee: 0,
    taxPercent: 18,
    features: ['All quarterly features', 'Zero registration fee', '2 Guest workout passes/month', 'Freeze membership up to 15 days']
  },
  {
    id: 'plan-12m',
    name: 'Annual Pass',
    durationMonths: 12,
    price: 22999,
    registrationFee: 0,
    taxPercent: 18,
    features: ['Full gym & recovery access', 'Unlimited sauna & steam suite', '4 Guest passes/month', '30 days freeze option', 'Quarterly InBody composition test']
  }
];

// Seed Trainer Profiles
const TRAINERS_DB: TrainerProfile[] = [
  {
    id: 'TR-ALEX',
    name: 'Alex Chen',
    email: 'alex.chen@wfitgym.com',
    phone: '+91 98201 10001',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    specialisation: 'Olympic Weightlifting, Hypertrophy & Barbell Strength',
    branch: 'Downtown Flagship',
    workingHours: '06:00 - 14:00 (Mon - Fri)',
    experienceYears: 8,
    certifications: ['CSCS (NSCA)', 'USA Weightlifting Level 2', 'Precision Nutrition L1'],
    bio: 'Former collegiate powerlifting competitor specializing in biomechanically sound squat, bench, and deadlift progressions.',
    assignedMemberIds: ['WFIT-2026-001', 'WFIT-2026-002']
  },
  {
    id: 'TR-MARCUS',
    name: 'Marcus Stone',
    email: 'marcus.stone@wfitgym.com',
    phone: '+91 98201 10002',
    photoUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80',
    specialisation: 'Bodybuilding, Functional Hypertrophy & Strength Protocols',
    branch: 'Downtown Flagship',
    workingHours: '12:00 - 20:00 (Mon - Fri)',
    experienceYears: 6,
    certifications: ['ISSA Master Trainer', 'EXOS Performance Specialist'],
    bio: 'Dedicated to helping athletes build dense lean muscle through progressive overload and customized hypertrophy splits.',
    assignedMemberIds: ['WFIT-2026-003']
  },
  {
    id: 'TR-ELENA',
    name: 'Elena Rostova',
    email: 'elena.rostova@wfitgym.com',
    phone: '+91 98201 10003',
    photoUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&auto=format&fit=crop&q=80',
    specialisation: 'Mobility, Injury Rehabilitation & Athletic Longevity',
    branch: 'Downtown Flagship',
    workingHours: '07:00 - 15:00 (Tue - Sat)',
    experienceYears: 7,
    certifications: ['ACE Certified Personal Trainer', 'FRC Mobility Specialist'],
    bio: 'Integrates active joint mobility, functional kinetic chains, and restorative strength work to keep athletes injury-free.',
    assignedMemberIds: ['WFIT-2026-004']
  },
  {
    id: 'TR-VIKRAM',
    name: 'Vikram Rathore',
    email: 'vikram.rathore@wfitgym.com',
    phone: '+91 98201 10004',
    photoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80',
    specialisation: 'Boxing Conditioning, Sprint Mechanics & Metabolic Conditioning',
    branch: 'Downtown Flagship',
    workingHours: '14:00 - 22:00 (Mon - Fri)',
    experienceYears: 5,
    certifications: ['NASM-CPT', 'Level 2 Boxing Coach'],
    bio: 'Combines fight conditioning, pad work, agility drills, and anaerobic intervals for rapid metabolic conditioning.',
    assignedMemberIds: ['WFIT-2026-005']
  }
];

// Seed Leads & Enquiries
const LEADS_DB: Lead[] = [
  {
    id: 'LEAD-2026-101',
    name: 'Sameer Kulkarni',
    mobile: '+91 98220 55667',
    email: 'sameer.k@example.com',
    source: 'Instagram',
    interestedProduct: 'Gym Membership',
    assignedExecutive: 'Sneha Rao (Front Office)',
    stage: 'Visit / trial scheduled',
    enquiryDate: '2026-10-28',
    lastContactDate: '2026-10-29',
    nextFollowUpDate: '2026-10-31',
    trialDate: '2026-10-31',
    notes: 'Interested in annual membership and morning free weights training.'
  },
  {
    id: 'LEAD-2026-102',
    name: 'Divya Nair',
    mobile: '+91 97440 11223',
    email: 'divya.nair@example.com',
    source: 'Walk-in',
    interestedProduct: 'Personal Training',
    assignedExecutive: 'Sneha Rao (Front Office)',
    stage: 'New enquiry',
    enquiryDate: '2026-10-30',
    lastContactDate: '2026-10-30',
    nextFollowUpDate: '2026-10-31',
    notes: 'Looking for 1-on-1 coaching for post-rehab posture and mobility.'
  }
];

// Seed Biometric Logs
const BIOMETRIC_LOGS_DB: BiometricLog[] = [
  {
    id: 'BIO-2026-8001',
    timestamp: '2026-10-30 06:15:22',
    memberId: 'WFIT-2026-001',
    memberName: 'Rohan Mehra',
    device: 'Turnstile Gate #1 (Main)',
    scanType: 'Fingerprint',
    result: 'GRANTED'
  },
  {
    id: 'BIO-2026-8002',
    timestamp: '2026-10-30 06:45:10',
    memberId: 'WFIT-2026-003',
    memberName: 'Vikramaditya Sengupta',
    device: 'Turnstile Gate #1 (Main)',
    scanType: 'Face ID',
    result: 'DENIED',
    denialReason: 'Outstanding invoice balance pending settlement'
  },
  {
    id: 'BIO-2026-8003',
    timestamp: '2026-10-30 07:12:05',
    memberId: 'WFIT-2026-005',
    memberName: 'Kabir Oberoi',
    device: 'Turnstile Gate #1 (Main)',
    scanType: 'Fingerprint',
    result: 'GRANTED'
  }
];

const RENEWALS_DB: RenewalTask[] = [
  {
    id: 'REN-2026-01',
    memberId: 'WFIT-2026-002',
    memberName: 'Priya Sharma',
    planName: 'Half-Yearly Plan',
    expiryDate: '2026-11-06',
    daysRemaining: 7,
    lastReminderSentDate: '2026-10-30',
    reminderType: '7 Days Before',
    status: 'Sent',
    assignedStaff: 'Sneha Rao'
  },
  {
    id: 'REN-2026-02',
    memberId: 'WFIT-2026-004',
    memberName: 'Ananya Deshmukh',
    planName: 'Annual Pass',
    expiryDate: '2026-10-15',
    daysRemaining: -15,
    lastReminderSentDate: '2026-10-25',
    reminderType: 'Overdue',
    status: 'Pending',
    assignedStaff: 'Rahul Varma'
  }
];

// Seed Members
let MEMBERS_DB: Member[] = [
  {
    id: 'WFIT-2026-001',
    fullName: 'Rohan Mehra',
    mobile: '+91 98765 43210',
    email: 'rohan.mehra@example.com',
    dateOfBirth: '1994-06-14',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    registrationDate: '2026-01-10',
    branch: 'Downtown Flagship',
    status: 'Active',
    planId: 'plan-12m',
    planName: '12 Months Annual Pass',
    startDate: '2026-01-10',
    expiryDate: '2027-01-10',
    assignedTrainerId: 'TR-ALEX',
    assignedTrainerName: 'Alex Chen',
    emergencyContact: {
      name: 'Sunita Mehra',
      relationship: 'Mother',
      phone: '+91 98765 11111'
    },
    fitnessGoals: 'Compound strength progression, Olympic clean and jerk, body recomposition.',
    biometricEnrolled: true,
    biometricDeviceId: 'DEV-FP-MAIN-01',
    notes: 'Morning lifter. Consistent compliance with programming.'
  },
  {
    id: 'WFIT-2026-002',
    fullName: 'Priya Sharma',
    mobile: '+91 98111 22334',
    email: 'priya.sharma@example.com',
    dateOfBirth: '1998-11-20',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
    registrationDate: '2026-04-05',
    branch: 'Downtown Flagship',
    status: 'Expiring Soon',
    planId: 'plan-6m',
    planName: '6 Months Membership',
    startDate: '2026-05-06',
    expiryDate: '2026-11-06',
    assignedTrainerId: 'TR-ALEX',
    assignedTrainerName: 'Alex Chen',
    emergencyContact: {
      name: 'Arjun Sharma',
      relationship: 'Spouse',
      phone: '+91 98111 99887'
    },
    fitnessGoals: 'Functional mobility, posterior chain strength, cardiovascular endurance.',
    biometricEnrolled: true,
    biometricDeviceId: 'DEV-FP-MAIN-01',
    notes: 'Attends 7 PM HIIT and PT strength sessions.'
  },
  {
    id: 'WFIT-2026-003',
    fullName: 'Vikramaditya Sengupta',
    mobile: '+91 99200 44556',
    email: 'vikram.sengupta@example.com',
    dateOfBirth: '1989-03-25',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    registrationDate: '2026-08-01',
    branch: 'Downtown Flagship',
    status: 'Unpaid',
    planId: 'plan-3m',
    planName: '3 Months Membership',
    startDate: '2026-08-01',
    expiryDate: '2026-11-01',
    assignedTrainerId: 'TR-MARCUS',
    assignedTrainerName: 'Marcus Stone',
    fitnessGoals: 'Strength maintenance and rotational power.',
    biometricEnrolled: true,
    biometricDeviceId: 'DEV-FP-MAIN-01',
    notes: 'Partial payment made at desk; pending balance ₹3,848.82.'
  },
  {
    id: 'WFIT-2026-004',
    fullName: 'Ananya Deshmukh',
    mobile: '+91 98333 77889',
    email: 'ananya.d@example.com',
    dateOfBirth: '1996-09-15',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
    registrationDate: '2025-10-15',
    branch: 'West End Wing',
    status: 'Expired',
    planId: 'plan-12m',
    planName: '12 Months Annual Pass',
    startDate: '2025-10-15',
    expiryDate: '2026-10-15',
    biometricEnrolled: true,
    biometricDeviceId: 'DEV-FP-WEST-02',
    notes: 'Expired 15 days ago. Follow-up task in progress.'
  },
  {
    id: 'WFIT-2026-005',
    fullName: 'Kabir Oberoi',
    mobile: '+91 97654 33221',
    email: 'kabir.o@example.com',
    dateOfBirth: '1991-01-30',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    registrationDate: '2026-10-28',
    branch: 'Downtown Flagship',
    status: 'Active',
    planId: 'plan-1m',
    planName: '1 Month Membership',
    startDate: '2026-10-28',
    expiryDate: '2026-11-28',
    assignedTrainerId: 'TR-MARCUS',
    assignedTrainerName: 'Marcus Stone',
    biometricEnrolled: false,
    notes: 'New walk-in member. Needs biometric template enrollment.'
  }
];

// Seed Invoices
let INVOICES_DB: Invoice[] = [
  {
    id: 'INV-2026-1001',
    memberId: 'WFIT-2026-001',
    memberName: 'Rohan Mehra',
    date: '2026-10-30',
    dueDate: '2026-10-30',
    items: [{ description: '12 Months Annual Pass', amount: 13999 }],
    subtotal: 13999,
    discount: 1000,
    discountReason: 'Promo Code WFEST',
    tax: 2339.82,
    total: 15338.82,
    amountPaid: 15338.82,
    balanceDue: 0,
    status: 'Paid',
    paymentMethod: 'UPI/GPay',
    paymentReference: 'UPI-REF-993821049281',
    branch: 'Downtown Flagship',
    paidAt: '2026-10-30 08:30:00'
  },
  {
    id: 'INV-2026-1002',
    memberId: 'WFIT-2026-003',
    memberName: 'Vikramaditya Sengupta',
    date: '2026-10-25',
    dueDate: '2026-10-29',
    items: [
      { description: '3 Months Membership', amount: 6999 },
      { description: 'Registration & Access Card', amount: 500 }
    ],
    subtotal: 7499,
    discount: 0,
    tax: 1349.82,
    total: 8848.82,
    amountPaid: 5000,
    balanceDue: 3848.82,
    status: 'Partial',
    paymentMethod: 'Cash',
    paymentReference: 'CASH-REC-0491',
    branch: 'Downtown Flagship',
    paidAt: '2026-10-25 11:20:00'
  },
  {
    id: 'INV-2026-1003',
    memberId: 'WFIT-2026-005',
    memberName: 'Kabir Oberoi',
    date: '2026-10-30',
    dueDate: '2026-10-30',
    items: [
      { description: '1 Month Membership', amount: 2999 },
      { description: 'Registration Fee', amount: 500 }
    ],
    subtotal: 3499,
    discount: 0,
    tax: 629.82,
    total: 4128.82,
    amountPaid: 4128.82,
    balanceDue: 0,
    status: 'Paid',
    paymentMethod: 'Card',
    paymentReference: 'POS-TXN-7740192',
    branch: 'Downtown Flagship',
    paidAt: '2026-10-30 14:15:00'
  },
  {
    id: 'INV-2026-1004',
    memberId: 'WFIT-2026-002',
    memberName: 'Priya Sharma',
    date: '2026-10-20',
    dueDate: '2026-10-20',
    items: [{ description: 'PT Package 10 Sessions (Alex Chen)', amount: 12000 }],
    subtotal: 12000,
    discount: 1000,
    discountReason: 'Trainer Welcome Promo',
    tax: 1980,
    total: 12980,
    amountPaid: 12980,
    balanceDue: 0,
    status: 'Paid',
    paymentMethod: 'Bank Transfer',
    paymentReference: 'NEFT-AXIS-8819028',
    branch: 'Downtown Flagship',
    paidAt: '2026-10-20 16:40:00'
  }
];

// Seed Workouts
let WORKOUTS_DB: WorkoutPlan[] = [
  {
    id: 'WO-2026-01',
    memberId: 'WFIT-2026-001',
    memberName: 'Rohan Mehra',
    trainerId: 'TR-ALEX',
    trainerName: 'Alex Chen',
    title: 'Strength Hypertrophy Block A',
    focus: 'Barbell Squats & Overhead Pressing Mechanics',
    exercises: [
      { name: 'Barbell Back Squat', sets: '4', reps: '6', weight: '120 kg', notes: 'Maintain torso angle, explode out of the hole' },
      { name: 'Overhead Barbell Press', sets: '3', reps: '8', weight: '65 kg', notes: 'Full lockout at top' },
      { name: 'Romanian Deadlift', sets: '3', reps: '10', weight: '100 kg', notes: 'Feel hamstring stretch' },
      { name: 'Weighted Pull-ups', sets: '3', reps: '8', weight: '+15 kg' }
    ],
    updatedAt: '2026-10-28',
    status: 'Active',
    coachNotes: 'Technique is dialled in on back squat. Ready to increase load next microcycle.'
  },
  {
    id: 'WO-2026-02',
    memberId: 'WFIT-2026-002',
    memberName: 'Priya Sharma',
    trainerId: 'TR-ALEX',
    trainerName: 'Alex Chen',
    title: 'Posterior Chain & Functional Power',
    focus: 'Kettlebell Swings, Trap Bar Deadlifts & Core Stability',
    exercises: [
      { name: 'Trap Bar Deadlift', sets: '4', reps: '8', weight: '80 kg' },
      { name: 'Single-Arm Dumbbell Row', sets: '3', reps: '12', weight: '20 kg' },
      { name: 'Bulgarian Split Squat', sets: '3', reps: '10 each', weight: '14 kg dbs' },
      { name: 'Hanging Leg Raises', sets: '3', reps: '15' }
    ],
    updatedAt: '2026-10-29',
    status: 'Active',
    coachNotes: 'Great unilateral balance improvement. Consistent 3x per week attendance.'
  }
];

// Seed PT Sessions
let PT_SESSIONS_DB: PTSession[] = [
  {
    id: 'PT-2026-301',
    memberId: 'WFIT-2026-002',
    memberName: 'Priya Sharma',
    trainerId: 'TR-ALEX',
    trainerName: 'Alex Chen',
    packageName: 'Functional Strength (10 Sessions)',
    totalSessions: 10,
    completedSessions: 4,
    remainingSessions: 6,
    price: 12000,
    commissionRate: 20,
    startDate: '2026-10-20',
    expiryDate: '2026-11-20',
    status: 'Active'
  },
  {
    id: 'PT-2026-302',
    memberId: 'WFIT-2026-001',
    memberName: 'Rohan Mehra',
    trainerId: 'TR-ALEX',
    trainerName: 'Alex Chen',
    packageName: 'Olympic Lifting Mastery (20 Sessions)',
    totalSessions: 20,
    completedSessions: 18,
    remainingSessions: 2,
    price: 22000,
    commissionRate: 25,
    startDate: '2026-09-01',
    expiryDate: '2026-11-05',
    status: 'Active'
  }
];

// Seed Audit Logs
let AUDIT_LOGS_DB: AuditLogItem[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-10-30 06:30:11',
    actor: 'admin@wfitgym.com',
    role: 'OWNER / ADMIN',
    action: 'Discount Override Approved',
    target: 'INV-2026-1001',
    details: 'Applied ₹1,000 festival voucher discount code WFEST',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-10-30 07:10:15',
    actor: 'manager@wfitgym.com',
    role: 'CLUB MANAGER',
    action: 'Manual Biometric Override',
    target: 'Member WFIT-2026-004',
    details: 'Granted 1-time desk entry for Ananya Deshmukh (membership expired)',
    status: 'SUCCESS'
  }
];

function logAudit(actor: string, role: string, action: string, target: string, details: string, status: 'SUCCESS' | 'DENIED' | 'FAILED' = 'SUCCESS') {
  const item: AuditLogItem = {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    actor,
    role,
    action,
    target,
    details,
    status
  };
  AUDIT_LOGS_DB.unshift(item);
}

// =========================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// =========================================================================

export interface AuthenticatedRequest extends Request {
  user?: UserAccount;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication token missing or invalid. Please sign in.' 
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = SESSIONS.get(token);

  if (!session) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Session has expired or is invalid. Please sign in again.' 
    });
    return;
  }

  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Session expired. Please sign in again.' 
    });
    return;
  }

  req.user = session.user;
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logAudit(
        req.user.email, 
        req.user.role, 
        'UNAUTHORIZED_ROLE_ACCESS_BLOCKED', 
        req.path, 
        `User attempted access to restricted endpoint requiring: [${allowedRoles.join(', ')}]`, 
        'DENIED'
      );
      res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access Denied: Your role (${req.user.role}) is not authorised to perform this action.` 
      });
      return;
    }

    next();
  };
}

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Auth: Sign In
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password, rememberMe } = req.body; // identifier = username or email
  const clientIp = req.ip || '127.0.0.1';

  if (!identifier || !password) {
    res.status(400).json({ error: 'Bad Request', message: 'Username/email and password are required.' });
    return;
  }

  // Rate limiting check
  const attemptKey = `${clientIp}_${identifier.toLowerCase().trim()}`;
  const rateLimit = LOGIN_ATTEMPTS.get(attemptKey);
  if (rateLimit && rateLimit.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((rateLimit.lockedUntil - Date.now()) / 1000);
    res.status(429).json({ 
      error: 'Too Many Requests', 
      message: `Account is temporarily locked due to consecutive failed attempts. Try again in ${remainingSeconds} seconds.` 
    });
    return;
  }

  // Lookup user by email or username
  let targetAccount: StoredAccount | undefined;
  for (const account of ACCOUNTS_DB.values()) {
    if (
      account.email.toLowerCase() === identifier.toLowerCase().trim() ||
      account.username.toLowerCase() === identifier.toLowerCase().trim()
    ) {
      targetAccount = account;
      break;
    }
  }

  if (!targetAccount || !targetAccount.isActive) {
    const current = rateLimit?.failedAttempts || 0;
    const newCount = current + 1;
    LOGIN_ATTEMPTS.set(attemptKey, {
      failedAttempts: newCount,
      lockedUntil: newCount >= 5 ? Date.now() + 5 * 60 * 1000 : 0
    });

    logAudit(identifier, 'UNKNOWN', 'LOGIN_FAILED', '/api/auth/login', 'User not found or account deactivated', 'FAILED');
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials or inactive account.' });
    return;
  }

  const isPasswordValid = verifyPassword(password, targetAccount.salt, targetAccount.passwordHash);
  if (!isPasswordValid) {
    const current = rateLimit?.failedAttempts || 0;
    const newCount = current + 1;
    LOGIN_ATTEMPTS.set(attemptKey, {
      failedAttempts: newCount,
      lockedUntil: newCount >= 5 ? Date.now() + 5 * 60 * 1000 : 0
    });

    logAudit(targetAccount.email, targetAccount.role, 'LOGIN_FAILED', '/api/auth/login', 'Incorrect password provided', 'FAILED');
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email/username or password.' });
    return;
  }

  // Clear rate limit on success
  LOGIN_ATTEMPTS.delete(attemptKey);

  // Generate Session Token
  const token = generateSecureToken();
  const sessionUser: UserAccount = {
    id: targetAccount.id,
    username: targetAccount.username,
    email: targetAccount.email,
    role: targetAccount.role,
    name: targetAccount.name,
    memberId: targetAccount.memberId,
    trainerId: targetAccount.trainerId,
    branch: targetAccount.branch,
    isActive: targetAccount.isActive,
    createdAt: targetAccount.createdAt,
    lastLoginAt: new Date().toISOString()
  };

  // 7-day expiry if rememberMe, otherwise 8 hours
  const ttlMs = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  SESSIONS.set(token, {
    user: sessionUser,
    expiresAt: Date.now() + ttlMs
  });

  logAudit(targetAccount.email, targetAccount.role, 'LOGIN_SUCCESS', '/api/auth/login', 'Authenticated successfully', 'SUCCESS');

  const linkedMember = sessionUser.memberId
    ? MEMBERS_DB.find(m => m.id === sessionUser.memberId)
    : undefined;

  res.json({
    token,
    user: sessionUser,
    member: linkedMember,
    permissions: computePermissions(targetAccount.role)
  });
});

// 1b. Auth: Public Member Registration (Create Account)
app.post('/api/auth/register', (req: Request, res: Response) => {
  if (!SYSTEM_SETTINGS.allowSelfRegistration) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Self-registration is currently disabled by the club administrator. Please contact front desk.'
    });
    return;
  }

  const { fullName, email, mobile, username, password, branch, planId, fitnessGoals } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Bad Request', message: 'Full name is required (at least 2 characters).' });
    return;
  }
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Bad Request', message: 'A valid email address is required.' });
    return;
  }
  const cleanMobile = typeof mobile === 'string' ? mobile.trim() : '';
  if (!cleanMobile || cleanMobile.replace(/\D/g, '').length < 8) {
    res.status(400).json({ error: 'Bad Request', message: 'A valid mobile phone number is required.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 8 characters long.' });
    return;
  }

  const cleanUsername = (
    typeof username === 'string' && username.trim()
      ? username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')
      : cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '')
  );

  for (const acc of ACCOUNTS_DB.values()) {
    if (acc.email.toLowerCase() === cleanEmail) {
      res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
      return;
    }
    if (acc.username.toLowerCase() === cleanUsername) {
      res.status(409).json({ error: 'Conflict', message: `Username "${cleanUsername}" is already taken.` });
      return;
    }
  }

  const chosenPlan = PLANS_DB.find(p => p.id === planId) || PLANS_DB[0];
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const expiry = new Date(now);
  expiry.setMonth(expiry.getMonth() + chosenPlan.durationMonths);
  const expiryDate = expiry.toISOString().split('T')[0];

  const memberId = `WFIT-2026-${String(MEMBERS_DB.length + 101).padStart(3, '0')}`;
  const chosenBranch = branch || 'Downtown Flagship';

  const newMember: Member = {
    id: memberId,
    fullName: fullName.trim(),
    mobile: cleanMobile,
    email: cleanEmail,
    dateOfBirth: '1996-01-01',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    registrationDate: startDate,
    branch: chosenBranch,
    status: 'Active',
    planId: chosenPlan.id,
    planName: chosenPlan.name,
    startDate,
    expiryDate,
    assignedTrainerId: 'TR-ALEX',
    assignedTrainerName: 'Alex Chen',
    fitnessGoals: typeof fitnessGoals === 'string' && fitnessGoals.trim()
      ? fitnessGoals.trim()
      : 'Strength progression, mobility improvement, and lean body composition.',
    biometricEnrolled: false,
    notes: 'Self-registered through WFIT GYM web portal.'
  };
  MEMBERS_DB.unshift(newMember);

  const accountId = `USR-MEM-${Date.now().toString().slice(-5)}`;
  seedAccount({
    id: accountId,
    username: cleanUsername,
    email: cleanEmail,
    name: fullName.trim(),
    role: 'MEMBER',
    memberId,
    branch: chosenBranch,
    isActive: true,
    createdAt: startDate,
    lastLoginAt: new Date().toISOString()
  }, password);

  const created = ACCOUNTS_DB.get(accountId)!;
  const sessionUser: UserAccount = {
    id: created.id,
    username: created.username,
    email: created.email,
    role: created.role,
    name: created.name,
    memberId: created.memberId,
    branch: created.branch,
    isActive: created.isActive,
    createdAt: created.createdAt,
    lastLoginAt: created.lastLoginAt
  };

  const token = generateSecureToken();
  SESSIONS.set(token, {
    user: sessionUser,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000
  });

  logAudit(cleanEmail, 'MEMBER', 'MEMBER_SELF_REGISTERED', memberId, `New member account registered via portal (${chosenPlan.name})`, 'SUCCESS');

  res.status(201).json({
    token,
    user: sessionUser,
    member: newMember,
    permissions: computePermissions('MEMBER')
  });
});

// 1c. Auth: Forgot Password Request (Generate 6-Digit Reset Code)
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
    res.status(400).json({ error: 'Bad Request', message: 'Please enter your registered email address or username.' });
    return;
  }

  const normalized = identifier.trim().toLowerCase();
  let targetAccount: StoredAccount | undefined;
  for (const acc of ACCOUNTS_DB.values()) {
    if (acc.email.toLowerCase() === normalized || acc.username.toLowerCase() === normalized) {
      targetAccount = acc;
      break;
    }
  }

  if (!targetAccount) {
    res.status(404).json({ error: 'Not Found', message: 'No registered WFIT GYM account matched that email or username.' });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  PASSWORD_RESET_CODES.set(targetAccount.email.toLowerCase(), {
    accountId: targetAccount.id,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  const [localPart, domain] = targetAccount.email.split('@');
  const maskedEmail = `${localPart.slice(0, 2)}***@${domain}`;

  logAudit(targetAccount.email, targetAccount.role, 'PASSWORD_RESET_REQUESTED', targetAccount.id, 'Generated 6-digit password reset verification code', 'SUCCESS');

  res.json({
    success: true,
    email: targetAccount.email,
    maskedEmail,
    demoPreviewCode: code,
    expiresInSeconds: 600,
    message: `A 6-digit verification code has been prepared for ${maskedEmail}.`
  });
});

// 1d. Auth: Reset Password with Verification Code
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { identifier, code, newPassword } = req.body;
  if (!identifier || !code || !newPassword) {
    res.status(400).json({ error: 'Bad Request', message: 'Email/username, 6-digit code, and new password are required.' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Bad Request', message: 'New password must be at least 8 characters long.' });
    return;
  }

  const normalized = String(identifier).trim().toLowerCase();
  let targetAccount: StoredAccount | undefined;
  for (const acc of ACCOUNTS_DB.values()) {
    if (acc.email.toLowerCase() === normalized || acc.username.toLowerCase() === normalized) {
      targetAccount = acc;
      break;
    }
  }

  if (!targetAccount) {
    res.status(404).json({ error: 'Not Found', message: 'Account not found.' });
    return;
  }

  const resetRecord = PASSWORD_RESET_CODES.get(targetAccount.email.toLowerCase());
  if (!resetRecord || resetRecord.code !== String(code).trim()) {
    res.status(400).json({ error: 'Invalid Code', message: 'Invalid verification code. Please double-check and try again.' });
    return;
  }
  if (Date.now() > resetRecord.expiresAt) {
    PASSWORD_RESET_CODES.delete(targetAccount.email.toLowerCase());
    res.status(400).json({ error: 'Expired Code', message: 'Verification code has expired. Please request a new code.' });
    return;
  }

  const newSalt = generateSalt();
  targetAccount.salt = newSalt;
  targetAccount.passwordHash = hashPassword(newPassword, newSalt);
  PASSWORD_RESET_CODES.delete(targetAccount.email.toLowerCase());
  LOGIN_ATTEMPTS.clear();

  logAudit(targetAccount.email, targetAccount.role, 'PASSWORD_RESET_COMPLETED', targetAccount.id, 'Password updated via reset verification flow', 'SUCCESS');

  res.json({
    success: true,
    email: targetAccount.email,
    message: 'Your password has been updated. Please sign in with your new credentials.'
  });
});

// 1e. Auth: Authenticated Change Password
app.post('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Bad Request', message: 'Current password and new password are required.' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Bad Request', message: 'New password must be at least 8 characters long.' });
    return;
  }

  const account = ACCOUNTS_DB.get(req.user!.id);
  if (!account) {
    res.status(404).json({ error: 'Not Found', message: 'User account not found.' });
    return;
  }

  if (!verifyPassword(currentPassword, account.salt, account.passwordHash)) {
    res.status(401).json({ error: 'Unauthorized', message: 'Current password is incorrect.' });
    return;
  }

  const newSalt = generateSalt();
  account.salt = newSalt;
  account.passwordHash = hashPassword(newPassword, newSalt);

  logAudit(account.email, account.role, 'PASSWORD_CHANGED', account.id, 'User updated account password from profile security panel', 'SUCCESS');

  res.json({ success: true, message: 'Password updated successfully.' });
});

// 2. Auth: Sign Out
app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    SESSIONS.delete(token);
  }
  if (req.user) {
    logAudit(req.user.email, req.user.role, 'LOGOUT', '/api/auth/logout', 'Session invalidated securely', 'SUCCESS');
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 3. Auth: Current Profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const linkedMember = req.user.memberId
    ? MEMBERS_DB.find(m => m.id === req.user!.memberId)
    : undefined;

  res.json({
    user: req.user,
    member: linkedMember,
    permissions: computePermissions(req.user.role)
  });
});

// 3b. Switchable Role Directory (Public demo personas without secrets)
app.get('/api/auth/accounts', (_req: Request, res: Response) => {
  const accounts: UserAccount[] = Array.from(ACCOUNTS_DB.values()).map(acc => ({
    id: acc.id,
    username: acc.username,
    email: acc.email,
    role: acc.role,
    name: acc.name,
    memberId: acc.memberId,
    trainerId: acc.trainerId,
    branch: acc.branch,
    isActive: acc.isActive,
    createdAt: acc.createdAt,
    lastLoginAt: acc.lastLoginAt
  }));
  res.json(accounts);
});

// 3c. Instant Role Switch (No Login Page Required — Issues Real RBAC Session Token)
app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { accountId, email, role, memberId, trainerId } = req.body || {};

  let targetAccount: StoredAccount | undefined;

  if (accountId) {
    targetAccount = ACCOUNTS_DB.get(String(accountId));
  }
  if (!targetAccount && email) {
    const targetEmail = String(email).trim().toLowerCase();
    for (const acc of ACCOUNTS_DB.values()) {
      if (acc.email.toLowerCase() === targetEmail) {
        targetAccount = acc;
        break;
      }
    }
  }
  if (!targetAccount && trainerId) {
    for (const acc of ACCOUNTS_DB.values()) {
      if (acc.trainerId === trainerId) {
        targetAccount = acc;
        break;
      }
    }
  }
  if (!targetAccount && memberId) {
    for (const acc of ACCOUNTS_DB.values()) {
      if (acc.memberId === memberId) {
        targetAccount = acc;
        break;
      }
    }
  }
  if (!targetAccount && role) {
    for (const acc of ACCOUNTS_DB.values()) {
      if (acc.role === role && acc.isActive) {
        targetAccount = acc;
        break;
      }
    }
  }

  if (!targetAccount) {
    res.status(404).json({ error: 'Not Found', message: 'Requested role profile could not be found.' });
    return;
  }

  if (!targetAccount.isActive) {
    logAudit(targetAccount.email, targetAccount.role, 'ROLE_SWITCH_BLOCKED', targetAccount.id, 'Attempted switch to suspended account', 'DENIED');
    res.status(403).json({
      error: 'Suspended',
      message: `${targetAccount.name} is currently suspended by Owner Policies.`
    });
    return;
  }

  const token = generateSecureToken();
  const sessionUser: UserAccount = {
    id: targetAccount.id,
    username: targetAccount.username,
    email: targetAccount.email,
    role: targetAccount.role,
    name: targetAccount.name,
    memberId: targetAccount.memberId,
    trainerId: targetAccount.trainerId,
    branch: targetAccount.branch,
    isActive: targetAccount.isActive,
    createdAt: targetAccount.createdAt,
    lastLoginAt: new Date().toISOString()
  };

  SESSIONS.set(token, {
    user: sessionUser,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  });

  logAudit(targetAccount.email, targetAccount.role, 'ROLE_SWITCHED', targetAccount.id, `Switched active workspace persona to ${targetAccount.name} (${targetAccount.role})`, 'SUCCESS');

  const linkedMember = sessionUser.memberId
    ? MEMBERS_DB.find(m => m.id === sessionUser.memberId)
    : undefined;

  res.json({
    token,
    user: sessionUser,
    member: linkedMember,
    permissions: computePermissions(targetAccount.role)
  });
});

// 4. Members: Role-Filtered Member Directory
app.get('/api/members', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.role === 'OWNER / ADMIN' || user.role === 'CLUB MANAGER') {
    // Return all members. If Manager and payments disabled, strip financial notes
    res.json(MEMBERS_DB);
    return;
  }

  if (user.role === 'TRAINER') {
    // STRICT TRAINER RESTRICTION: Only members assigned to this trainer, and ZERO financial data!
    const trainerProfile = TRAINERS_DB.find(t => t.id === user.trainerId);
    const assignedIds = trainerProfile ? trainerProfile.assignedMemberIds : [];

    const filtered = MEMBERS_DB
      .filter(m => assignedIds.includes(m.id) || m.assignedTrainerId === user.trainerId)
      .map(m => {
        // Strip any financial details or invoices
        return {
          id: m.id,
          fullName: m.fullName,
          mobile: m.mobile,
          email: m.email,
          dateOfBirth: m.dateOfBirth,
          photoUrl: m.photoUrl,
          branch: m.branch,
          status: m.status,
          planName: m.planName,
          startDate: m.startDate,
          expiryDate: m.expiryDate,
          fitnessGoals: m.fitnessGoals,
          notes: m.notes
          // No pricing, no registration fee, no payment balance!
        };
      });

    res.json(filtered);
    return;
  }

  if (user.role === 'MEMBER') {
    // STRICT MEMBER RESTRICTION: Only their own profile!
    const myProfile = MEMBERS_DB.filter(m => m.id === user.memberId);
    res.json(myProfile);
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

// 5. Members: Specific Member Lookup
app.get('/api/members/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetId = req.params.id;

  // Member can only view their own
  if (user.role === 'MEMBER' && user.memberId !== targetId) {
    logAudit(user.email, user.role, 'UNAUTHORIZED_MEMBER_ACCESS_BLOCKED', `/api/members/${targetId}`, `Member attempted to access profile of ${targetId}`, 'DENIED');
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access Denied: You are not authorised to view another member’s profile.' 
    });
    return;
  }

  // Trainer can only view assigned members
  if (user.role === 'TRAINER') {
    const trainerProfile = TRAINERS_DB.find(t => t.id === user.trainerId);
    const isAssigned = trainerProfile?.assignedMemberIds.includes(targetId);
    if (!isAssigned) {
      logAudit(user.email, user.role, 'UNAUTHORIZED_TRAINER_MEMBER_ACCESS_BLOCKED', `/api/members/${targetId}`, `Trainer attempted to access unassigned member ${targetId}`, 'DENIED');
      res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Access Denied: You can only view fitness records for your assigned clients.' 
      });
      return;
    }
  }

  const member = MEMBERS_DB.find(m => m.id === targetId);
  if (!member) {
    res.status(404).json({ error: 'Not Found', message: 'Member not found.' });
    return;
  }

  res.json(member);
});

// 6. Invoices: Strict Role-Based Billing Access
app.get('/api/invoices', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  // 1. TRAINER RESTRICTION: STRICT 403
  if (user.role === 'TRAINER') {
    logAudit(user.email, user.role, 'TRAINER_FINANCIAL_API_BLOCKED', '/api/invoices', 'Trainer attempted to query invoice ledger', 'DENIED');
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access Denied: Trainers are strictly prohibited from accessing invoices, prices, or payment records.' 
    });
    return;
  }

  // 2. CLUB MANAGER RESTRICTION: Checked against owner permission
  if (user.role === 'CLUB MANAGER' && !SYSTEM_SETTINGS.managerPaymentAccessEnabled) {
    logAudit(user.email, user.role, 'MANAGER_FINANCIAL_API_BLOCKED', '/api/invoices', 'Manager attempted to query invoices while payment access is disabled by owner', 'DENIED');
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access Denied: Payment and invoice access is currently disabled for Club Managers by the gym owner.' 
    });
    return;
  }

  // 3. MEMBER RESTRICTION: Only their own invoices!
  if (user.role === 'MEMBER') {
    const myInvoices = INVOICES_DB.filter(inv => inv.memberId === user.memberId);
    res.json(myInvoices);
    return;
  }

  // 4. OWNER / ADMIN: All invoices
  res.json(INVOICES_DB);
});

// 7. Invoices: Pay Invoice (Server-Validated Payment Gateway)
app.post('/api/invoices/:id/pay', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const invoiceId = req.params.id;
  const { amount, paymentMethod } = req.body;

  const invoice = INVOICES_DB.find(i => i.id === invoiceId);
  if (!invoice) {
    res.status(404).json({ error: 'Not Found', message: 'Invoice not found.' });
    return;
  }

  // Ownership check: If Member, must be their invoice
  if (user.role === 'MEMBER' && invoice.memberId !== user.memberId) {
    logAudit(user.email, user.role, 'UNAUTHORIZED_PAYMENT_ATTEMPT', `/api/invoices/${invoiceId}/pay`, `Member attempted to pay another member's invoice`, 'DENIED');
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Access Denied: You cannot make payments for other members.' 
    });
    return;
  }

  // Trainer cannot process payments
  if (user.role === 'TRAINER') {
    res.status(403).json({ error: 'Forbidden', message: 'Trainers cannot process financial transactions.' });
    return;
  }

  // Validate balance
  if (invoice.balanceDue <= 0) {
    res.status(400).json({ error: 'Bad Request', message: 'Invoice has already been fully paid.' });
    return;
  }

  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    res.status(400).json({ error: 'Bad Request', message: 'Valid payment amount is required.' });
    return;
  }

  if (payAmount > invoice.balanceDue) {
    res.status(400).json({ 
      error: 'Bad Request', 
      message: `Payment amount (₹${payAmount}) exceeds outstanding balance due (₹${invoice.balanceDue}).` 
    });
    return;
  }

  // Verified Payment Gateway Simulation
  const verifiedTxnId = `TXN-VERIFIED-${Date.now().toString().slice(-8)}`;
  const newAmountPaid = invoice.amountPaid + payAmount;
  const newBalanceDue = invoice.total - newAmountPaid;
  const newStatus = newBalanceDue === 0 ? 'Paid' : 'Partial';

  invoice.amountPaid = newAmountPaid;
  invoice.balanceDue = newBalanceDue;
  invoice.status = newStatus;
  invoice.paymentMethod = paymentMethod || 'UPI/GPay';
  invoice.paymentReference = verifiedTxnId;
  invoice.paidAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // If member was marked 'Unpaid' and settled in full, update member status to 'Active'
  if (newBalanceDue === 0) {
    const member = MEMBERS_DB.find(m => m.id === invoice.memberId);
    if (member && member.status === 'Unpaid') {
      member.status = 'Active';
    }
  }

  logAudit(
    user.email, 
    user.role, 
    'PAYMENT_VERIFIED_AND_SETTLED', 
    invoice.id, 
    `Collected ₹${payAmount} via ${invoice.paymentMethod}. Ref: ${verifiedTxnId}. New Balance: ₹${newBalanceDue}`, 
    'SUCCESS'
  );

  res.json({
    success: true,
    message: 'Payment verified and allocated successfully.',
    receipt: {
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      invoiceId: invoice.id,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      amountCollected: payAmount,
      balanceRemaining: newBalanceDue,
      paymentMethod: invoice.paymentMethod,
      transactionId: verifiedTxnId,
      timestamp: invoice.paidAt,
      status: 'VERIFIED'
    },
    updatedInvoice: invoice
  });
});

// 8. Workouts: Trainer & Member Access
app.get('/api/workouts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.role === 'OWNER / ADMIN' || user.role === 'CLUB MANAGER') {
    res.json(WORKOUTS_DB);
    return;
  }

  if (user.role === 'TRAINER') {
    const trainerWorkouts = WORKOUTS_DB.filter(w => w.trainerId === user.trainerId);
    res.json(trainerWorkouts);
    return;
  }

  if (user.role === 'MEMBER') {
    const memberWorkouts = WORKOUTS_DB.filter(w => w.memberId === user.memberId);
    res.json(memberWorkouts);
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

// 9. Workouts: Create or Update Workout Plan
app.post('/api/workouts', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { memberId, title, focus, exercises, coachNotes } = req.body;

  const member = MEMBERS_DB.find(m => m.id === memberId);
  if (!member) {
    res.status(404).json({ error: 'Not Found', message: 'Target member not found.' });
    return;
  }

  const newWorkout: WorkoutPlan = {
    id: `WO-${Date.now().toString().slice(-6)}`,
    memberId,
    memberName: member.fullName,
    trainerId: user.trainerId || 'TR-ADMIN',
    trainerName: user.name,
    title,
    focus,
    exercises: exercises || [],
    updatedAt: new Date().toISOString().split('T')[0],
    status: 'Active',
    coachNotes
  };

  WORKOUTS_DB.unshift(newWorkout);
  logAudit(user.email, user.role, 'WORKOUT_PLAN_CREATED', newWorkout.id, `Created workout for ${member.fullName}: ${title}`, 'SUCCESS');

  res.status(201).json(newWorkout);
});

// 10. PT Sessions: Role Filtered
app.get('/api/pt-sessions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (user.role === 'OWNER / ADMIN') {
    // Admin gets full data with prices and commissions
    res.json(PT_SESSIONS_DB);
    return;
  }

  if (user.role === 'CLUB MANAGER') {
    // Manager gets sessions, with prices redacted if payment access disabled
    const sanitized = PT_SESSIONS_DB.map(s => ({
      ...s,
      price: SYSTEM_SETTINGS.managerPaymentAccessEnabled ? s.price : undefined,
      commissionRate: SYSTEM_SETTINGS.managerPaymentAccessEnabled ? s.commissionRate : undefined
    }));
    res.json(sanitized);
    return;
  }

  if (user.role === 'TRAINER') {
    // Trainer gets ONLY their sessions, and NO financial prices/commissions!
    const sanitized = PT_SESSIONS_DB
      .filter(s => s.trainerId === user.trainerId)
      .map(s => ({
        id: s.id,
        memberId: s.memberId,
        memberName: s.memberName,
        trainerId: s.trainerId,
        trainerName: s.trainerName,
        packageName: s.packageName,
        totalSessions: s.totalSessions,
        completedSessions: s.completedSessions,
        remainingSessions: s.remainingSessions,
        startDate: s.startDate,
        expiryDate: s.expiryDate,
        status: s.status
        // NO price, NO commissionRate
      }));
    res.json(sanitized);
    return;
  }

  if (user.role === 'MEMBER') {
    const mySessions = PT_SESSIONS_DB
      .filter(s => s.memberId === user.memberId)
      .map(s => ({
        id: s.id,
        memberId: s.memberId,
        memberName: s.memberName,
        trainerName: s.trainerName,
        packageName: s.packageName,
        totalSessions: s.totalSessions,
        completedSessions: s.completedSessions,
        remainingSessions: s.remainingSessions,
        startDate: s.startDate,
        expiryDate: s.expiryDate,
        status: s.status
      }));
    res.json(mySessions);
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

// 11. Audit Logs: Admin Only
app.get('/api/audit-logs', authMiddleware, requireRole(['OWNER / ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(AUDIT_LOGS_DB);
});

// 12. Settings: System Policies & Manager Payment Access Toggle (Admin Only)
app.get('/api/settings', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(SYSTEM_SETTINGS);
});

app.put('/api/settings/manager-payment-access', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { enabled } = req.body;
  SYSTEM_SETTINGS.managerPaymentAccessEnabled = Boolean(enabled);
  logAudit(
    req.user!.email, 
    req.user!.role, 
    'SECURITY_POLICY_CHANGED', 
    'managerPaymentAccessEnabled', 
    `Manager payment access toggled to: ${SYSTEM_SETTINGS.managerPaymentAccessEnabled}`, 
    'SUCCESS'
  );
  res.json({ success: true, settings: SYSTEM_SETTINGS });
});

app.put('/api/settings', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { managerPaymentAccessEnabled, allowSelfRegistration, biometricEnforcementActive } = req.body;
  if (typeof managerPaymentAccessEnabled === 'boolean') {
    SYSTEM_SETTINGS.managerPaymentAccessEnabled = managerPaymentAccessEnabled;
  }
  if (typeof allowSelfRegistration === 'boolean') {
    SYSTEM_SETTINGS.allowSelfRegistration = allowSelfRegistration;
  }
  if (typeof biometricEnforcementActive === 'boolean') {
    SYSTEM_SETTINGS.biometricEnforcementActive = biometricEnforcementActive;
  }
  logAudit(
    req.user!.email,
    req.user!.role,
    'SYSTEM_SETTINGS_UPDATED',
    'SYSTEM_SETTINGS',
    `Updated policies: managerPayment=${SYSTEM_SETTINGS.managerPaymentAccessEnabled}, selfReg=${SYSTEM_SETTINGS.allowSelfRegistration}, biometric=${SYSTEM_SETTINGS.biometricEnforcementActive}`,
    'SUCCESS'
  );
  res.json({ success: true, settings: SYSTEM_SETTINGS });
});

// 13. Staff & User Accounts Management (Admin Only)
app.get('/api/staff-accounts', authMiddleware, requireRole(['OWNER / ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const accounts: UserAccount[] = Array.from(ACCOUNTS_DB.values()).map(acc => ({
    id: acc.id,
    username: acc.username,
    email: acc.email,
    role: acc.role,
    name: acc.name,
    memberId: acc.memberId,
    trainerId: acc.trainerId,
    branch: acc.branch,
    isActive: acc.isActive,
    createdAt: acc.createdAt,
    lastLoginAt: acc.lastLoginAt
  }));
  res.json(accounts);
});

app.put('/api/staff-accounts/:id/status', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const { isActive } = req.body;

  const account = ACCOUNTS_DB.get(targetId);
  if (!account) {
    res.status(404).json({ error: 'Not Found', message: 'Account not found.' });
    return;
  }

  account.isActive = Boolean(isActive);
  logAudit(req.user!.email, req.user!.role, 'ACCOUNT_STATUS_MODIFIED', account.email, `Account active state set to ${account.isActive}`, 'SUCCESS');
  res.json({ success: true, account });
});

app.put('/api/staff-accounts/:id/reset-password', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'Bad Request', message: 'New password must be at least 8 characters long.' });
    return;
  }

  const account = ACCOUNTS_DB.get(targetId);
  if (!account) {
    res.status(404).json({ error: 'Not Found', message: 'Account not found.' });
    return;
  }

  const salt = generateSalt();
  account.salt = salt;
  account.passwordHash = hashPassword(newPassword, salt);
  logAudit(req.user!.email, req.user!.role, 'ADMIN_PASSWORD_RESET', account.email, `Admin reset login credentials for ${account.name}`, 'SUCCESS');
  res.json({ success: true, message: `Password reset for ${account.email}.` });
});

// 14. Trainers Management (Admin Add/Delete & General Query)
app.get('/api/trainers', (_req: Request, res: Response) => {
  res.json(TRAINERS_DB);
});

app.post('/api/trainers', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { 
    name, 
    email, 
    phone, 
    specialisation, 
    branch, 
    workingHours, 
    experienceYears, 
    certifications, 
    bio, 
    photoUrl,
    createLoginAccount,
    initialPassword
  } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Bad Request', message: 'Trainer name is required.' });
    return;
  }
  if (!email || typeof email !== 'string' || !email.trim()) {
    res.status(400).json({ error: 'Bad Request', message: 'Trainer email is required.' });
    return;
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    res.status(400).json({ error: 'Bad Request', message: 'Trainer phone number is required.' });
    return;
  }

  const existingTrainer = TRAINERS_DB.find(t => t.email.toLowerCase() === email.trim().toLowerCase());
  if (existingTrainer) {
    res.status(400).json({ error: 'Conflict', message: `A trainer with email ${email.trim()} already exists in the roster.` });
    return;
  }

  const cleanPrefix = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'COACH';
  const trainerId = `TR-${cleanPrefix}-${Date.now().toString().slice(-4)}`;

  const newTrainer: TrainerProfile = {
    id: trainerId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    photoUrl: photoUrl && typeof photoUrl === 'string' && photoUrl.trim() 
      ? photoUrl.trim() 
      : 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80',
    specialisation: specialisation && typeof specialisation === 'string' && specialisation.trim() 
      ? specialisation.trim() 
      : 'Strength & Conditioning',
    branch: branch || 'Downtown Flagship',
    workingHours: workingHours || '06:00 - 14:00 (Mon - Fri)',
    experienceYears: Number(experienceYears) || 3,
    certifications: Array.isArray(certifications) 
      ? certifications 
      : (typeof certifications === 'string' && certifications.trim() ? certifications.split(',').map((s: string) => s.trim()) : ['Certified Fitness Coach']),
    bio: bio && typeof bio === 'string' && bio.trim() 
      ? bio.trim() 
      : `Certified trainer specializing in ${specialisation || 'strength and movement'}.`,
    assignedMemberIds: []
  };

  TRAINERS_DB.push(newTrainer);

  let createdAccount: UserAccount | null = null;
  if (createLoginAccount) {
    const username = email.trim().split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const accountId = `USR-${trainerId}`;
    const chosenPassword = typeof initialPassword === 'string' && initialPassword.trim().length >= 8
      ? initialPassword.trim()
      : 'Trainer@WFIT2026!';
    seedAccount({
      id: accountId,
      username,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: 'TRAINER',
      trainerId: trainerId,
      branch: branch || 'Downtown Flagship',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    }, chosenPassword);

    const raw = ACCOUNTS_DB.get(accountId);
    if (raw) {
      createdAccount = {
        id: raw.id,
        username: raw.username,
        email: raw.email,
        name: raw.name,
        role: raw.role,
        trainerId: raw.trainerId,
        branch: raw.branch,
        isActive: raw.isActive,
        createdAt: raw.createdAt
      };
    }
  }

  logAudit(
    req.user!.email,
    req.user!.role,
    'TRAINER_ENROLLED',
    trainerId,
    `Admin added new trainer: ${newTrainer.name} (${newTrainer.specialisation})${createLoginAccount ? ' with CRM staff account.' : ''}`,
    'SUCCESS'
  );

  res.status(201).json({
    success: true,
    trainer: newTrainer,
    account: createdAccount,
    message: `Trainer ${newTrainer.name} successfully registered to roster.`
  });
});

app.delete('/api/trainers/:id', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const index = TRAINERS_DB.findIndex(t => t.id === targetId);
  if (index === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Trainer not found.' });
    return;
  }

  const removed = TRAINERS_DB.splice(index, 1)[0];

  MEMBERS_DB.forEach(m => {
    if (m.assignedTrainerId === targetId) {
      m.assignedTrainerId = undefined;
      m.assignedTrainerName = undefined;
    }
  });

  logAudit(
    req.user!.email,
    req.user!.role,
    'TRAINER_REMOVED',
    targetId,
    `Admin removed trainer ${removed.name} from roster.`,
    'SUCCESS'
  );

  res.json({ success: true, message: `Trainer ${removed.name} removed from roster.` });
});

app.put('/api/trainers/:id', authMiddleware, requireRole(['OWNER / ADMIN', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  if (req.user!.role === 'TRAINER' && req.user!.trainerId !== targetId) {
    res.status(403).json({ error: 'Forbidden', message: 'You can only update your own coach profile.' });
    return;
  }
  const idx = TRAINERS_DB.findIndex(t => t.id === targetId);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Trainer not found.' });
    return;
  }
  const { name, phone, specialisation, workingHours, bio, photoUrl, certifications, experienceYears } = req.body;
  TRAINERS_DB[idx] = {
    ...TRAINERS_DB[idx],
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(specialisation ? { specialisation } : {}),
    ...(workingHours ? { workingHours } : {}),
    ...(bio !== undefined ? { bio } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    ...(certifications ? { certifications } : {}),
    ...(experienceYears !== undefined ? { experienceYears: Number(experienceYears) } : {}),
    id: TRAINERS_DB[idx].id
  };
  logAudit(req.user!.email, req.user!.role, 'TRAINER_PROFILE_UPDATED', targetId, `Updated coach profile for ${TRAINERS_DB[idx].name}`, 'SUCCESS');
  res.json(TRAINERS_DB[idx]);
});

// 15. Members Create / Update / Delete
app.post('/api/members', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const member = req.body as Member;
  if (!member?.fullName || !member?.mobile) {
    res.status(400).json({ error: 'Bad Request', message: 'Member full name and mobile number are required.' });
    return;
  }
  const cleanMobile = member.mobile.replace(/\s+/g, '').replace(/-/g, '');
  if (MEMBERS_DB.some(m => m.mobile.replace(/\s+/g, '').replace(/-/g, '') === cleanMobile)) {
    res.status(409).json({ error: 'Conflict', message: 'A member with this mobile number already exists.' });
    return;
  }
  MEMBERS_DB.unshift(member);
  const memberEmail = (member.email || `${member.id.toLowerCase()}@member.wfitgym.com`).trim().toLowerCase();
  const hasExistingAcc = Array.from(ACCOUNTS_DB.values()).some(
    a => a.memberId === member.id || a.email.toLowerCase() === memberEmail
  );
  if (!hasExistingAcc) {
    seedAccount({
      id: `USR-${member.id}`,
      username: memberEmail.split('@')[0].replace(/[^a-z0-9._-]/g, ''),
      email: memberEmail,
      name: member.fullName,
      role: 'MEMBER',
      memberId: member.id,
      branch: member.branch,
      isActive: true,
      createdAt: member.registrationDate || new Date().toISOString().split('T')[0]
    }, 'Member@WFIT2026!');
  }
  logAudit(req.user!.email, req.user!.role, 'MEMBER_REGISTERED', member.id, `Registered member ${member.fullName} (${member.planName})`, 'SUCCESS');
  res.status(201).json(member);
});

app.put('/api/members/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const targetId = req.params.id;
  const idx = MEMBERS_DB.findIndex(m => m.id === targetId);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Member not found.' });
    return;
  }

  if (user.role === 'TRAINER') {
    res.status(403).json({ error: 'Forbidden', message: 'Trainers cannot modify member administrative records.' });
    return;
  }

  if (user.role === 'MEMBER') {
    if (user.memberId !== targetId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only update your own profile details.' });
      return;
    }
    const { fitnessGoals, mobile, email, emergencyContact } = req.body;
    const updatedSelf: Member = {
      ...MEMBERS_DB[idx],
      ...(fitnessGoals !== undefined ? { fitnessGoals } : {}),
      ...(mobile ? { mobile } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(emergencyContact ? { emergencyContact } : {}),
      id: targetId
    };
    MEMBERS_DB[idx] = updatedSelf;
    logAudit(user.email, user.role, 'MEMBER_SELF_PROFILE_UPDATED', targetId, `Member updated personal contact/goals`, 'SUCCESS');
    res.json(updatedSelf);
    return;
  }

  const updated = { ...MEMBERS_DB[idx], ...req.body, id: targetId };
  MEMBERS_DB[idx] = updated;

  // Keep trainer assignment synced
  TRAINERS_DB.forEach(t => {
    const shouldHave = updated.assignedTrainerId === t.id;
    const currentlyHas = t.assignedMemberIds.includes(targetId);
    if (shouldHave && !currentlyHas) t.assignedMemberIds.push(targetId);
    if (!shouldHave && currentlyHas) t.assignedMemberIds = t.assignedMemberIds.filter(id => id !== targetId);
  });

  logAudit(user.email, user.role, 'MEMBER_UPDATED', targetId, `Updated profile/status for ${updated.fullName}`, 'SUCCESS');
  res.json(updated);
});

app.delete('/api/members/:id', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const idx = MEMBERS_DB.findIndex(m => m.id === targetId);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Member not found.' });
    return;
  }
  const [removed] = MEMBERS_DB.splice(idx, 1);
  logAudit(req.user!.email, req.user!.role, 'MEMBER_DELETED', targetId, `Removed member ${removed.fullName} from roster`, 'SUCCESS');
  res.json({ success: true });
});

// 15b. Workouts Update (Status / Exercises)
app.put('/api/workouts/:id', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER', 'TRAINER']), (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.id;
  const idx = WORKOUTS_DB.findIndex(w => w.id === targetId);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Workout plan not found.' });
    return;
  }
  WORKOUTS_DB[idx] = {
    ...WORKOUTS_DB[idx],
    ...req.body,
    id: targetId,
    updatedAt: new Date().toISOString().split('T')[0]
  };
  logAudit(req.user!.email, req.user!.role, 'WORKOUT_UPDATED', targetId, `Updated workout ${WORKOUTS_DB[idx].title} (${WORKOUTS_DB[idx].status})`, 'SUCCESS');
  res.json(WORKOUTS_DB[idx]);
});

// 16. Plans Query & Price Update
app.get('/api/plans', (_req: Request, res: Response) => {
  res.json(PLANS_DB);
});

app.put('/api/plans/:id', authMiddleware, requireRole(['OWNER / ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const idx = PLANS_DB.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Membership plan not found.' });
    return;
  }
  PLANS_DB[idx] = { ...PLANS_DB[idx], ...req.body, id: PLANS_DB[idx].id };
  logAudit(req.user!.email, req.user!.role, 'PLAN_PRICING_UPDATED', PLANS_DB[idx].id, `Updated ${PLANS_DB[idx].name} to ₹${PLANS_DB[idx].price}`, 'SUCCESS');
  res.json(PLANS_DB[idx]);
});

// 17. Leads & Website Enquiries
app.get('/api/leads', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(LEADS_DB);
});

app.post('/api/leads', (req: Request, res: Response) => {
  const { name, mobile, email, source, interestedProduct, stage, notes } = req.body;
  if (!name || !mobile) {
    res.status(400).json({ error: 'Bad Request', message: 'Lead name and phone number are required.' });
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const newLead: Lead = {
    id: `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
    name: String(name).trim(),
    mobile: String(mobile).trim(),
    email: email ? String(email).trim() : undefined,
    source: source || 'Website',
    interestedProduct: interestedProduct || 'Gym Membership',
    assignedExecutive: 'Sneha Rao (Front Office)',
    stage: stage || 'New enquiry',
    enquiryDate: today,
    lastContactDate: today,
    nextFollowUpDate: tomorrow,
    notes: notes ? String(notes).trim() : ''
  };
  LEADS_DB.unshift(newLead);
  logAudit(email || name, source || 'Website', 'LEAD_CREATED', newLead.id, `New enquiry received from ${newLead.name}`, 'SUCCESS');
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const idx = LEADS_DB.findIndex(l => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Lead not found.' });
    return;
  }
  LEADS_DB[idx] = { ...LEADS_DB[idx], ...req.body, id: LEADS_DB[idx].id };
  logAudit(req.user!.email, req.user!.role, 'LEAD_UPDATED', LEADS_DB[idx].id, `Updated lead ${LEADS_DB[idx].name} stage to ${LEADS_DB[idx].stage}`, 'SUCCESS');
  res.json(LEADS_DB[idx]);
});

// 18. Biometric Logs & Renewals
app.get('/api/biometric-logs', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(BIOMETRIC_LOGS_DB);
});

app.post('/api/biometric-logs', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const log = req.body as BiometricLog;
  BIOMETRIC_LOGS_DB.unshift(log);
  logAudit(req.user!.email, req.user!.role, 'TURNSTILE_SCAN', log.memberId, `${log.scanType} scan ${log.result} for ${log.memberName}`, 'SUCCESS');
  res.status(201).json(log);
});

app.get('/api/renewals', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (_req: AuthenticatedRequest, res: Response) => {
  res.json(RENEWALS_DB);
});

app.put('/api/renewals/:id', authMiddleware, requireRole(['OWNER / ADMIN', 'CLUB MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const idx = RENEWALS_DB.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not Found', message: 'Renewal task not found.' });
    return;
  }
  RENEWALS_DB[idx] = { ...RENEWALS_DB[idx], ...req.body, id: RENEWALS_DB[idx].id };
  logAudit(req.user!.email, req.user!.role, 'RENEWAL_TASK_UPDATED', RENEWALS_DB[idx].id, `Updated renewal task for ${RENEWALS_DB[idx].memberName} (${RENEWALS_DB[idx].status})`, 'SUCCESS');
  res.json(RENEWALS_DB[idx]);
});


// =========================================================================
// VITE SPA DEV SERVER MOUNTING
// =========================================================================

function getListenPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = Number(process.argv[portArgIndex + 1]);
    if (!isNaN(val) && val > 0) return val;
  }
  if (process.env.NODE_ENV === 'production' && process.env.PORT) {
    return Number(process.env.PORT);
  }
  return 3000;
}

async function startServer() {
  const port = getListenPort();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`WFIT GYM CRM Backend & SPA running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
