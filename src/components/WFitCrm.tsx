import React, { useState, useMemo, useEffect } from 'react';
import {
  Member, Invoice, Lead, BiometricLog, PTSession, RenewalTask, AuditLogItem,
  MembershipPlan, PaymentMethod, UserAccount, SystemSettings, WorkoutPlan, TrainerProfile, ToastItem
} from '../types';
import {
  Users, CreditCard, Activity, Dumbbell, Shield, Search, Plus, Download,
  CheckCircle2, AlertCircle, Clock, Phone, Mail, Sparkles, DollarSign,
  Fingerprint, ArrowLeft, Building2, UserCheck, Lock, ShieldAlert,
  UserCheck2, ClipboardList, X, BarChart3, Settings as SettingsIcon,
  Trash2, Edit3, Image, AlertTriangle, RotateCcw, CheckCircle, Info,
  TrendingUp, Target, Send, UserPlus, ArrowRight
} from 'lucide-react';
import { BiometricModal } from './BiometricModal';
import { InvoiceModal } from './InvoiceModal';
import { MemberModal } from './MemberModal';
import { DemoPaymentModal } from './DemoPaymentModal';
import { TrainerModal } from './TrainerModal';
import { LeadModal } from './LeadModal';
import { AvatarImage } from './AvatarImage';
import { INITIAL_GALLERY_ITEMS, DEMO_ACCOUNTS } from '../mockData';

interface WFitCrmProps {
  onBackToLanding: () => void;
  currentUser: UserAccount;
  authToken: string;
  switchableAccounts?: UserAccount[];
  onSwitchDemoAccount?: (account: UserAccount) => Promise<void> | void;
  onRefreshAccounts?: () => Promise<void> | void;
  onResetDemoData?: () => void;
  plans: MembershipPlan[];
  setPlans: React.Dispatch<React.SetStateAction<MembershipPlan[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  trainers: TrainerProfile[];
  setTrainers: React.Dispatch<React.SetStateAction<TrainerProfile[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  biometricLogs: BiometricLog[];
  setBiometricLogs: React.Dispatch<React.SetStateAction<BiometricLog[]>>;
  ptSessions: PTSession[];
  setPtSessions: React.Dispatch<React.SetStateAction<PTSession[]>>;
  renewals: RenewalTask[];
  setRenewals: React.Dispatch<React.SetStateAction<RenewalTask[]>>;
  auditLogs: AuditLogItem[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogItem[]>>;
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
}

export const WFitCrm: React.FC<WFitCrmProps> = ({
  onBackToLanding,
  currentUser,
  authToken,
  switchableAccounts,
  onSwitchDemoAccount,
  onRefreshAccounts,
  onResetDemoData,
  plans,
  setPlans,
  members,
  setMembers,
  invoices,
  setInvoices,
  trainers,
  setTrainers,
  leads,
  setLeads,
  biometricLogs,
  setBiometricLogs,
  ptSessions,
  renewals,
  setRenewals,
  auditLogs,
  setAuditLogs,
  systemSettings,
  setSystemSettings
}) => {
  // Navigation & View State based on Role
  const defaultTab = useMemo(() => {
    if (currentUser.role === 'TRAINER') return 'trainer-dashboard';
    if (currentUser.role === 'MEMBER') return 'member-dashboard';
    return 'dashboard';
  }, [currentUser.role]);

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Sync activeTab when user changes role/account
  useEffect(() => {
    if (currentUser.role === 'TRAINER') setActiveTab('trainer-dashboard');
    else if (currentUser.role === 'MEMBER') setActiveTab('member-dashboard');
    else setActiveTab('dashboard');
  }, [currentUser.id, currentUser.role]);

  // Safety guard: if Manager loses billing access while inspecting billing tab, bounce cleanly
  useEffect(() => {
    if (
      currentUser.role === 'CLUB MANAGER' &&
      !systemSettings.managerPaymentAccessEnabled &&
      activeTab === 'billing'
    ) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, systemSettings.managerPaymentAccessEnabled, activeTab]);

  // Staff Accounts list synced cleanly from parent / server
  const [staffAccounts, setStaffAccounts] = useState<UserAccount[]>(
    switchableAccounts && switchableAccounts.length > 0 ? switchableAccounts : DEMO_ACCOUNTS
  );

  useEffect(() => {
    if (switchableAccounts && switchableAccounts.length > 0) {
      setStaffAccounts(switchableAccounts);
    }
  }, [switchableAccounts]);

  useEffect(() => {
    if (!authToken || currentUser.role !== 'OWNER / ADMIN') return;
    let cancelled = false;

    const loadOwnerTelemetry = async () => {
      try {
        const [accRes, audRes, setRes] = await Promise.all([
          fetch('/api/staff-accounts', { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch('/api/audit-logs', { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch('/api/settings', { headers: { Authorization: `Bearer ${authToken}` } })
        ]);
        if (!cancelled && accRes.ok) {
          const data = await accRes.json();
          if (Array.isArray(data) && data.length > 0) setStaffAccounts(data);
        }
        if (!cancelled && audRes.ok) {
          const data = await audRes.json();
          if (Array.isArray(data) && data.length > 0) setAuditLogs(data);
        }
        if (!cancelled && setRes.ok) {
          const data = await setRes.json();
          if (data && typeof data.managerPaymentAccessEnabled === 'boolean') {
            setSystemSettings(data);
          }
        }
      } catch {
        // Keep hydrated state if offline
      }
    };

    loadOwnerTelemetry();
    return () => {
      cancelled = true;
    };
  }, [authToken, currentUser.role, setAuditLogs, setSystemSettings]);

  // Workouts State (seeded across all coaches & members)
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([
    {
      id: 'WO-2026-01',
      memberId: 'WFIT-2026-001',
      memberName: 'Rohan Mehra',
      trainerId: 'TR-ALEX',
      trainerName: 'Alex Chen',
      title: 'Strength Hypertrophy Block A',
      focus: 'Barbell Squats & Overhead Pressing Mechanics',
      exercises: [
        { name: 'Barbell Back Squat', sets: '4', reps: '6', weight: '120 kg', notes: 'Maintain torso angle' },
        { name: 'Overhead Barbell Press', sets: '3', reps: '8', weight: '65 kg', notes: 'Full lockout at top' },
        { name: 'Romanian Deadlift', sets: '3', reps: '10', weight: '100 kg' },
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
    },
    {
      id: 'WO-2026-03',
      memberId: 'WFIT-2026-003',
      memberName: 'Vikramaditya Sengupta',
      trainerId: 'TR-MARCUS',
      trainerName: 'Marcus Stone',
      title: 'Metabolic Hypertrophy & Rotational Core',
      focus: 'Upper-Lower Split & Work-Capacity Intervals',
      exercises: [
        { name: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '30 kg dbs' },
        { name: 'Weighted Cable Row', sets: '4', reps: '12', weight: '65 kg' },
        { name: 'Landmine Rotational Press', sets: '3', reps: '10 each', weight: '25 kg' },
        { name: 'Assault Bike Sprint Finisher', sets: '6', reps: '20s/40s' }
      ],
      updatedAt: '2026-10-27',
      status: 'Active',
      coachNotes: 'Maintain strict 90-second rest periods between supersets.'
    },
    {
      id: 'WO-2026-04',
      memberId: 'WFIT-2026-004',
      memberName: 'Ananya Deshmukh',
      trainerId: 'TR-ELENA',
      trainerName: 'Elena Rostova',
      title: 'Thoracic Mobility & Joint Stability',
      focus: 'CARs Warmup, Split-Squat Tempo & Posterior Activation',
      exercises: [
        { name: 'Goblet Squat (3s Eccentric)', sets: '3', reps: '10', weight: '16 kg' },
        { name: 'Half-Kneeling Pallof Press', sets: '3', reps: '12 each', weight: '15 kg' },
        { name: 'Banded Face Pulls', sets: '3', reps: '15' }
      ],
      updatedAt: '2026-10-24',
      status: 'Completed',
      coachNotes: 'Ready for next 6-month endurance block upon renewal.'
    },
    {
      id: 'WO-2026-05',
      memberId: 'WFIT-2026-005',
      memberName: 'Kabir Oberoi',
      trainerId: 'TR-VIKRAM',
      trainerName: 'Vikram Rathore',
      title: 'Fight Conditioning & Explosive Power',
      focus: 'Heavy Bag Rounds, Medicine Ball Slams & Footwork',
      exercises: [
        { name: 'Heavy Bag Combo Rounds', sets: '5', reps: '3 min' },
        { name: 'Medicine Ball Rotational Slam', sets: '4', reps: '10', weight: '8 kg' },
        { name: 'Box Jump Rebounds', sets: '4', reps: '8' }
      ],
      updatedAt: '2026-10-29',
      status: 'Active',
      coachNotes: 'Keep guard high during late round exhaustion intervals.'
    }
  ]);

  // Member Exercise Completion Tracker (in-session)
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const toggleExerciseDone = (workoutId: string, exerciseIndex: number) => {
    const key = `${workoutId}:${exerciseIndex}`;
    setCompletedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Modals State
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isPaymentDemoOpen, setIsPaymentDemoOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedMemberForDrawer, setSelectedMemberForDrawer] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<typeof INITIAL_GALLERY_ITEMS[0] | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  // Destructive Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {}
  });

  // Workout Form State
  const [workoutForm, setWorkoutForm] = useState({
    memberId: members[0]?.id || 'WFIT-2026-001',
    title: '',
    focus: '',
    exercisesText: 'Barbell Squats (4x6)\nRomanian Deadlift (3x10)\nPlank Holds (3x60s)',
    coachNotes: ''
  });
  const [workoutStatusFilter, setWorkoutStatusFilter] = useState<'All' | 'Active' | 'Completed' | 'Archived'>('All');

  // Hardware Terminal Simulator State
  const [deviceOnline, setDeviceOnline] = useState(true);

  // Filters & Search
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('All');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('All');
  const [invoiceMethodFilter, setInvoiceMethodFilter] = useState<string>('All');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<string>('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('ALL');
  const [trainerClientSearch, setTrainerClientSearch] = useState('');

  // Role permissions evaluation
  const permissions = useMemo(() => {
    const isOwner = currentUser.role === 'OWNER / ADMIN';
    const isManager = currentUser.role === 'CLUB MANAGER';
    const isTrainer = currentUser.role === 'TRAINER';
    const isMember = currentUser.role === 'MEMBER';

    return {
      canViewFinances: isOwner || (isManager && systemSettings.managerPaymentAccessEnabled),
      canManageStaff: isOwner,
      canEditSecurity: isOwner,
      canManageMembers: isOwner || isManager,
      canManageWorkouts: isOwner || isManager || isTrainer,
      isTrainerOnly: isTrainer,
      isMemberOnly: isMember
    };
  }, [currentUser.role, systemSettings.managerPaymentAccessEnabled]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch =
        m.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        m.mobile.includes(memberSearchQuery) ||
        m.id.toLowerCase().includes(memberSearchQuery.toLowerCase());
      const matchesStatus = memberStatusFilter === 'All' || m.status === memberStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, memberSearchQuery, memberStatusFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.id.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
        (inv.demoTransactionId && inv.demoTransactionId.toLowerCase().includes(invoiceSearchQuery.toLowerCase())) ||
        inv.memberName.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) ||
        inv.memberId.toLowerCase().includes(invoiceSearchQuery.toLowerCase());
      const matchesStatus = invoiceStatusFilter === 'All' || inv.status === invoiceStatusFilter;
      const matchesMethod = invoiceMethodFilter === 'All' || inv.paymentMethod === invoiceMethodFilter;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [invoices, invoiceSearchQuery, invoiceStatusFilter, invoiceMethodFilter]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        l.name.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
        l.mobile.includes(leadSearchQuery) ||
        l.id.toLowerCase().includes(leadSearchQuery.toLowerCase());
      const matchesStage = leadStageFilter === 'All' || l.stage === leadStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [leads, leadSearchQuery, leadStageFilter]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(a => {
      const q = auditSearchQuery.toLowerCase();
      const matchesSearch =
        a.actor.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q) ||
        a.details.toLowerCase().includes(q);
      const matchesStatus = auditStatusFilter === 'ALL' || (a.status || 'SUCCESS') === auditStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [auditLogs, auditSearchQuery, auditStatusFilter]);

  // Current Member Record for Member Portal
  const currentMemberRecord = useMemo(() => {
    if (currentUser.role !== 'MEMBER') return members[0];
    return (
      members.find(m => m.id === currentUser.memberId) ||
      members.find(m => m.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      members[0]
    );
  }, [currentUser, members]);

  // Editable local copy for Member Self-Profile
  const [memberProfileForm, setMemberProfileForm] = useState({
    mobile: currentMemberRecord?.mobile || '',
    email: currentMemberRecord?.email || '',
    fitnessGoals: currentMemberRecord?.fitnessGoals || ''
  });
  useEffect(() => {
    if (currentMemberRecord) {
      setMemberProfileForm({
        mobile: currentMemberRecord.mobile || '',
        email: currentMemberRecord.email || '',
        fitnessGoals: currentMemberRecord.fitnessGoals || ''
      });
    }
  }, [currentMemberRecord]);

  // Current Member Invoices
  const currentMemberInvoices = useMemo(() => {
    if (currentUser.role !== 'MEMBER' || !currentMemberRecord) return [];
    return invoices.filter(inv => inv.memberId === currentMemberRecord.id);
  }, [currentUser.role, invoices, currentMemberRecord]);

  // Current Trainer Profile & Assigned Members
  const currentTrainerProfile = useMemo(() => {
    if (currentUser.role !== 'TRAINER') return trainers[0];
    return (
      trainers.find(t => t.id === currentUser.trainerId) ||
      trainers.find(t => t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      trainers[0]
    );
  }, [currentUser, trainers]);

  const [trainerProfileForm, setTrainerProfileForm] = useState({
    phone: currentTrainerProfile?.phone || '',
    workingHours: currentTrainerProfile?.workingHours || '',
    specialisation: currentTrainerProfile?.specialisation || '',
    bio: currentTrainerProfile?.bio || ''
  });
  useEffect(() => {
    if (currentTrainerProfile) {
      setTrainerProfileForm({
        phone: currentTrainerProfile.phone || '',
        workingHours: currentTrainerProfile.workingHours || '',
        specialisation: currentTrainerProfile.specialisation || '',
        bio: currentTrainerProfile.bio || ''
      });
    }
  }, [currentTrainerProfile]);

  const trainerAssignedMembers = useMemo(() => {
    if (currentUser.role !== 'TRAINER') return [];
    const targetTrainerId = currentTrainerProfile?.id || currentUser.trainerId;
    return members.filter(
      m => m.assignedTrainerId === targetTrainerId || currentTrainerProfile?.assignedMemberIds?.includes(m.id)
    );
  }, [currentUser.role, currentUser.trainerId, currentTrainerProfile, members]);

  const trainerWorkouts = useMemo(() => {
    if (currentUser.role !== 'TRAINER') return workouts;
    const targetTrainerId = currentTrainerProfile?.id || currentUser.trainerId;
    const assignedIds = new Set(trainerAssignedMembers.map(m => m.id));
    return workouts.filter(w => w.trainerId === targetTrainerId || assignedIds.has(w.memberId));
  }, [currentUser.role, currentUser.trainerId, currentTrainerProfile, trainerAssignedMembers, workouts]);

  // Financial Metrics (for Owner & Authorized Manager)
  const metrics = useMemo(() => {
    const totalBookedSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalTaxCollected = invoices.reduce((sum, inv) => sum + inv.tax, 0);
    const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalDiscounts = invoices.reduce((sum, inv) => sum + inv.discount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'DEMO PAID' || inv.status === 'Paid');
    const paymentsCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstandingDues = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const unpaidInvoicesCount = invoices.filter(inv => inv.balanceDue > 0).length;

    const activeMembersCount = members.filter(m => m.status === 'Active').length;
    const expiringCount = members.filter(m => m.status === 'Expiring Soon').length;
    const unpaidMembersCount = members.filter(m => m.status === 'Unpaid').length;
    const expiredCount = members.filter(m => m.status === 'Expired').length;

    return {
      totalBookedSales,
      totalTaxCollected,
      totalSubtotal,
      totalDiscounts,
      paymentsCollected,
      totalOutstandingDues,
      unpaidInvoicesCount,
      activeMembersCount,
      expiringCount,
      unpaidMembersCount,
      expiredCount,
      paidInvoicesCount: paidInvoices.length
    };
  }, [invoices, members]);

  // Helper to push an audit log locally
  const appendLocalAudit = (action: string, target: string, details: string, status: 'SUCCESS' | 'DENIED' | 'FAILED' = 'SUCCESS') => {
    const newLog: AuditLogItem = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: currentUser.email,
      role: currentUser.role,
      action,
      target,
      details,
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Member Renewal Handler
  const handleSimulateRenewal = async (member: Member, monthsToAdd: number) => {
    const now = new Date();
    const currentExpiry = new Date(member.expiryDate);
    const baseDate = currentExpiry > now ? currentExpiry : now;
    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
    const newExpiry = baseDate.toISOString().split('T')[0];

    const updatedMember: Member = { ...member, status: 'Active', expiryDate: newExpiry };
    setMembers(prev => prev.map(m => (m.id === member.id ? updatedMember : m)));

    if (authToken) {
      try {
        await fetch(`/api/members/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: 'Active', expiryDate: newExpiry })
        });
      } catch {
        // Offline fallback kept
      }
    }

    appendLocalAudit('Simulated Membership Renewal', `${member.fullName} (${member.id})`, `Extended membership by +${monthsToAdd} months to ${newExpiry}`);
    addToast('success', 'Membership Renewed', `${member.fullName}'s pass extended to ${newExpiry}.`);
  };

  // Delete Member Handler
  const handleDeleteMember = (member: Member) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove Member ${member.fullName}?`,
      message: `Are you sure you want to delete ${member.fullName} (${member.id}) from the active roster?`,
      confirmLabel: 'Delete Member',
      onConfirm: async () => {
        setMembers(prev => prev.filter(m => m.id !== member.id));
        if (authToken) {
          try {
            await fetch(`/api/members/${member.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` }
            });
          } catch {
            // Keep UI update
          }
        }
        appendLocalAudit('Member Deleted', member.id, `Removed ${member.fullName} from roster`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        addToast('info', 'Member Removed', `${member.fullName} was removed from the roster.`);
      }
    });
  };

  // Edit Member Save Handler (including Trainer Assignment)
  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToEdit) return;

    setMembers(prev => prev.map(m => (m.id === memberToEdit.id ? memberToEdit : m)));
    setTrainers(prev =>
      prev.map(t => {
        const shouldHave = memberToEdit.assignedTrainerId === t.id;
        const currentlyHas = t.assignedMemberIds.includes(memberToEdit.id);
        if (shouldHave && !currentlyHas) {
          return { ...t, assignedMemberIds: [...t.assignedMemberIds, memberToEdit.id] };
        }
        if (!shouldHave && currentlyHas) {
          return { ...t, assignedMemberIds: t.assignedMemberIds.filter(id => id !== memberToEdit.id) };
        }
        return t;
      })
    );

    if (authToken) {
      try {
        await fetch(`/api/members/${memberToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(memberToEdit)
        });
      } catch {
        // Keep UI state
      }
    }

    appendLocalAudit('Member Profile Updated', memberToEdit.id, `Updated details / coach assignment for ${memberToEdit.fullName}`);
    setMemberToEdit(null);
    addToast('success', 'Profile Updated', `Updated details for ${memberToEdit.fullName}.`);
  };

  // Plan Price Edit Handler
  const handleSavePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setPlans(prev => prev.map(p => (p.id === editingPlan.id ? editingPlan : p)));
    if (authToken && currentUser.role === 'OWNER / ADMIN') {
      try {
        await fetch(`/api/plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(editingPlan)
        });
      } catch {
        // Keep local change
      }
    }

    appendLocalAudit('Plan Pricing Updated', editingPlan.id, `Updated ${editingPlan.name} to ₹${editingPlan.price}`);
    setIsEditPlanModalOpen(false);
    setEditingPlan(null);
    addToast('success', 'Plan Price Updated', `${editingPlan.name} updated to ₹${editingPlan.price.toLocaleString('en-IN')}.`);
  };

  // Save Lead / Convert Lead Handlers
  const handleSaveLead = async (savedLead: Lead) => {
    const exists = leads.some(l => l.id === savedLead.id);
    if (exists) {
      setLeads(prev => prev.map(l => (l.id === savedLead.id ? savedLead : l)));
      if (authToken) {
        try {
          await fetch(`/api/leads/${savedLead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(savedLead)
          });
        } catch {}
      }
      addToast('success', 'Lead Updated', `Updated ${savedLead.name} (${savedLead.stage}).`);
    } else {
      setLeads(prev => [savedLead, ...prev]);
      try {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedLead)
        });
      } catch {}
      addToast('success', 'Lead Recorded', `Added ${savedLead.name} to enquiries pipeline.`);
    }
  };

  const handleConvertLeadToMember = async (lead: Lead) => {
    const defaultPlan = plans[1] || plans[0];
    const startDate = new Date().toISOString().split('T')[0];
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + defaultPlan.durationMonths);
    const expiryDate = expiry.toISOString().split('T')[0];
    const newId = `WFIT-2026-${String(members.length + 101).padStart(3, '0')}`;

    const newMember: Member = {
      id: newId,
      fullName: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      dateOfBirth: '1996-01-01',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
      registrationDate: startDate,
      branch: systemSettings.primaryBranch || 'Downtown Flagship',
      status: 'Active',
      planId: defaultPlan.id,
      planName: defaultPlan.name,
      startDate,
      expiryDate,
      assignedTrainerId: trainers[0]?.id || 'TR-ALEX',
      assignedTrainerName: trainers[0]?.name || 'Alex Chen',
      fitnessGoals: lead.notes || `Converted from ${lead.source} enquiry (${lead.interestedProduct})`,
      biometricEnrolled: true,
      biometricDeviceId: 'DEV-FP-MAIN-01',
      notes: `Converted from Lead ${lead.id}`
    };

    const updatedLead: Lead = { ...lead, stage: 'Converted', convertedMemberId: newId, lastContactDate: startDate };
    setMembers(prev => [newMember, ...prev]);
    setLeads(prev => prev.map(l => (l.id === lead.id ? updatedLead : l)));

    if (authToken) {
      try {
        await Promise.all([
          fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(newMember)
          }),
          fetch(`/api/leads/${lead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify(updatedLead)
          })
        ]);
        if (onRefreshAccounts) await onRefreshAccounts();
      } catch {}
    }

    appendLocalAudit('Lead Converted to Member', newId, `Converted ${lead.name} from ${lead.source} enquiry`);
    addToast('success', 'Lead Converted', `${lead.name} is now enrolled as Member ${newId}.`);
  };

  // Add Trainer Handler (with custom password)
  const handleSaveTrainer = async (newTrainer: TrainerProfile, createAccount: boolean, initialPassword?: string) => {
    setTrainers(prev => [newTrainer, ...prev]);

    if (createAccount) {
      const username = newTrainer.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
      const newStaffAccount: UserAccount = {
        id: `USR-${newTrainer.id}`,
        username,
        email: newTrainer.email,
        name: newTrainer.name,
        role: 'TRAINER',
        trainerId: newTrainer.id,
        branch: newTrainer.branch,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setStaffAccounts(prev => [newStaffAccount, ...prev]);
    }

    appendLocalAudit(
      'Trainer Enrolled',
      newTrainer.id,
      `Admin enrolled new trainer: ${newTrainer.name} (${newTrainer.specialisation})${createAccount ? ' + Portal Login' : ''}`
    );

    if (authToken && currentUser.role === 'OWNER / ADMIN') {
      try {
        const res = await fetch('/api/trainers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            name: newTrainer.name,
            email: newTrainer.email,
            phone: newTrainer.phone,
            specialisation: newTrainer.specialisation,
            branch: newTrainer.branch,
            workingHours: newTrainer.workingHours,
            experienceYears: newTrainer.experienceYears,
            certifications: newTrainer.certifications,
            bio: newTrainer.bio,
            photoUrl: newTrainer.photoUrl,
            createLoginAccount: createAccount,
            initialPassword
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.trainer) {
            setTrainers(prev => prev.map(t => (t.id === newTrainer.id ? data.trainer : t)));
          }
          if (data.account) {
            setStaffAccounts(prev => [data.account, ...prev.filter(a => a.email !== data.account.email)]);
          }
          if (onRefreshAccounts) {
            onRefreshAccounts();
          }
        }
      } catch {}
    }

    addToast(
      'success',
      'Trainer Enrolled',
      createAccount
        ? `Coach ${newTrainer.name} added! Select them anytime in the top Role Switcher.`
        : `Coach ${newTrainer.name} has been enrolled in the roster.`
    );
  };

  // Delete Trainer Handler
  const handleDeleteTrainer = (trainer: TrainerProfile) => {
    setConfirmDialog({
      isOpen: true,
      title: `Remove Coach ${trainer.name}?`,
      message: `Are you sure you want to remove ${trainer.name} from the certified trainer roster? Any members currently assigned to them will be unassigned.`,
      confirmLabel: 'Remove Trainer',
      onConfirm: async () => {
        setTrainers(prev => prev.filter(t => t.id !== trainer.id));
        setMembers(prev =>
          prev.map(m =>
            m.assignedTrainerId === trainer.id
              ? { ...m, assignedTrainerId: undefined, assignedTrainerName: undefined }
              : m
          )
        );
        setStaffAccounts(prev => prev.filter(acc => acc.trainerId !== trainer.id));

        if (authToken && currentUser.role === 'OWNER / ADMIN') {
          try {
            await fetch(`/api/trainers/${trainer.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${authToken}` }
            });
          } catch {}
        }

        appendLocalAudit('Trainer Removed', trainer.id, `Admin removed trainer ${trainer.name}`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        addToast('info', 'Trainer Removed', `Coach ${trainer.name} was removed from the roster.`);
      }
    });
  };

  // System Policy Toggle Handler
  const handleUpdateSystemSetting = async (key: keyof Pick<SystemSettings, 'managerPaymentAccessEnabled' | 'allowSelfRegistration' | 'biometricEnforcementActive'>, value: boolean) => {
    const nextSettings = { ...systemSettings, [key]: value };
    setSystemSettings(nextSettings);

    if (authToken && currentUser.role === 'OWNER / ADMIN') {
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ [key]: value })
        });
      } catch {}
    }

    appendLocalAudit('Security Policy Modified', key, `Set ${key} = ${value}`);
    addToast('info', 'Security Policy Updated', `${key} set to ${value ? 'ENABLED' : 'DISABLED'}.`);
  };

  // Toggle Staff/User Active Status
  const handleToggleAccountStatus = async (account: UserAccount) => {
    if (account.id === currentUser.id) {
      addToast('error', 'Action Blocked', 'You cannot deactivate your own active session account.');
      return;
    }
    const nextState = !account.isActive;
    setStaffAccounts(prev => prev.map(a => (a.id === account.id ? { ...a, isActive: nextState } : a)));

    if (authToken && currentUser.role === 'OWNER / ADMIN') {
      try {
        await fetch(`/api/staff-accounts/${account.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ isActive: nextState })
        });
        if (onRefreshAccounts) await onRefreshAccounts();
      } catch {}
    }

    appendLocalAudit('Account Status Modified', account.email, `${account.email} set active=${nextState}`);
    addToast('info', 'Account Updated', `${account.name} is now ${nextState ? 'Active' : 'Suspended'}.`);
  };

  // Trainer Self-Profile Save
  const handleSaveTrainerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrainerProfile) return;
    const updated: TrainerProfile = {
      ...currentTrainerProfile,
      phone: trainerProfileForm.phone,
      workingHours: trainerProfileForm.workingHours,
      specialisation: trainerProfileForm.specialisation,
      bio: trainerProfileForm.bio
    };
    setTrainers(prev => prev.map(t => (t.id === updated.id ? updated : t)));

    if (authToken) {
      try {
        await fetch(`/api/trainers/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(trainerProfileForm)
        });
      } catch {}
    }
    addToast('success', 'Coach Profile Updated', 'Your shift timings, bio, and contact details are saved.');
  };

  // Member Self-Profile Save
  const handleSaveMemberSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMemberRecord) return;
    const updated: Member = {
      ...currentMemberRecord,
      mobile: memberProfileForm.mobile,
      email: memberProfileForm.email,
      fitnessGoals: memberProfileForm.fitnessGoals
    };
    setMembers(prev => prev.map(m => (m.id === updated.id ? updated : m)));

    if (authToken) {
      try {
        await fetch(`/api/members/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(memberProfileForm)
        });
      } catch {}
    }
    addToast('success', 'Personal Profile Saved', 'Your contact details and training goals were updated.');
  };

  // Workout Status Updater
  const handleUpdateWorkoutStatus = async (workout: WorkoutPlan, nextStatus: WorkoutPlan['status']) => {
    const today = new Date().toISOString().split('T')[0];
    setWorkouts(prev => prev.map(w => (w.id === workout.id ? { ...w, status: nextStatus, updatedAt: today } : w)));
    if (authToken) {
      try {
        await fetch(`/api/workouts/${workout.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: nextStatus })
        });
      } catch {}
    }
    addToast('info', 'Workout Status Updated', `"${workout.title}" marked as ${nextStatus}.`);
  };

  // Renewal Reminder / Complete Action
  const handleUpdateRenewalTask = async (task: RenewalTask, nextStatus: 'Sent' | 'Renewed') => {
    const today = new Date().toISOString().split('T')[0];
    setRenewals(prev => prev.map(r => (r.id === task.id ? { ...r, status: nextStatus, lastReminderSentDate: today } : r)));
    if (nextStatus === 'Renewed') {
      const targetMember = members.find(m => m.id === task.memberId);
      if (targetMember) await handleSimulateRenewal(targetMember, 3);
    }
    if (authToken) {
      try {
        await fetch(`/api/renewals/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ status: nextStatus, lastReminderSentDate: today })
        });
      } catch {}
    }
    if (nextStatus === 'Sent') {
      addToast('success', 'Reminder Logged', `Renewal reminder dispatched to ${task.memberName}.`);
    }
  };

  // CSV Export Helpers
  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Navigation Tabs per Role
  const navTabs = useMemo(() => {
    if (currentUser.role === 'OWNER / ADMIN') {
      return [
        { id: 'dashboard', label: 'Dashboard & Metrics', icon: Activity },
        { id: 'members', label: `Members (${members.length})`, icon: Users },
        { id: 'leads', label: `Leads (${leads.length})`, icon: Target },
        { id: 'billing', label: `Demo Payments (${invoices.length})`, icon: CreditCard },
        { id: 'plans', label: 'Membership Plans', icon: Dumbbell },
        { id: 'trainers', label: `Trainers (${trainers.length})`, icon: UserCheck2 },
        { id: 'reports', label: 'Revenue & GST', icon: BarChart3 },
        { id: 'staff', label: `Staff & Policies (${staffAccounts.length})`, icon: Shield },
        { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: ShieldAlert },
        { id: 'gallery', label: 'Facility Gallery', icon: Image }
      ];
    }

    if (currentUser.role === 'CLUB MANAGER') {
      const items = [
        { id: 'dashboard', label: 'Operational Dashboard', icon: Activity },
        { id: 'members', label: `Member Roster (${members.length})`, icon: Users },
        { id: 'leads', label: `Leads Pipeline (${leads.length})`, icon: Target },
        { id: 'plans', label: 'Membership Plans', icon: Dumbbell },
        { id: 'trainers', label: `Trainers (${trainers.length})`, icon: UserCheck2 },
        { id: 'branch-ops', label: 'Turnstile & Renewals', icon: Fingerprint },
        { id: 'gallery', label: 'Facility Gallery', icon: Image }
      ];

      if (systemSettings.managerPaymentAccessEnabled) {
        items.splice(3, 0, { id: 'billing', label: `Demo Payments (${invoices.length})`, icon: CreditCard });
      }

      return items;
    }

    if (currentUser.role === 'TRAINER') {
      return [
        { id: 'trainer-dashboard', label: 'Trainer Overview', icon: Activity },
        { id: 'trainer-profile', label: 'My Coach Profile', icon: UserCheck },
        { id: 'trainer-members', label: `Assigned Clients (${trainerAssignedMembers.length})`, icon: Users },
        { id: 'trainer-workouts', label: 'Workout Programming', icon: Dumbbell },
        { id: 'gallery', label: 'Facility Gallery', icon: Image }
      ];
    }

    if (currentUser.role === 'MEMBER') {
      return [
        { id: 'member-dashboard', label: 'My Member Dashboard', icon: Activity },
        { id: 'member-profile', label: 'My Profile & Pass', icon: UserCheck },
        { id: 'member-payments', label: `Payments & Receipts (${currentMemberInvoices.length})`, icon: CreditCard },
        { id: 'member-workouts', label: 'My Workout Program', icon: ClipboardList },
        { id: 'gallery', label: 'Club Gallery', icon: Image }
      ];
    }

    return [];
  }, [
    currentUser.role, members.length, leads.length, invoices.length, trainers.length,
    staffAccounts.length, auditLogs.length, systemSettings.managerPaymentAccessEnabled,
    trainerAssignedMembers.length, currentMemberInvoices.length
  ]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#172033] font-sans antialiased relative pb-16">
      {/* =========================================================================
          UNIFIED ROLE SWITCHER & DEMO SESSION UTILITY BAR
      ========================================================================= */}
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px] tracking-wider border border-emerald-500/30 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ROLE SWITCHER ACTIVE
          </span>
          <span className="text-slate-300 font-medium hidden xl:inline">
            Instant RBAC Preview • No Login Required
          </span>
        </div>

        {/* Quick Multi-Role Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden lg:inline font-mono">Switch Role:</span>

          <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = currentUser.email.toLowerCase() === acc.email.toLowerCase() || currentUser.id === acc.id;
              const shortRole =
                acc.role === 'OWNER / ADMIN' ? 'Admin' :
                acc.role === 'CLUB MANAGER' ? 'Manager' :
                acc.role === 'TRAINER' ? 'Trainer' :
                acc.memberId === 'WFIT-2026-003' ? 'Member (Dues)' : 'Member';
              return (
                <button
                  key={acc.id}
                  onClick={() => onSwitchDemoAccount && onSwitchDemoAccount(acc)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                  title={`Switch instantly to ${acc.name} (${acc.role})`}
                >
                  {shortRole}
                </button>
              );
            })}
          </div>

          <select
            aria-label="Switch to any registered trainer, manager, or member profile"
            value={staffAccounts.find(a => a.email.toLowerCase() === currentUser.email.toLowerCase())?.id || currentUser.id}
            onChange={(e) => {
              const picked = staffAccounts.find(a => a.id === e.target.value);
              if (picked && onSwitchDemoAccount) {
                onSwitchDemoAccount(picked);
              }
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:border-blue-400 cursor-pointer max-w-[200px]"
            title="Select any Admin, Manager, Trainer, or Member persona"
          >
            {staffAccounts.map(acc => (
              <option key={acc.id} value={acc.id} disabled={!acc.isActive}>
                {acc.role} — {acc.name.split(' (')[0]}{!acc.isActive ? ' (Suspended)' : ''}
              </option>
            ))}
          </select>

          {onResetDemoData && (
            <button
              onClick={onResetDemoData}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Restore original sample data"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TOP NAVIGATION HEADER (WHITE THEME) ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Left: Brand Plate & Back To Website */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#172033] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#5B6475]" />
            <span>Public Website</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-archivo-brand text-lg font-bold tracking-widest text-[#172033] uppercase">
              WFIT
            </span>
            <span className="text-[#CBD5E1] text-sm font-light">/</span>
            <span className="text-xs font-mono font-semibold tracking-wider text-[#5B6475] uppercase hidden sm:inline">
              CRM OPERATIONS
            </span>
          </div>
        </div>

        {/* Center: Current User & Role Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-full text-xs shadow-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                currentUser.role === 'OWNER / ADMIN' ? 'bg-[#1D4ED8]' :
                currentUser.role === 'CLUB MANAGER' ? 'bg-sky-500' :
                currentUser.role === 'TRAINER' ? 'bg-purple-500' : 'bg-[#15803D]'
              }`}
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#172033] max-w-[140px] sm:max-w-none truncate">{currentUser.name}</span>
              <span className="text-[#CBD5E1] hidden sm:inline">|</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                  currentUser.role === 'OWNER / ADMIN' ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200' :
                  currentUser.role === 'CLUB MANAGER' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                  currentUser.role === 'TRAINER' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  'bg-emerald-50 text-[#15803D] border border-emerald-200'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {permissions.canManageMembers && (
            <button
              onClick={() => setIsBiometricModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Launch Biometric Turnstile Hardware Terminal Simulator"
            >
              <Fingerprint className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span className="hidden md:inline">Turnstile Terminal</span>
            </button>
          )}

          {(permissions.canViewFinances || currentUser.role === 'MEMBER') && (
            <button
              onClick={() => setIsPaymentDemoOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              title="Launch Interactive Payment Demo Modal"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Payment Demo</span>
            </button>
          )}
        </div>
      </header>

      {/* ================= SECONDARY ROLE-RESTRICTED SUB-NAVIGATION TABS ================= */}
      <nav aria-label="Sub-navigation" className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1.5 py-2.5 min-w-max text-xs">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200 shadow-xs'
                    : 'text-[#5B6475] hover:text-[#172033] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1D4ED8]' : 'text-[#70798A]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= MAIN DASHBOARD VIEWS ================= */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* =========================================================================
            VIEW 1: OWNER / ADMIN DASHBOARD
        ========================================================================= */}
        {currentUser.role === 'OWNER / ADMIN' && activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">
                    Gym Owner & Executive KPI Overview
                  </h3>
                  <p className="text-xs text-[#5B6475]">
                    Comprehensive real-time overview of membership volume, simulated collections, trainer roster, leads pipeline, and security posture.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPaymentDemoOpen(true)}
                  className="px-3.5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Test Payment Demo</span>
                </button>
                <button
                  onClick={() => setIsTrainerModalOpen(true)}
                  className="px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Add Trainer</span>
                </button>
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between text-xs text-[#5B6475] uppercase font-mono font-semibold">
                  <span>Simulated Total Sales</span>
                  <Activity className="w-4 h-4 text-[#70798A]" />
                </div>
                <div className="my-3">
                  <div className="font-archivo-title text-3xl font-bold text-[#172033] tracking-tight">
                    ₹{metrics.totalBookedSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-[#5B6475] mt-1">
                    Booked invoice value across memberships
                  </div>
                </div>
                <div className="text-[11px] text-[#70798A] border-t border-[#E2E8F0] pt-2 font-mono">
                  *Demonstration metrics only
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between text-xs text-[#15803D] uppercase font-mono font-bold">
                  <span>Simulated Collections</span>
                  <DollarSign className="w-4 h-4 text-[#15803D]" />
                </div>
                <div className="my-3">
                  <div className="font-archivo-title text-3xl font-bold text-[#15803D] tracking-tight">
                    ₹{metrics.paymentsCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-[#15803D] mt-1 font-medium">
                    {metrics.paidInvoicesCount} transactions settled
                  </div>
                </div>
                <div className="text-[11px] text-[#70798A] border-t border-[#E2E8F0] pt-2 font-mono">
                  Cash + UPI + Gateway Demo
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                <div className="flex justify-between text-xs text-[#5B6475] uppercase font-mono font-semibold">
                  <span>Active Members</span>
                  <Users className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <div className="my-3">
                  <div className="font-archivo-title text-3xl font-bold text-[#1D4ED8] tracking-tight">
                    {metrics.activeMembersCount} / {members.length}
                  </div>
                  <div className="text-xs text-[#5B6475] mt-1">
                    {metrics.expiringCount} expiring soon • {metrics.unpaidMembersCount} unpaid
                  </div>
                </div>
                <div className="text-[11px] text-[#70798A] border-t border-[#E2E8F0] pt-2">
                  {leads.length} enquiries in active CRM pipeline
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between text-xs text-[#B45309] uppercase font-mono font-bold">
                  <span>Simulated Outstanding</span>
                  <AlertCircle className="w-4 h-4 text-[#B45309]" />
                </div>
                <div className="my-3">
                  <div className="font-archivo-title text-3xl font-bold text-[#B45309] tracking-tight">
                    ₹{metrics.totalOutstandingDues.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-[#5B6475] mt-1">
                    {metrics.unpaidInvoicesCount} invoices pending clearance
                  </div>
                </div>
                <div className="text-[11px] text-[#70798A] border-t border-[#E2E8F0] pt-2">
                  Gate simulator blocks entry for unpaid
                </div>
              </div>
            </div>

            {/* Chart & Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#172033]">Monthly Simulated Collections Trend</h4>
                    <p className="text-[11px] text-[#5B6475]">6-month collection trajectory</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Open GST & Revenue Reports →
                  </button>
                </div>

                <div className="pt-2">
                  <div className="h-44 flex items-end gap-3 sm:gap-6 pt-4 border-b border-[#E2E8F0] pb-2">
                    {[
                      { month: 'May', height: '55%', amount: '₹1,45,000' },
                      { month: 'Jun', height: '65%', amount: '₹1,82,000' },
                      { month: 'Jul', height: '80%', amount: '₹2,20,000' },
                      { month: 'Aug', height: '70%', amount: '₹1,95,000' },
                      { month: 'Sep', height: '90%', amount: '₹2,60,000' },
                      { month: 'Oct', height: '100%', amount: `₹${metrics.paymentsCollected.toLocaleString('en-IN')}`, active: true }
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <span className="text-[10px] font-mono text-[#70798A] opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.amount}
                        </span>
                        <div
                          style={{ height: item.height }}
                          className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer ${
                            item.active ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] shadow-md' : 'bg-slate-200 hover:bg-slate-300'
                          }`}
                        />
                        <span className={`text-[11px] font-semibold mt-1 ${item.active ? 'text-[#1D4ED8] font-bold' : 'text-[#70798A]'}`}>
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-bold text-sm text-[#172033]">Plan Distribution</h4>
                  <span className="text-xs font-mono text-[#5B6475]">{members.length} Members</span>
                </div>
                <div className="space-y-3 pt-1">
                  {plans.map(p => {
                    const count = members.filter(m => m.planId === p.id).length;
                    const percent = Math.round((count / (members.length || 1)) * 100);
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#172033]">{p.name}</span>
                          <span className="font-mono text-[#5B6475]">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D4ED8] rounded-full" style={{ width: `${Math.max(percent, 8)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] text-center">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                  >
                    Manage & Edit Plan Prices →
                  </button>
                </div>
              </div>
            </div>

            {/* Coaching Staff Summary */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#172033]">Head Coaching Staff (Roster Summary)</h4>
                  <p className="text-[11px] text-[#5B6475]">Certified coaching staff assigned across active membership tiers</p>
                </div>
                <button
                  onClick={() => setActiveTab('trainers')}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Manage Trainer Roster →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainers.map(tr => (
                  <div key={tr.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center gap-3">
                    <AvatarImage
                      src={tr.photoUrl}
                      name={tr.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0] shrink-0"
                      fallbackClassName="w-12 h-12 rounded-full bg-blue-100 text-[#1D4ED8] font-bold text-sm flex items-center justify-center shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-[#172033] truncate">{tr.name}</div>
                      <div className="text-[10px] text-[#1D4ED8] font-semibold truncate">{tr.specialisation.split(',')[0]}</div>
                      <div className="text-[10px] text-[#70798A] mt-0.5">{tr.experienceYears || 3} Yrs • {tr.assignedMemberIds.length} Clients</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CLUB MANAGER DASHBOARD
        ========================================================================= */}
        {currentUser.role === 'CLUB MANAGER' && activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">
                    Club Operational Desk & Member Administration
                  </h3>
                  <p className="text-xs text-[#5B6475]">
                    Manage branch attendance, leads, registrations, membership renewals, and coach scheduling for {currentUser.branch || 'Downtown Flagship'}.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setLeadToEdit(null); setIsLeadModalOpen(true); }}
                  className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Enquiry</span>
                </button>
                <button
                  onClick={() => setIsMemberModalOpen(true)}
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Member</span>
                </button>
              </div>
            </div>

            {/* Operational stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                <div className="text-xs text-[#5B6475] uppercase font-mono font-semibold">Total Roster</div>
                <div className="text-3xl font-bold text-[#172033] mt-2">{members.length}</div>
                <div className="text-[11px] text-[#70798A] mt-1">Registered profiles</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                <div className="text-xs text-[#15803D] uppercase font-mono font-bold">Active Clearances</div>
                <div className="text-3xl font-bold text-[#15803D] mt-2">
                  {members.filter(m => m.status === 'Active').length}
                </div>
                <div className="text-[11px] text-[#70798A] mt-1">Biometrics enabled</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
                <div className="text-xs text-[#B45309] uppercase font-mono font-bold">Renewals Due</div>
                <div className="text-3xl font-bold text-[#B45309] mt-2">
                  {members.filter(m => m.status === 'Expiring Soon' || m.status === 'Expired').length}
                </div>
                <div className="text-[11px] text-[#70798A] mt-1">{renewals.length} follow-up tasks</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                <div className="text-xs text-[#5B6475] uppercase font-mono font-semibold">Turnstile Logs</div>
                <div className="text-3xl font-bold text-[#1D4ED8] mt-2">{biometricLogs.length}</div>
                <div className="text-[11px] text-[#70798A] mt-1">Device {deviceOnline ? 'Online' : 'Offline'}</div>
              </div>
            </div>

            {!systemSettings.managerPaymentAccessEnabled && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#B45309] flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Owner Security Policy Active:</strong> Financial billing tabs and invoice totals are currently hidden for Club Managers. Ask an Owner/Admin to toggle Manager Payment Access under <em>Staff & Policies</em> if needed.
                </span>
              </div>
            )}

            {/* Quick Renewal Action List */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                <h4 className="font-bold text-sm text-[#172033]">Quick Membership Action & Renewal Simulator</h4>
                <span className="text-xs font-mono text-[#5B6475]">Click "+Mo" to extend expiry</span>
              </div>

              <div className="space-y-3">
                {members.map(m => (
                  <div key={m.id} className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={m.photoUrl}
                        name={m.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]"
                        fallbackClassName="w-10 h-10 rounded-full bg-slate-200 text-[#172033] font-bold text-xs flex items-center justify-center shrink-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-[#172033] flex items-center gap-2">
                          <span>{m.fullName}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            m.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                            m.status === 'Expiring Soon' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                            m.status === 'Unpaid' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            'bg-rose-50 text-[#B91C1C] border border-rose-200'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5B6475] font-mono">
                          {m.id} • {m.planName} • Valid till: <strong className="text-[#172033]">{m.expiryDate}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSimulateRenewal(m, 1)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] rounded text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        +1 Mo
                      </button>
                      <button
                        onClick={() => handleSimulateRenewal(m, 3)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#172033] border border-[#E2E8F0] rounded text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        +3 Mo
                      </button>
                      <button
                        onClick={() => handleSimulateRenewal(m, 12)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 rounded text-xs font-bold cursor-pointer shadow-xs"
                      >
                        +1 Yr
                      </button>
                      <button
                        onClick={() => setMemberToEdit(m)}
                        className="p-1.5 bg-white hover:bg-slate-100 text-[#5B6475] border border-[#E2E8F0] rounded text-xs cursor-pointer shadow-xs"
                        title="Edit Member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3A: TRAINER OVERVIEW TAB (`trainer-dashboard`) — ZERO FINANCIAL INFO
        ========================================================================= */}
        {currentUser.role === 'TRAINER' && activeTab === 'trainer-dashboard' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <AvatarImage
                  src={currentTrainerProfile?.photoUrl}
                  name={currentTrainerProfile?.name || currentUser.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-purple-200 bg-slate-100 shadow-sm shrink-0"
                  fallbackClassName="w-14 h-14 rounded-full bg-purple-100 text-purple-700 font-bold text-lg flex items-center justify-center shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-[#172033]">{currentTrainerProfile?.name || currentUser.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                      COACH {currentTrainerProfile?.id || currentUser.trainerId}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6475] mt-0.5">
                    {currentTrainerProfile?.specialisation}
                  </p>
                  <p className="text-[11px] text-[#70798A] mt-0.5">
                    Branch: {currentUser.branch || 'Downtown Flagship'} • Hours: {currentTrainerProfile?.workingHours}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWorkoutModalOpen(true)}
                className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Program Workout</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                <span className="text-xs text-[#5B6475] uppercase font-mono font-semibold">Assigned Active Clients</span>
                <div className="text-2xl font-bold text-[#172033] mt-1">{trainerAssignedMembers.length}</div>
                <div className="text-[11px] text-[#70798A] mt-1">Direct coaching roster</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                <span className="text-xs text-[#5B6475] uppercase font-mono font-semibold">Scheduled PT Packages</span>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  {ptSessions.filter(s => s.trainerId === (currentTrainerProfile?.id || currentUser.trainerId)).length}
                </div>
                <div className="text-[11px] text-[#70798A] mt-1">Active coaching blocks</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
                <span className="text-xs text-[#5B6475] uppercase font-mono font-semibold">Active Workouts Programmed</span>
                <div className="text-2xl font-bold text-[#1D4ED8] mt-1">
                  {trainerWorkouts.length}
                </div>
                <div className="text-[11px] text-[#70798A] mt-1">Training progressions</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Trainer Security Protocol:</strong> Financial ledgers, invoice totals, subscription fees, and club revenue are strictly quarantined from coach views.
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-bold text-sm text-[#172033]">My Assigned Clients</h4>
                  <button onClick={() => setActiveTab('trainer-members')} className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer">
                    Full Client Roster →
                  </button>
                </div>
                <div className="space-y-3">
                  {trainerAssignedMembers.length === 0 ? (
                    <p className="text-xs text-[#70798A] py-4 text-center">No clients assigned yet. Contact Club Manager to assign clients.</p>
                  ) : trainerAssignedMembers.map(member => (
                    <div key={member.id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <AvatarImage src={member.photoUrl} name={member.fullName} className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0]" />
                        <div>
                          <div className="font-bold text-[#172033]">{member.fullName}</div>
                          <div className="text-[11px] font-mono text-[#70798A]">{member.id} • {member.status}</div>
                          {member.fitnessGoals && <div className="text-[10px] text-[#5B6475] mt-0.5 line-clamp-1">Goal: {member.fitnessGoals}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setWorkoutForm(prev => ({ ...prev, memberId: member.id, title: `${member.fullName}'s Progression` }));
                          setIsWorkoutModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                      >
                        Program
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                  <h4 className="font-bold text-sm text-[#172033]">Recent Workout Programs</h4>
                  <button onClick={() => setActiveTab('trainer-workouts')} className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer">
                    Manage All →
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {trainerWorkouts.length === 0 ? (
                    <div className="py-6 text-center space-y-3">
                      <p className="text-xs text-[#70798A]">No workout blocks created by you yet.</p>
                      <button
                        onClick={() => {
                          setWorkoutForm(prev => ({
                            ...prev,
                            memberId: trainerAssignedMembers[0]?.id || members[0]?.id || 'WFIT-2026-001',
                            title: ''
                          }));
                          setIsWorkoutModalOpen(true);
                        }}
                        className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Program</span>
                      </button>
                    </div>
                  ) : trainerWorkouts.slice(0, 4).map(wo => (
                    <div key={wo.id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-[#172033]">{wo.title}</div>
                          <div className="text-[11px] text-[#1D4ED8] font-semibold">Client: {wo.memberName}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-[#15803D] border border-emerald-200 font-bold">
                          {wo.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5B6475]">{wo.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3B: TRAINER PROFILE & PASSWORD SECURITY (`trainer-profile`)
        ========================================================================= */}
        {currentUser.role === 'TRAINER' && activeTab === 'trainer-profile' && currentTrainerProfile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveTrainerProfile} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
                <AvatarImage
                  src={currentTrainerProfile.photoUrl}
                  name={currentTrainerProfile.name}
                  className="w-14 h-14 rounded-full object-cover border border-purple-200"
                />
                <div>
                  <h3 className="text-base font-bold text-[#172033]">My Coach Profile</h3>
                  <p className="text-xs text-[#5B6475] font-mono">{currentTrainerProfile.email} • {currentTrainerProfile.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#5B6475] mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={trainerProfileForm.phone}
                    onChange={(e) => setTrainerProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5B6475] mb-1">Working Shift Hours</label>
                  <input
                    type="text"
                    value={trainerProfileForm.workingHours}
                    onChange={(e) => setTrainerProfileForm(p => ({ ...p, workingHours: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-[#5B6475] mb-1">Primary Specialisation</label>
                <input
                  type="text"
                  value={trainerProfileForm.specialisation}
                  onChange={(e) => setTrainerProfileForm(p => ({ ...p, specialisation: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                />
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-[#5B6475] mb-1">Coaching Bio</label>
                <textarea
                  rows={3}
                  value={trainerProfileForm.bio}
                  onChange={(e) => setTrainerProfileForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                />
              </div>

              {currentTrainerProfile.certifications && (
                <div>
                  <span className="text-xs font-semibold text-[#5B6475] block mb-1.5">Verified Certifications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentTrainerProfile.certifications.map((c, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-[#15803D]">
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Save Coach Profile
              </button>
            </form>

            {/* Coaching Assignment & Role Isolation Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Coach Operations & Access Scope</h3>
                  <p className="text-xs text-[#5B6475]">Active branch schedule, coaching roster, and RBAC boundary</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Coach ID</span>
                  <span className="font-mono font-bold text-[#172033]">{currentTrainerProfile.id}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Primary Branch</span>
                  <span className="font-bold text-[#172033]">{currentTrainerProfile.branch}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Experience</span>
                  <span className="font-bold text-[#1D4ED8]">{currentTrainerProfile.experienceYears} Years</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Assigned Clients</span>
                  <span className="font-bold text-purple-700">{trainerAssignedMembers.length} Active</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="font-bold">Strict Financial Firewall</div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Trainer view grants complete access to assigned athletes, workout programming, and PT logs while blocking club revenue, GST invoices, and payment ledgers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('trainer-members')}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#172033] font-bold text-xs rounded-xl cursor-pointer"
                >
                  View Client Roster
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('trainer-workouts')}
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Open Workout Planner
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3C: TRAINER ASSIGNED CLIENTS (`trainer-members`) — ZERO FINANCIAL INFO
        ========================================================================= */}
        {currentUser.role === 'TRAINER' && activeTab === 'trainer-members' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">My Assigned Training Clients ({trainerAssignedMembers.length})</h3>
                <p className="text-xs text-[#5B6475]">Non-financial client training directory with goals and PT session progress.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                <input
                  type="text"
                  placeholder="Search assigned client..."
                  value={trainerClientSearch}
                  onChange={(e) => setTrainerClientSearch(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#172033]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainerAssignedMembers
                .filter(m => m.fullName.toLowerCase().includes(trainerClientSearch.toLowerCase()) || m.id.toLowerCase().includes(trainerClientSearch.toLowerCase()))
                .map(client => {
                  const pt = ptSessions.find(s => s.memberId === client.id && s.trainerId === (currentTrainerProfile?.id || currentUser.trainerId));
                  return (
                    <div key={client.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <AvatarImage src={client.photoUrl} name={client.fullName} className="w-12 h-12 rounded-full object-cover border border-[#E2E8F0]" />
                          <div>
                            <h4 className="font-bold text-sm text-[#172033]">{client.fullName}</h4>
                            <span className="text-[11px] font-mono text-[#70798A]">{client.id} • {client.branch}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          client.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : 'bg-amber-50 text-[#B45309] border border-amber-200'
                        }`}>
                          {client.status}
                        </span>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                        <span className="font-bold text-[#172033] block">Fitness Goals & Notes:</span>
                        <p className="text-[#5B6475]">{client.fitnessGoals || client.notes || 'General strength and hypertrophy programming.'}</p>
                      </div>

                      {pt && (
                        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-purple-900">{pt.packageName}</div>
                            <div className="text-[11px] text-purple-700 font-mono">Valid till {pt.expiryDate}</div>
                          </div>
                          <span className="font-mono font-bold text-purple-900">
                            {pt.completedSessions}/{pt.totalSessions} Done
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setWorkoutForm(prev => ({ ...prev, memberId: client.id, title: `${client.fullName}'s Coaching Block` }));
                            setIsWorkoutModalOpen(true);
                          }}
                          className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign Workout Program</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3D: TRAINER WORKOUT PROGRAMMING (`trainer-workouts`)
        ========================================================================= */}
        {currentUser.role === 'TRAINER' && activeTab === 'trainer-workouts' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Workout Programming & Periodization</h3>
                <p className="text-xs text-[#5B6475]">Design exercise prescriptions, sets, reps, and biomechanical coach cues.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={workoutStatusFilter}
                  onChange={(e) => setWorkoutStatusFilter(e.target.value as any)}
                  className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
                <button
                  onClick={() => {
                    setWorkoutForm(prev => ({
                      ...prev,
                      memberId: trainerAssignedMembers[0]?.id || members[0]?.id || 'WFIT-2026-001'
                    }));
                    setIsWorkoutModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Workout Plan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {trainerWorkouts
                .filter(w => workoutStatusFilter === 'All' || w.status === workoutStatusFilter)
                .length === 0 ? (
                <div className="md:col-span-2 p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center space-y-3">
                  <p className="text-xs text-[#5B6475]">No workout blocks match this coach or filter yet.</p>
                  <button
                    onClick={() => {
                      setWorkoutForm(prev => ({
                        ...prev,
                        memberId: trainerAssignedMembers[0]?.id || members[0]?.id || 'WFIT-2026-001'
                      }));
                      setIsWorkoutModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#1D4ED8] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + Assign First Program
                  </button>
                </div>
              ) : trainerWorkouts
                .filter(w => workoutStatusFilter === 'All' || w.status === workoutStatusFilter)
                .map(wo => (
                  <div key={wo.id} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#70798A]">{wo.id} • Updated {wo.updatedAt}</span>
                        <h4 className="font-bold text-sm text-[#172033]">{wo.title}</h4>
                        <p className="text-xs font-semibold text-[#1D4ED8]">Client: {wo.memberName} ({wo.memberId})</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        wo.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                        wo.status === 'Completed' ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200' :
                        'bg-slate-100 text-[#5B6475] border border-slate-200'
                      }`}>
                        {wo.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#5B6475]">Focus: {wo.focus}</div>

                    <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                      {wo.exercises.map((ex, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-[#F8FAFC] px-3 py-1.5 rounded-lg">
                          <span className="font-medium text-[#172033]">{ex.name}</span>
                          <span className="font-mono font-bold text-[#1D4ED8]">{ex.sets} × {ex.reps} {ex.weight ? `(${ex.weight})` : ''}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] text-xs">
                      {wo.status !== 'Completed' && (
                        <button
                          onClick={() => handleUpdateWorkoutStatus(wo, 'Completed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] border border-emerald-200 hover:bg-emerald-100 font-bold cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                      {wo.status !== 'Archived' && (
                        <button
                          onClick={() => handleUpdateWorkoutStatus(wo, 'Archived')}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 text-[#5B6475] border border-[#E2E8F0] hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Archive
                        </button>
                      )}
                      {wo.status !== 'Active' && (
                        <button
                          onClick={() => handleUpdateWorkoutStatus(wo, 'Active')}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#1D4ED8] border border-blue-200 hover:bg-blue-100 font-bold cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4A: MEMBER DASHBOARD (`member-dashboard`)
        ========================================================================= */}
        {currentUser.role === 'MEMBER' && activeTab === 'member-dashboard' && currentMemberRecord && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <AvatarImage
                  src={currentMemberRecord.photoUrl}
                  name={currentMemberRecord.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                  fallbackClassName="w-16 h-16 rounded-full bg-blue-100 text-[#1D4ED8] font-bold text-lg flex items-center justify-center shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#172033]">{currentMemberRecord.fullName}</h3>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      currentMemberRecord.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                      currentMemberRecord.status === 'Expiring Soon' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                      currentMemberRecord.status === 'Unpaid' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-rose-50 text-[#B91C1C] border border-rose-200'
                    }`}>
                      {currentMemberRecord.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#5B6475] mt-1">
                    Member ID: <strong className="text-[#172033]">{currentMemberRecord.id}</strong> • {currentMemberRecord.branch}
                  </div>
                  <div className="text-xs text-[#70798A] mt-0.5">
                    {currentMemberRecord.mobile} • {currentMemberRecord.email || currentUser.email}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setActiveTab('member-workouts')}
                  className="px-4 py-2.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Open Workout Program
                </button>
                <button
                  onClick={() => setIsPaymentDemoOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay / Renew Membership</span>
                </button>
              </div>
            </div>

            {/* Member Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-mono uppercase text-[#5B6475] font-semibold">Current Pass</span>
                <div className="text-base font-bold text-[#1D4ED8] mt-1">{currentMemberRecord.planName}</div>
                <div className="text-xs font-mono text-[#15803D] mt-1">Expires: {currentMemberRecord.expiryDate}</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-mono uppercase text-[#5B6475] font-semibold">Biometric Turnstile</span>
                <div className="text-base font-bold text-[#172033] mt-1">
                  {currentMemberRecord.biometricEnrolled ? 'Enrolled (Active)' : 'Pending Desk Setup'}
                </div>
                <div className="text-xs text-[#70798A] mt-1">Gate Access: {currentMemberRecord.status === 'Active' ? 'Cleared' : 'Restricted'}</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-mono uppercase text-[#5B6475] font-semibold">Assigned Coach</span>
                <div className="text-base font-bold text-[#172033] mt-1">{currentMemberRecord.assignedTrainerName || 'Alex Chen'}</div>
                <div className="text-xs text-[#70798A] mt-1">Personal Programming</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
                <span className="text-[11px] font-mono uppercase text-[#5B6475] font-semibold">Billing Balance</span>
                <div className={`text-base font-bold font-mono mt-1 ${
                  currentMemberInvoices.some(i => i.balanceDue > 0) ? 'text-[#B91C1C]' : 'text-[#15803D]'
                }`}>
                  ₹{currentMemberInvoices.reduce((s, i) => s + i.balanceDue, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#70798A] mt-1">{currentMemberInvoices.length} Total Invoices</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Member Invoices */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
                <div className="border-b border-[#E2E8F0] pb-3 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#172033]">Recent Invoices</h4>
                  <button onClick={() => setActiveTab('member-payments')} className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer">
                    All Invoices →
                  </button>
                </div>
                <div className="space-y-3">
                  {currentMemberInvoices.length === 0 ? (
                    <p className="text-xs text-[#70798A] py-4 text-center">No invoices on file yet. Click "Pay / Renew Membership" above to try checkout.</p>
                  ) : currentMemberInvoices.map(inv => (
                    <div key={inv.id} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-mono font-bold text-[#172033]">{inv.id}</div>
                        <div className="text-[11px] text-[#5B6475]">₹{inv.total.toLocaleString('en-IN')} • {inv.status}</div>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        View Receipt
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Program Preview */}
              <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm">
                <div className="border-b border-[#E2E8F0] pb-3 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-[#172033]">My Active Training Block</h4>
                  <button onClick={() => setActiveTab('member-workouts')} className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer">
                    Interactive Tracker →
                  </button>
                </div>
                {workouts.filter(w => w.memberId === currentMemberRecord.id).length === 0 ? (
                  <p className="text-xs text-[#70798A] py-4 text-center">Your coach hasn't uploaded a workout block yet.</p>
                ) : workouts.filter(w => w.memberId === currentMemberRecord.id).slice(0, 1).map(wo => (
                  <div key={wo.id} className="space-y-3 text-xs">
                    <div>
                      <div className="font-bold text-sm text-[#172033]">{wo.title}</div>
                      <div className="text-[#5B6475]">{wo.focus}</div>
                    </div>
                    <div className="space-y-1.5">
                      {wo.exercises.map((ex, i) => (
                        <div key={i} className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="font-semibold text-[#172033]">{ex.name}</span>
                          <span className="font-mono font-bold text-[#1D4ED8]">{ex.sets} × {ex.reps} {ex.weight ? `(${ex.weight})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4B: MEMBER PROFILE & ACCOUNT SECURITY (`member-profile`)
        ========================================================================= */}
        {currentUser.role === 'MEMBER' && activeTab === 'member-profile' && currentMemberRecord && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveMemberSelfProfile} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
                <AvatarImage src={currentMemberRecord.photoUrl} name={currentMemberRecord.fullName} className="w-14 h-14 rounded-full object-cover border border-blue-200" />
                <div>
                  <h3 className="text-base font-bold text-[#172033]">{currentMemberRecord.fullName}</h3>
                  <p className="text-xs font-mono text-[#5B6475]">{currentMemberRecord.id} • {currentMemberRecord.planName} ({currentMemberRecord.status})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#70798A] block">Home Branch</span>
                  <strong className="text-[#172033]">{currentMemberRecord.branch}</strong>
                </div>
                <div>
                  <span className="text-[#70798A] block">Valid Until</span>
                  <strong className="font-mono text-[#15803D]">{currentMemberRecord.expiryDate}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#5B6475] mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={memberProfileForm.mobile}
                    onChange={(e) => setMemberProfileForm(p => ({ ...p, mobile: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#5B6475] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={memberProfileForm.email}
                    onChange={(e) => setMemberProfileForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-[#5B6475] mb-1">My Fitness Goals</label>
                <textarea
                  rows={3}
                  value={memberProfileForm.fitnessGoals}
                  onChange={(e) => setMemberProfileForm(p => ({ ...p, fitnessGoals: e.target.value }))}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033]"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Save Personal Preferences
              </button>
            </form>

            {/* Digital Club Pass, Biometrics & Emergency Contact Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4 h-fit">
              <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#15803D]">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Digital Access Pass & Biometrics</h3>
                  <p className="text-xs text-[#5B6475]">Gate clearance status, assigned coach, and emergency record</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Biometric Enrollment</span>
                  <span className="font-bold text-[#172033]">
                    {currentMemberRecord.biometricEnrolled ? 'Enrolled & Synced' : 'Pending Front Desk'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Turnstile Gate Access</span>
                  <span className={`font-bold ${currentMemberRecord.status === 'Active' ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                    {currentMemberRecord.status === 'Active' ? 'Cleared' : 'Restricted — Renew Dues'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Assigned Coach</span>
                  <span className="font-bold text-[#1D4ED8]">{currentMemberRecord.assignedTrainerName || 'Alex Chen'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold">Device Terminal</span>
                  <span className="font-mono font-bold text-[#172033]">{currentMemberRecord.biometricDeviceId || 'DEV-FP-MAIN-01'}</span>
                </div>
              </div>

              {currentMemberRecord.emergencyContact && (
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#5B6475] uppercase font-mono block">Emergency Contact</span>
                  <div className="font-bold text-[#172033]">
                    {currentMemberRecord.emergencyContact.name} ({currentMemberRecord.emergencyContact.relationship})
                  </div>
                  <div className="font-mono text-[#5B6475]">{currentMemberRecord.emergencyContact.phone}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('member-workouts')}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#172033] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Open Workout Program
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedInvoice(null); setIsPaymentDemoOpen(true); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Pay / Renew Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4C: MEMBER PAYMENTS & RECEIPTS (`member-payments`)
        ========================================================================= */}
        {currentUser.role === 'MEMBER' && activeTab === 'member-payments' && currentMemberRecord && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">My Membership Billing & Receipts</h3>
                <p className="text-xs text-[#5B6475]">View invoices, settle pending balances via demo checkout, and download GST receipts.</p>
              </div>
              <button
                onClick={() => { setSelectedInvoice(null); setIsPaymentDemoOpen(true); }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Simulate New Renewal Checkout</span>
              </button>
            </div>

            {currentMemberInvoices.some(i => i.balanceDue > 0) && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-[#B45309]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <strong className="block text-sm">Outstanding Balance Detected</strong>
                    <span>Settle your pending dues via Demo Checkout to immediately restore Active turnstile gate entry.</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const unpaidInv = currentMemberInvoices.find(i => i.balanceDue > 0) || null;
                    setSelectedInvoice(unpaidInv);
                    setIsPaymentDemoOpen(true);
                  }}
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold rounded-xl cursor-pointer"
                >
                  Clear Balance Now →
                </button>
              </div>
            )}

            <div className="space-y-3">
              {currentMemberInvoices.length === 0 ? (
                <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center text-xs text-[#70798A]">
                  No billing history recorded for your account yet. Click "Simulate New Renewal Checkout" above to generate a demo receipt.
                </div>
              ) : currentMemberInvoices.map(inv => (
                <div key={inv.id} className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#172033]">{inv.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'DEMO PAID' || inv.status === 'Paid' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                        inv.status === 'PENDING' || inv.status === 'Partial' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                        'bg-rose-50 text-[#B91C1C] border border-rose-200'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-[#5B6475] mt-1">
                      {inv.planName || inv.items[0]?.description} • Total: <strong className="font-mono text-[#172033]">₹{inv.total.toLocaleString('en-IN')}</strong> • Balance Due: <strong className="font-mono text-[#B91C1C]">₹{inv.balanceDue.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.balanceDue > 0 && (
                      <button
                        onClick={() => { setSelectedInvoice(inv); setIsPaymentDemoOpen(true); }}
                        className="px-3.5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold rounded-xl cursor-pointer"
                      >
                        Pay Demo Balance
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] font-semibold rounded-xl cursor-pointer"
                    >
                      View GST Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4D: MEMBER INTERACTIVE WORKOUTS (`member-workouts`)
        ========================================================================= */}
        {currentUser.role === 'MEMBER' && activeTab === 'member-workouts' && currentMemberRecord && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#172033]">My Personalized Workout Programs</h3>
              <p className="text-xs text-[#5B6475]">Check off completed sets during your training session to track daily completion.</p>
            </div>

            {workouts.filter(w => w.memberId === currentMemberRecord.id).length === 0 ? (
              <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center space-y-2">
                <Dumbbell className="w-8 h-8 text-[#70798A] mx-auto" />
                <div className="text-sm font-bold text-[#172033]">No Custom Workouts Assigned Yet</div>
                <p className="text-xs text-[#5B6475]">Ask Coach {currentMemberRecord.assignedTrainerName || 'Alex Chen'} at the gym floor desk to push a progression block to your profile.</p>
              </div>
            ) : workouts.filter(w => w.memberId === currentMemberRecord.id).map(wo => {
              const total = wo.exercises.length || 1;
              const doneCount = wo.exercises.filter((_, idx) => completedExercises[`${wo.id}:${idx}`]).length;
              const pct = Math.round((doneCount / total) * 100);
              return (
                <div key={wo.id} className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#1D4ED8] font-bold uppercase">Coach {wo.trainerName} • Updated {wo.updatedAt}</span>
                      <h4 className="text-lg font-bold text-[#172033]">{wo.title}</h4>
                      <p className="text-xs text-[#5B6475]">{wo.focus}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#15803D]">{doneCount}/{total} Exercises Checked ({pct}%)</span>
                      <div className="w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {wo.exercises.map((ex, idx) => {
                      const isDone = Boolean(completedExercises[`${wo.id}:${idx}`]);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleExerciseDone(wo.id, idx)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isDone ? 'bg-emerald-50/70 border-emerald-300' : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                            }`}>
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`font-semibold ${isDone ? 'line-through text-[#5B6475]' : 'text-[#172033]'}`}>
                              {ex.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#1D4ED8] shrink-0">
                            {ex.sets} × {ex.reps} {ex.weight ? `(${ex.weight})` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {wo.coachNotes && (
                    <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-[#5B6475]">
                      <strong className="text-[#172033] block mb-0.5">Coach Instructions:</strong>
                      {wo.coachNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            VIEW 5: LEADS & ENQUIRIES PIPELINE (`leads`)
        ========================================================================= */}
        {permissions.canManageMembers && activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Enquiries & Leads Pipeline</h3>
                <p className="text-xs text-[#5B6475]">
                  Track website enquiries, walk-in tours, trial consultations, and convert qualified prospects into members in 1 click.
                </p>
              </div>
              <button
                onClick={() => { setLeadToEdit(null); setIsLeadModalOpen(true); }}
                className="px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Walk-In / Enquiry</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-xs text-[#5B6475] font-mono uppercase">Total Enquiries</div>
                <div className="text-2xl font-bold text-[#172033] mt-1">{leads.length}</div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-xs text-[#1D4ED8] font-mono uppercase">Trials Scheduled</div>
                <div className="text-2xl font-bold text-[#1D4ED8] mt-1">
                  {leads.filter(l => l.stage === 'Visit / trial scheduled').length}
                </div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-xs text-[#15803D] font-mono uppercase">Converted</div>
                <div className="text-2xl font-bold text-[#15803D] mt-1">
                  {leads.filter(l => l.stage === 'Converted').length}
                </div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-xs text-[#5B6475] font-mono uppercase">Conversion Rate</div>
                <div className="text-2xl font-bold text-[#172033] mt-1">
                  {leads.length ? Math.round((leads.filter(l => l.stage === 'Converted').length / leads.length) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                <input
                  type="text"
                  placeholder="Search lead by name, phone, or ID..."
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#172033]"
                />
              </div>
              <select
                value={leadStageFilter}
                onChange={(e) => setLeadStageFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033]"
              >
                <option value="All">All Stages ({leads.length})</option>
                <option value="New enquiry">New enquiry</option>
                <option value="Contacted">Contacted</option>
                <option value="Visit / trial scheduled">Visit / trial scheduled</option>
                <option value="Visited / trial completed">Visited / trial completed</option>
                <option value="Follow-up pending">Follow-up pending</option>
                <option value="Converted">Converted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#5B6475] uppercase font-mono text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Prospect</th>
                    <th className="py-3 px-4 font-bold">Source & Interest</th>
                    <th className="py-3 px-4 font-bold">Stage</th>
                    <th className="py-3 px-4 font-bold">Follow-Up Date</th>
                    <th className="py-3 px-4 font-bold">Notes</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredLeads.map(l => (
                    <tr key={l.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172033]">{l.name}</div>
                        <div className="text-[11px] font-mono text-[#5B6475]">{l.mobile}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-[#172033]">{l.source}</span>
                        <div className="text-[11px] text-[#5B6475] mt-1">{l.interestedProduct}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.stage === 'Converted' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                          l.stage === 'Visit / trial scheduled' ? 'bg-blue-50 text-[#1D4ED8] border border-blue-200' :
                          l.stage === 'Lost' ? 'bg-rose-50 text-[#B91C1C] border border-rose-200' :
                          'bg-amber-50 text-[#B45309] border border-amber-200'
                        }`}>
                          {l.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#172033]">{l.nextFollowUpDate}</td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-[#5B6475]">{l.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {l.stage !== 'Converted' && (
                            <button
                              onClick={() => handleConvertLeadToMember(l)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                            >
                              Convert
                            </button>
                          )}
                          <button
                            onClick={() => { setLeadToEdit(l); setIsLeadModalOpen(true); }}
                            className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: DEMO PAYMENT HISTORY (`billing`)
        ========================================================================= */}
        {permissions.canViewFinances && activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Demo Payment History & Transaction Ledger</h3>
                <p className="text-xs text-[#5B6475]">Search, filter, and inspect simulated payment transactions and receipts.</p>
              </div>
              <button
                onClick={() => { setSelectedInvoice(null); setIsPaymentDemoOpen(true); }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Simulate New Payment</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                <span className="text-xs text-[#5B6475] font-semibold uppercase font-mono">Simulated Collections (Total)</span>
                <div className="text-2xl font-bold text-[#15803D] mt-1 font-mono">₹{metrics.paymentsCollected.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                <span className="text-xs text-[#B45309] font-bold uppercase font-mono">Pending Demo Invoices</span>
                <div className="text-2xl font-bold text-[#B45309] mt-1 font-mono">{invoices.filter(i => i.status === 'PENDING' || i.status === 'Partial').length}</div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                <span className="text-xs text-[#B91C1C] font-bold uppercase font-mono">Simulated Failed Payments</span>
                <div className="text-2xl font-bold text-[#B91C1C] mt-1 font-mono">{invoices.filter(i => i.status === 'DEMO PAYMENT FAILED').length}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                <input
                  type="text"
                  placeholder="Search by Txn ID, Member Name, or Invoice..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#172033]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                >
                  <option value="All">All Statuses</option>
                  <option value="DEMO PAID">DEMO PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="DEMO PAYMENT FAILED">DEMO PAYMENT FAILED</option>
                </select>
                <select
                  value={invoiceMethodFilter}
                  onChange={(e) => setInvoiceMethodFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                >
                  <option value="All">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Online Gateway">Online Gateway</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#5B6475] uppercase font-mono text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Demo Txn ID</th>
                    <th className="py-3 px-4 font-bold">Member Name</th>
                    <th className="py-3 px-4 font-bold">Plan Details</th>
                    <th className="py-3 px-4 font-bold">Amount (₹)</th>
                    <th className="py-3 px-4 font-bold">Method</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#70798A]">
                        No payment records found matching the filter criteria.
                      </td>
                    </tr>
                  ) : filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">
                        {inv.demoTransactionId || `DEMO-TXN-${inv.id.replace('DEMO-INV-', '')}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172033]">{inv.memberName}</div>
                        <div className="text-[10px] text-[#70798A] font-mono">{inv.memberId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#172033]">{inv.planName || inv.items[0]?.description}</div>
                        <div className="text-[10px] text-[#70798A] font-mono">Invoice #{inv.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#172033]">₹{inv.total.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#172033] font-medium font-mono text-[10px]">
                          {inv.paymentMethod || 'Online Gateway'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#5B6475]">{inv.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          inv.status === 'DEMO PAID' || inv.status === 'Paid' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                          inv.status === 'PENDING' || inv.status === 'Partial' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                          'bg-rose-50 text-[#B91C1C] border border-rose-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 7: MEMBERSHIP PLANS (`plans`)
        ========================================================================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Membership Plans & Pricing</h3>
                <p className="text-xs text-[#5B6475]">
                  {currentUser.role === 'OWNER / ADMIN'
                    ? 'Edit membership pricing (synced to Public Website & Registration Portal) or simulate plan checkouts.'
                    : 'Current club membership tiers and features.'}
                </p>
              </div>
              {permissions.canViewFinances && (
                <button
                  onClick={() => setIsPaymentDemoOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Simulate Plan Checkout</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between relative group hover:border-blue-300 transition-all">
                  {plan.id === 'plan-12m' && (
                    <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      Best Value
                    </span>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono font-semibold text-[#5B6475] uppercase">{plan.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                        {plan.durationMonths} Months
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#172033]">{plan.name}</h4>
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-[#172033] font-mono">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-[#70798A] block mt-0.5">+ 18% GST (₹{Math.round(plan.price * 0.18).toLocaleString('en-IN')})</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#5B6475]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                    {currentUser.role === 'OWNER / ADMIN' && (
                      <button
                        onClick={() => { setEditingPlan({ ...plan }); setIsEditPlanModalOpen(true); }}
                        className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#5B6475]" />
                        <span>Edit Price</span>
                      </button>
                    )}
                    {permissions.canViewFinances && (
                      <button
                        onClick={() => { setSelectedInvoice(null); setIsPaymentDemoOpen(true); }}
                        className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs ml-auto"
                      >
                        Simulate ↗
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 8: TRAINER ROSTER (`trainers`)
        ========================================================================= */}
        {activeTab === 'trainers' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-[#172033]">Certified Head Trainers & Coach Profiles</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] text-xs font-mono font-bold border border-blue-200">
                    {trainers.length} Active Coaches
                  </span>
                </div>
                <p className="text-xs text-[#5B6475] mt-0.5">
                  Profiles, qualifications, assigned shifts, and login credentials provisioning for trainers.
                </p>
              </div>
              {currentUser.role === 'OWNER / ADMIN' && (
                <button
                  onClick={() => setIsTrainerModalOpen(true)}
                  className="px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Trainer</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trainers.map(tr => (
                <div key={tr.id} className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-5 items-start">
                  <AvatarImage
                    src={tr.photoUrl}
                    name={tr.name}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-200 bg-slate-100 shrink-0 shadow-sm"
                    fallbackClassName="w-24 h-24 rounded-2xl bg-blue-100 text-[#1D4ED8] font-bold text-2xl flex items-center justify-center shrink-0"
                  />

                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-[#172033]">{tr.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-[#5B6475]">
                            {tr.experienceYears || 3} Yrs Exp
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-[#1D4ED8] block mt-0.5">{tr.specialisation}</span>
                      </div>
                      {currentUser.role === 'OWNER / ADMIN' && (
                        <button
                          onClick={() => handleDeleteTrainer(tr)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={`Remove ${tr.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-[#5B6475] leading-relaxed">{tr.bio}</p>

                    <div className="flex flex-wrap gap-2 text-[11px] text-[#5B6475]">
                      <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                        <Clock className="w-3 h-3 text-[#1D4ED8]" />
                        <span>{tr.workingHours}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                        <Building2 className="w-3 h-3 text-[#1D4ED8]" />
                        <span>{tr.branch}</span>
                      </span>
                    </div>

                    {tr.certifications && tr.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {tr.certifications.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-[#15803D] font-medium">
                            ✓ {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 text-[11px] text-[#70798A] font-mono border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                      <span>Active Clients: <strong className="text-[#172033]">{tr.assignedMemberIds.length}</strong></span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /><span>{tr.phone}</span></span>
                        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /><span>{tr.email}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 9: MEMBERS ADMINISTRATION TABLE (`members`)
        ========================================================================= */}
        {permissions.canManageMembers && activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Member Administration & Roster</h3>
                <p className="text-xs text-[#5B6475]">Add, edit, assign coaches, remove, and simulate membership renewals.</p>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Register Member</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or Member ID..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#172033]"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#70798A]">Status:</span>
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                >
                  <option value="All">All Statuses ({members.length})</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Unpaid">Unpaid Dues</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#5B6475] uppercase font-mono text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Member Info</th>
                    <th className="py-3 px-4 font-bold">Contact & Coach</th>
                    <th className="py-3 px-4 font-bold">Plan & Branch</th>
                    <th className="py-3 px-4 font-bold">Expiry Date</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#70798A]">
                        No members found matching "{memberSearchQuery}".
                      </td>
                    </tr>
                  ) : filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarImage src={m.photoUrl} name={m.fullName} className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]" />
                          <div>
                            <div className="font-bold text-[#172033]">{m.fullName}</div>
                            <div className="text-[10px] font-mono text-[#70798A]">{m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[#5B6475]">{m.mobile}</div>
                        <div className="text-[10px] text-[#1D4ED8] font-semibold">Coach: {m.assignedTrainerName || 'Unassigned'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#172033] font-semibold">{m.planName}</div>
                        <div className="text-[10px] text-[#70798A]">{m.branch}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-[#172033]">{m.expiryDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                          m.status === 'Expiring Soon' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                          m.status === 'Unpaid' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          'bg-rose-50 text-[#B91C1C] border border-rose-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSimulateRenewal(m, 3)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] border border-blue-200 rounded text-[11px] font-bold cursor-pointer"
                          >
                            +3M
                          </button>
                          <button
                            onClick={() => setSelectedMemberForDrawer(m)}
                            className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => setMemberToEdit(m)}
                            className="p-1 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#5B6475] rounded cursor-pointer"
                            title="Edit Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m)}
                            className="p-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-[#B91C1C] rounded cursor-pointer"
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 10: OWNER REVENUE, GST & RECONCILIATION REPORTS (`reports`)
        ========================================================================= */}
        {currentUser.role === 'OWNER / ADMIN' && activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Demo Revenue, GST & Reconciliation Reports</h3>
                <p className="text-xs text-[#5B6475]">Statutory 18% GST liability split (CGST/SGST), settlement methods, and aging dues report.</p>
              </div>
              <button
                onClick={() => {
                  const rows = [
                    ['Invoice ID', 'Txn ID', 'Member', 'Plan', 'Subtotal', 'Discount', 'Tax (18%)', 'Total', 'Paid', 'Balance', 'Method', 'Status', 'Date'],
                    ...invoices.map(i => [
                      i.id, i.demoTransactionId || '', i.memberName, i.planName || '',
                      String(i.subtotal), String(i.discount), String(i.tax), String(i.total),
                      String(i.amountPaid), String(i.balanceDue), i.paymentMethod || '', i.status, i.date
                    ])
                  ];
                  downloadCsv(`wfit-revenue-report-${new Date().toISOString().split('T')[0]}.csv`, rows);
                  addToast('success', 'CSV Exported', 'Revenue reconciliation sheet downloaded.');
                }}
                className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Report</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-[11px] font-mono text-[#5B6475] uppercase">Taxable Base Value</div>
                <div className="text-2xl font-bold text-[#172033] mt-1">₹{metrics.totalSubtotal.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-[11px] font-mono text-[#1D4ED8] uppercase">Total 18% GST (CGST+SGST)</div>
                <div className="text-2xl font-bold text-[#1D4ED8] mt-1">₹{metrics.totalTaxCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                <div className="text-[10px] text-[#70798A] font-mono mt-0.5">CGST ₹{(metrics.totalTaxCollected / 2).toFixed(0)} + SGST ₹{(metrics.totalTaxCollected / 2).toFixed(0)}</div>
              </div>
              <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-[11px] font-mono text-[#5B6475] uppercase">Approved Discounts</div>
                <div className="text-2xl font-bold text-[#172033] mt-1">₹{metrics.totalDiscounts.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-4 bg-white border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-mono text-[#15803D] uppercase">Net Collected</div>
                <div className="text-2xl font-bold text-[#15803D] mt-1">₹{metrics.paymentsCollected.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breakdown by Payment Method */}
              <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-[#172033] border-b border-[#E2E8F0] pb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1D4ED8]" />
                  <span>Settlement Channel Distribution</span>
                </h4>
                <div className="space-y-3">
                  {(['UPI', 'UPI/GPay', 'Online Gateway', 'Card', 'Cash', 'Bank Transfer'] as PaymentMethod[]).map(method => {
                    const sum = invoices.filter(i => i.paymentMethod === method).reduce((s, i) => s + i.amountPaid, 0);
                    if (sum === 0) return null;
                    const pct = Math.round((sum / (metrics.paymentsCollected || 1)) * 100);
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#172033]">{method}</span>
                          <span className="font-mono text-[#5B6475]">₹{sum.toLocaleString('en-IN')} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Outstanding / Pending Dues Recovery Table */}
              <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-[#172033] border-b border-[#E2E8F0] pb-3">Unsettled / Failed Demo Invoices</h4>
                <div className="space-y-2.5">
                  {invoices.filter(i => i.balanceDue > 0).length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#15803D] bg-emerald-50 rounded-xl font-semibold">
                      Zero outstanding dues across all invoices!
                    </div>
                  ) : invoices.filter(i => i.balanceDue > 0).map(inv => (
                    <div key={inv.id} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#172033]">{inv.memberName} ({inv.id})</div>
                        <div className="text-[11px] font-mono text-[#B91C1C]">Due: ₹{inv.balanceDue.toLocaleString('en-IN')} • {inv.status}</div>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold rounded-lg cursor-pointer"
                      >
                        Collect / Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 11: OWNER STAFF ACCOUNTS & SECURITY POLICIES (`staff`)
        ========================================================================= */}
        {currentUser.role === 'OWNER / ADMIN' && activeTab === 'staff' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#172033]">Staff Accounts & Owner Security Governance</h3>
              <p className="text-xs text-[#5B6475]">Configure system-wide access policies, manage employee portal accounts, deactivate access, or reset credentials.</p>
            </div>

            {/* Security Policy Control Panel */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                <SettingsIcon className="w-4 h-4 text-[#1D4ED8]" />
                <h4 className="font-bold text-sm text-[#172033]">Owner System Security Policies</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172033]">Manager Financial Access</div>
                    <p className="text-[11px] text-[#5B6475] mt-1">
                      Allow Club Managers to view invoice ledgers and process demo checkouts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.managerPaymentAccessEnabled}
                    onChange={(e) => handleUpdateSystemSetting('managerPaymentAccessEnabled', e.target.checked)}
                    className="w-4 h-4 mt-1 text-[#1D4ED8] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172033]">Portal Member Onboarding</div>
                    <p className="text-[11px] text-[#5B6475] mt-1">
                      Allow new members and converted website enquiries to be added directly to the role directory.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.allowSelfRegistration}
                    onChange={(e) => handleUpdateSystemSetting('allowSelfRegistration', e.target.checked)}
                    className="w-4 h-4 mt-1 text-[#1D4ED8] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#172033]">Biometric Gate Enforcement</div>
                    <p className="text-[11px] text-[#5B6475] mt-1">
                      Automatically block turnstiles when member status is Unpaid or Expired.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.biometricEnforcementActive}
                    onChange={(e) => handleUpdateSystemSetting('biometricEnforcementActive', e.target.checked)}
                    className="w-4 h-4 mt-1 text-[#1D4ED8] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Registered Accounts Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-x-auto shadow-xs">
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#172033]">Portal Accounts & Role Directory ({staffAccounts.length})</h4>
                <button
                  onClick={() => setIsTrainerModalOpen(true)}
                  className="px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll New Coach</span>
                </button>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#5B6475] uppercase font-mono text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Account Name</th>
                    <th className="py-3 px-4 font-bold">Username / Email</th>
                    <th className="py-3 px-4 font-bold">Role</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Role & Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {staffAccounts.map(acc => {
                    const isCurrentRole = acc.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                    <tr key={acc.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172033]">{acc.name}</div>
                        <div className="text-[10px] font-mono text-[#70798A]">{acc.id} • {acc.branch || 'All Branches'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#5B6475]">
                        <div>{acc.email}</div>
                        <div className="text-[10px] text-[#70798A]">@{acc.username}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#172033] font-mono text-[10px] font-bold">
                          {acc.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          acc.isActive ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : 'bg-rose-50 text-[#B91C1C] border border-rose-200'
                        }`}>
                          {acc.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isCurrentRole ? (
                            <span className="px-2.5 py-1 rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 text-[11px] font-bold">
                              Active Role
                            </span>
                          ) : (
                            <button
                              disabled={!acc.isActive}
                              onClick={() => onSwitchDemoAccount && onSwitchDemoAccount(acc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#1D4ED8] rounded text-[11px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span>Switch Role</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {acc.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleAccountStatus(acc)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer border ${
                                acc.isActive
                                  ? 'bg-rose-50 text-[#B91C1C] border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-[#15803D] border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {acc.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 12: OWNER AUDIT TRAIL (`audit`)
        ========================================================================= */}
        {currentUser.role === 'OWNER / ADMIN' && activeTab === 'audit' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Security & Operational Audit Trail</h3>
                <p className="text-xs text-[#5B6475]">Immutable chronological trace of logins, failed attempts, password resets, policy changes, and overrides.</p>
              </div>
              <button
                onClick={() => {
                  const rows = [
                    ['Audit ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'Details', 'Status'],
                    ...filteredAuditLogs.map(a => [a.id, a.timestamp, a.actor, a.role, a.action, a.target, a.details, a.status || 'SUCCESS'])
                  ];
                  downloadCsv(`wfit-audit-log-${new Date().toISOString().split('T')[0]}.csv`, rows);
                  addToast('success', 'Audit Log Exported', 'Security audit CSV downloaded.');
                }}
                className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                <input
                  type="text"
                  placeholder="Search by user email, action, or event..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#172033]"
                />
              </div>
              <select
                value={auditStatusFilter}
                onChange={(e) => setAuditStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033]"
              >
                <option value="ALL">All Event Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="DENIED">DENIED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-x-auto shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F8FAFC] text-[#5B6475] uppercase font-mono text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">Actor</th>
                    <th className="py-3 px-4 font-bold">Action & Target</th>
                    <th className="py-3 px-4 font-bold">Details</th>
                    <th className="py-3 px-4 font-bold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#5B6475] whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#172033]">{log.actor}</div>
                        <div className="text-[10px] font-mono text-[#70798A]">{log.role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#172033]">{log.action}</div>
                        <div className="text-[10px] font-mono text-[#1D4ED8]">{log.target}</div>
                      </td>
                      <td className="py-3 px-4 text-[#5B6475]">{log.details}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          log.status === 'DENIED' || log.status === 'FAILED'
                            ? 'bg-rose-50 text-[#B91C1C] border border-rose-200'
                            : 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                        }`}>
                          {log.status || 'SUCCESS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 13: CLUB MANAGER BIOMETRIC TURNSTILE LOGS & RENEWALS (`branch-ops`)
        ========================================================================= */}
        {(currentUser.role === 'CLUB MANAGER' || currentUser.role === 'OWNER / ADMIN') && activeTab === 'branch-ops' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1D4ED8]">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#172033]">Biometric Turnstile Logs & Renewal Queue</h3>
                  <p className="text-xs text-[#5B6475]">Monitor real-time ZKTECO access gate validations and automate member renewal outreach.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeviceOnline(prev => !prev)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    deviceOnline ? 'bg-emerald-50 text-[#15803D] border-emerald-200' : 'bg-rose-50 text-[#B91C1C] border-rose-200'
                  }`}
                >
                  Gate #1: {deviceOnline ? 'ONLINE' : 'OFFLINE'}
                </button>
                <button
                  onClick={() => setIsBiometricModalOpen(true)}
                  className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Open Gate Simulator
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Biometric Scans */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-sm text-[#172033]">
                  Recent Turnstile Entry Events ({biometricLogs.length})
                </div>
                <div className="divide-y divide-[#E2E8F0] max-h-96 overflow-y-auto">
                  {biometricLogs.map(log => (
                    <div key={log.id} className="p-4 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#172033]">{log.memberName} ({log.memberId})</div>
                        <div className="text-[11px] font-mono text-[#5B6475] mt-0.5">{log.timestamp} • {log.scanType} • {log.device}</div>
                        {(log.denialReason || log.staffReason) && (
                          <div className="text-[11px] text-[#B91C1C] mt-1">{log.denialReason || `Override: ${log.staffReason}`}</div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase shrink-0 ${
                        log.result === 'GRANTED' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : 'bg-rose-50 text-[#B91C1C] border border-rose-200'
                      }`}>
                        {log.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Renewal Follow-Up Tasks */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-sm text-[#172033]">
                  Expiring & Overdue Renewal Tasks ({renewals.length})
                </div>
                <div className="divide-y divide-[#E2E8F0] max-h-96 overflow-y-auto">
                  {renewals.map(task => (
                    <div key={task.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#172033]">{task.memberName} ({task.memberId})</div>
                        <div className="text-[11px] text-[#5B6475] font-mono">
                          {task.planName} • Expiry: {task.expiryDate} ({task.daysRemaining < 0 ? `${Math.abs(task.daysRemaining)}d overdue` : `${task.daysRemaining}d left`})
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.status === 'Renewed' ? 'bg-emerald-50 text-[#15803D]' :
                            task.status === 'Sent' ? 'bg-blue-50 text-[#1D4ED8]' :
                            'bg-amber-50 text-[#B45309]'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateRenewalTask(task, 'Sent')}
                          className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Remind</span>
                        </button>
                        {task.status !== 'Renewed' && (
                          <button
                            onClick={() => handleUpdateRenewalTask(task, 'Renewed')}
                            className="px-2.5 py-1.5 bg-[#15803D] hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Renew +3M
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 14: FACILITY GALLERY (`gallery`)
        ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#172033]">Gym Facility & Equipment Showcase Gallery</h3>
              <p className="text-xs text-[#5B6475]">Facility zones, calibrated barbell stations, conditioning decks, and turnstile access gates.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {INITIAL_GALLERY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedGalleryItem(item)}
                  className="group bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-[#172033] text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-xs">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-sm text-[#172033] group-hover:text-[#1D4ED8] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#5B6475] line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          SUPPORTING MODALS
      ========================================================================= */}
      <DemoPaymentModal
        isOpen={isPaymentDemoOpen}
        onClose={() => setIsPaymentDemoOpen(false)}
        member={currentMemberRecord}
        plans={plans}
        initialInvoice={selectedInvoice}
        onSimulateSuccess={(updatedInv, updatedMember) => {
          setInvoices(prev => [updatedInv, ...prev.filter(i => i.id !== updatedInv.id)]);
          setMembers(prev => prev.map(m => (m.id === updatedMember.id ? updatedMember : m)));
          appendLocalAudit('Payment Demo Completed', updatedInv.id, `Settled ₹${updatedInv.total} via ${updatedInv.paymentMethod}`);
          addToast('success', 'Demo Payment Cleared', `Transaction ${updatedInv.demoTransactionId} marked as DEMO PAID.`);
        }}
        onSimulateFailure={(failedInv) => {
          setInvoices(prev => [failedInv, ...prev.filter(i => i.id !== failedInv.id)]);
          appendLocalAudit('Payment Demo Failed', failedInv.id, 'Simulated gateway decline', 'FAILED');
          addToast('error', 'Payment Simulation Failed', 'Simulated failure recorded as DEMO PAYMENT FAILED.');
        }}
      />

      {/* Edit Plan Modal */}
      {isEditPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl p-6 relative">
            <button onClick={() => setIsEditPlanModalOpen(false)} className="absolute top-4 right-4 p-1 text-[#70798A] hover:text-[#172033]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#172033] mb-4">Edit Plan: {editingPlan.name}</h3>
            <form onSubmit={handleSavePlanPrice} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Price in Indian Rupees (₹)</label>
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033] font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Duration (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  value={editingPlan.durationMonths}
                  onChange={(e) => setEditingPlan({ ...editingPlan, durationMonths: Number(e.target.value) })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033] font-mono"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsEditPlanModalOpen(false)} className="px-4 py-2 text-xs text-[#5B6475]">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {memberToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl p-6 relative">
            <button onClick={() => setMemberToEdit(null)} className="absolute top-4 right-4 p-1 text-[#70798A] hover:text-[#172033]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#172033] mb-4">Edit Member: {memberToEdit.fullName}</h3>
            <form onSubmit={handleSaveMemberEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={memberToEdit.fullName}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, fullName: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Mobile Number</label>
                <input
                  type="text"
                  value={memberToEdit.mobile}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, mobile: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                  required
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Assigned Coach</label>
                <select
                  value={memberToEdit.assignedTrainerId || ''}
                  onChange={(e) => {
                    const tr = trainers.find(t => t.id === e.target.value);
                    setMemberToEdit({
                      ...memberToEdit,
                      assignedTrainerId: tr?.id,
                      assignedTrainerName: tr?.name
                    });
                  }}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                >
                  <option value="">Unassigned</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialisation.split(',')[0]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Membership Plan</label>
                <select
                  value={memberToEdit.planId}
                  onChange={(e) => {
                    const selPlan = plans.find(p => p.id === e.target.value);
                    setMemberToEdit({
                      ...memberToEdit,
                      planId: e.target.value,
                      planName: selPlan?.name || memberToEdit.planName
                    });
                  }}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                >
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5B6475] mb-1 font-semibold">Expiry Date</label>
                  <input
                    type="date"
                    value={memberToEdit.expiryDate}
                    onChange={(e) => setMemberToEdit({ ...memberToEdit, expiryDate: e.target.value })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                  />
                </div>
                <div>
                  <label className="block text-[#5B6475] mb-1 font-semibold">Status</label>
                  <select
                    value={memberToEdit.status}
                    onChange={(e) => setMemberToEdit({ ...memberToEdit, status: e.target.value as any })}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setMemberToEdit(null)} className="px-4 py-2 text-xs text-[#5B6475]">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal */}
      {selectedGalleryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setSelectedGalleryItem(null)} className="absolute top-4 right-4 p-1.5 rounded-full bg-black/60 text-white hover:bg-black z-10">
              <X className="w-5 h-5" />
            </button>
            <img src={selectedGalleryItem.image} alt={selectedGalleryItem.title} className="w-full max-h-96 object-cover" />
            <div className="p-6 space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200 text-xs font-bold uppercase tracking-wider">
                {selectedGalleryItem.category}
              </span>
              <h3 className="text-xl font-bold text-[#172033]">{selectedGalleryItem.title}</h3>
              <p className="text-xs text-[#5B6475]">{selectedGalleryItem.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-[#B91C1C] flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-[#172033]">{confirmDialog.title}</h4>
              <p className="text-xs text-[#5B6475] mt-1">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-[#5B6475] hover:text-[#172033] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-6 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
              toast.type === 'success' ? 'bg-white border-emerald-300 text-[#172033]' :
              toast.type === 'error' ? 'bg-white border-rose-300 text-[#172033]' :
              'bg-white border-blue-300 text-[#172033]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[#15803D] mt-0.5 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#1D4ED8] mt-0.5 shrink-0" />}
              <div>
                <span className="font-bold text-xs block text-[#172033]">{toast.title}</span>
                <span className="text-[11px] text-[#5B6475]">{toast.message}</span>
              </div>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-[#70798A] hover:text-[#172033] p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Member Profile Drawer Modal */}
      {selectedMemberForDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl p-6 relative">
            <button onClick={() => setSelectedMemberForDrawer(null)} className="absolute top-4 right-4 p-1 text-[#70798A] hover:text-[#172033]">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <AvatarImage src={selectedMemberForDrawer.photoUrl} name={selectedMemberForDrawer.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-sm" />
              <div>
                <h3 className="text-xl font-bold text-[#172033]">{selectedMemberForDrawer.fullName}</h3>
                <span className="text-xs font-mono text-[#5B6475]">{selectedMemberForDrawer.id} • {selectedMemberForDrawer.branch}</span>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedMemberForDrawer.status === 'Active' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' :
                    selectedMemberForDrawer.status === 'Expiring Soon' ? 'bg-amber-50 text-[#B45309] border border-amber-200' :
                    'bg-rose-50 text-[#B91C1C] border border-rose-200'
                  }`}>
                    {selectedMemberForDrawer.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] grid grid-cols-2 gap-3">
                <div><span className="text-[#70798A] block font-semibold">Mobile</span><span className="font-mono text-[#172033]">{selectedMemberForDrawer.mobile}</span></div>
                <div><span className="text-[#70798A] block font-semibold">Email</span><span className="text-[#172033]">{selectedMemberForDrawer.email || '—'}</span></div>
                <div><span className="text-[#70798A] block font-semibold">Plan</span><span className="font-bold text-[#1D4ED8]">{selectedMemberForDrawer.planName}</span></div>
                <div><span className="text-[#70798A] block font-semibold">Expiry Date</span><span className="font-mono text-[#172033]">{selectedMemberForDrawer.expiryDate}</span></div>
                <div><span className="text-[#70798A] block font-semibold">Assigned Coach</span><span className="text-[#172033]">{selectedMemberForDrawer.assignedTrainerName || 'Unassigned'}</span></div>
                <div><span className="text-[#70798A] block font-semibold">Biometrics</span><span className="text-[#172033]">{selectedMemberForDrawer.biometricEnrolled ? 'Enrolled' : 'Pending'}</span></div>
              </div>
              {selectedMemberForDrawer.emergencyContact && (
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#70798A] block font-semibold mb-1">Emergency Contact</span>
                  <div className="text-[#172033]">{selectedMemberForDrawer.emergencyContact.name} ({selectedMemberForDrawer.emergencyContact.relationship}) — {selectedMemberForDrawer.emergencyContact.phone}</div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                onClick={() => {
                  handleSimulateRenewal(selectedMemberForDrawer, 3);
                  setSelectedMemberForDrawer(null);
                }}
                className="px-4 py-2 bg-blue-50 text-[#1D4ED8] border border-blue-200 hover:bg-blue-100 font-bold text-xs rounded-xl cursor-pointer"
              >
                Simulate +3M Renewal
              </button>
              <button onClick={() => setSelectedMemberForDrawer(null)} className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs rounded-xl cursor-pointer">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Supporting Modals */}
      <BiometricModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        members={members}
        onLogEntry={async (log) => {
          setBiometricLogs(prev => [log, ...prev]);
          if (authToken) {
            try {
              await fetch('/api/biometric-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(log)
              });
            } catch {}
          }
        }}
        deviceOnline={deviceOnline}
        setDeviceOnline={setDeviceOnline}
      />

      <InvoiceModal
        isOpen={!!selectedInvoice && !isPaymentDemoOpen}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onRecordPayment={async (invoiceId, _amount, method, ref) => {
          setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? {
            ...inv, status: 'DEMO PAID', amountPaid: inv.total, balanceDue: 0, paymentMethod: method, paymentReference: ref
          } : inv)));
          appendLocalAudit('Invoice Settled', invoiceId, `Recorded demo clearance via ${method}`);
          setSelectedInvoice(null);
          addToast('success', 'Payment Recorded (Demo)', `Invoice ${invoiceId} marked as DEMO PAID.`);
        }}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSaveMember={async (newMember) => {
          setMembers(prev => [newMember, ...prev]);
          if (authToken) {
            try {
              await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify(newMember)
              });
              if (onRefreshAccounts) await onRefreshAccounts();
            } catch {}
          }
          appendLocalAudit('Member Registered', newMember.id, `Registered ${newMember.fullName}`);
          addToast('success', 'Member Registered', `Added ${newMember.fullName} (${newMember.id}) to roster.`);
        }}
        existingMembers={members}
        plans={plans}
      />

      <TrainerModal
        isOpen={isTrainerModalOpen}
        onClose={() => setIsTrainerModalOpen(false)}
        onSaveTrainer={handleSaveTrainer}
        existingTrainers={trainers}
      />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={leadToEdit}
        onSaveLead={handleSaveLead}
        onConvertToMember={handleConvertLeadToMember}
      />

      {/* Trainer Workout Plan Creation Modal */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl p-6 relative">
            <button onClick={() => setIsWorkoutModalOpen(false)} className="absolute top-5 right-5 text-[#70798A] hover:text-[#172033]">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#172033] uppercase font-archivo-wide mb-4">
              Program Workout For Client
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const exercises = workoutForm.exercisesText.split('\n').filter(Boolean).map(line => ({
                  name: line.trim(), sets: '3', reps: '10'
                }));
                const newWo: WorkoutPlan = {
                  id: `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
                  memberId: workoutForm.memberId,
                  memberName: members.find(m => m.id === workoutForm.memberId)?.fullName || 'Member',
                  trainerId: currentTrainerProfile?.id || currentUser.trainerId || 'TR-ALEX',
                  trainerName: currentUser.name,
                  title: workoutForm.title,
                  focus: workoutForm.focus,
                  exercises,
                  updatedAt: new Date().toISOString().split('T')[0],
                  status: 'Active',
                  coachNotes: workoutForm.coachNotes
                };
                setWorkouts(prev => [newWo, ...prev]);
                if (authToken) {
                  try {
                    await fetch('/api/workouts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                      body: JSON.stringify(newWo)
                    });
                  } catch {}
                }
                setIsWorkoutModalOpen(false);
                addToast('success', 'Workout Programmed', `Assigned "${workoutForm.title}" to ${newWo.memberName}.`);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Select Client</label>
                <select
                  value={workoutForm.memberId}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, memberId: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                >
                  {(currentUser.role === 'TRAINER' && trainerAssignedMembers.length > 0 ? trainerAssignedMembers : members).map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Workout Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Posterior Chain & Deadlift Specialization"
                  value={workoutForm.title}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, title: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Focus Area</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive overload on compound barbell lifts"
                  value={workoutForm.focus}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, focus: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Exercises (1 per line)</label>
                <textarea
                  rows={4}
                  value={workoutForm.exercisesText}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, exercisesText: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033] font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] mb-1 font-semibold">Coach Notes & Biomechanics Cues</label>
                <input
                  type="text"
                  placeholder="e.g. Ensure full hip lockout and bracing before unrack"
                  value={workoutForm.coachNotes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, coachNotes: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-[#172033]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsWorkoutModalOpen(false)} className="px-4 py-2 text-[#5B6475]">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase rounded-xl cursor-pointer">
                  Assign to Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
