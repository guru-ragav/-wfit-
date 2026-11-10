import React, { useState, useEffect, useCallback } from 'react';
import { WFitLanding } from './components/WFitLanding';
import { WFitCrm } from './components/WFitCrm';
import {
  UserAccount, Member, MembershipPlan, Invoice, Lead, BiometricLog,
  PTSession, RenewalTask, AuditLogItem, TrainerProfile, SystemSettings
} from './types';
import {
  INITIAL_PLANS,
  INITIAL_MEMBERS,
  INITIAL_INVOICES,
  INITIAL_TRAINERS,
  INITIAL_LEADS,
  INITIAL_BIOMETRIC_LOGS,
  INITIAL_PT_SESSIONS,
  INITIAL_RENEWAL_TASKS,
  INITIAL_AUDIT_LOGS,
  DEMO_ACCOUNTS
} from './mockData';
import { GYM_IMAGES } from './assets/images';

type AppView = 'landing' | 'crm';

const TOKEN_STORAGE_KEY = 'wfit_auth_token';
const ACTIVE_USER_STORAGE_KEY = 'wfit_active_role_user';

const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  managerPaymentAccessEnabled: false,
  gymName: 'WFIT GYM',
  primaryBranch: 'Downtown Flagship',
  allowSelfRegistration: true,
  biometricEnforcementActive: true
};

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getStoredToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function parseRouteFromLocation(): AppView {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/crm' || path === '/dashboard' || path === '/portal') {
    return 'crm';
  }
  return 'landing';
}

function normalizeServerTrainers(serverTrainers: TrainerProfile[]): TrainerProfile[] {
  return serverTrainers.map((t) =>
    t.id === 'TR-ALEX' ? { ...t, photoUrl: GYM_IMAGES.coachingFeature } : t
  );
}

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() => parseRouteFromLocation());

  // Instant Role Switcher State (no login screen required; defaults to Owner / Admin)
  const [authToken, setAuthToken] = useState<string>(() => getStoredToken());
  const [currentUser, setCurrentUser] = useState<UserAccount>(() =>
    readStoredJson<UserAccount>(ACTIVE_USER_STORAGE_KEY, DEMO_ACCOUNTS[0])
  );
  const [switchableAccounts, setSwitchableAccounts] = useState<UserAccount[]>(DEMO_ACCOUNTS);
  const [roleSwitchNotice, setRoleSwitchNotice] = useState<string | null>(null);

  // Lifted application data state shared between Public Landing Website and CRM Console
  const [members, setMembers] = useState<Member[]>(() => readStoredJson('wfit_demo_members', INITIAL_MEMBERS));
  const [plans, setPlans] = useState<MembershipPlan[]>(() => readStoredJson('wfit_demo_plans', INITIAL_PLANS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => readStoredJson('wfit_demo_invoices', INITIAL_INVOICES));
  const [trainers, setTrainers] = useState<TrainerProfile[]>(() => readStoredJson('wfit_demo_trainers', INITIAL_TRAINERS));
  const [leads, setLeads] = useState<Lead[]>(() => readStoredJson('wfit_demo_leads', INITIAL_LEADS));
  const [biometricLogs, setBiometricLogs] = useState<BiometricLog[]>(() => readStoredJson('wfit_demo_logs', INITIAL_BIOMETRIC_LOGS));
  const [ptSessions, setPtSessions] = useState<PTSession[]>(() => readStoredJson('wfit_demo_pt_sessions', INITIAL_PT_SESSIONS));
  const [renewals, setRenewals] = useState<RenewalTask[]>(() => readStoredJson('wfit_demo_renewals', INITIAL_RENEWAL_TASKS));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => readStoredJson('wfit_demo_audit', INITIAL_AUDIT_LOGS));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    readStoredJson('wfit_demo_settings', INITIAL_SYSTEM_SETTINGS)
  );

  // Normalize any legacy /login, /register, or /forgot-password path cleanly to '/'
  useEffect(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    if (path === '/login' || path === '/register' || path === '/signup' || path === '/forgot-password') {
      window.history.replaceState(null, '', '/');
      setCurrentView('landing');
    }
  }, []);

  // Navigation helper keeping browser URL synced
  const navigateTo = useCallback((view: AppView, replaceHistory = false) => {
    const targetPath = view === 'crm' ? '/crm' : '/';
    setCurrentView(view);
    if (window.location.pathname !== targetPath) {
      if (replaceHistory) {
        window.history.replaceState(null, '', targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Browser back/forward button listener
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
      if (path === '/login' || path === '/register' || path === '/signup' || path === '/forgot-password') {
        window.history.replaceState(null, '', '/');
        setCurrentView('landing');
        return;
      }
      setCurrentView(parseRouteFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync persistent state changes with localStorage
  useEffect(() => { localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('wfit_demo_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('wfit_demo_plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('wfit_demo_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('wfit_demo_trainers', JSON.stringify(trainers)); }, [trainers]);
  useEffect(() => { localStorage.setItem('wfit_demo_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('wfit_demo_logs', JSON.stringify(biometricLogs)); }, [biometricLogs]);
  useEffect(() => { localStorage.setItem('wfit_demo_pt_sessions', JSON.stringify(ptSessions)); }, [ptSessions]);
  useEffect(() => { localStorage.setItem('wfit_demo_renewals', JSON.stringify(renewals)); }, [renewals]);
  useEffect(() => { localStorage.setItem('wfit_demo_audit', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('wfit_demo_settings', JSON.stringify(systemSettings)); }, [systemSettings]);

  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/accounts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSwitchableAccounts(data);
        }
      }
    } catch {
      // Keep current accounts list if offline
    }
  }, []);

  // Instant Role Switcher (calls POST /api/auth/switch-role for a real Bearer RBAC token)
  const handleSwitchRole = useCallback(async (account: UserAccount, openCrm = false) => {
    setRoleSwitchNotice(null);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          accountId: account.id,
          role: account.role,
          trainerId: account.trainerId,
          memberId: account.memberId
        })
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        setRoleSwitchNotice(errData.message || `${account.name} is currently suspended.`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        if (data.member) {
          setMembers(prev => {
            const exists = prev.some(m => m.id === data.member.id);
            return exists ? prev.map(m => (m.id === data.member.id ? data.member : m)) : [data.member, ...prev];
          });
        }
        if (openCrm) {
          navigateTo('crm');
        }
        return;
      }
    } catch {
      // Offline fallback to client-side role switching
    }

    setCurrentUser(account);
    if (openCrm) {
      navigateTo('crm');
    }
  }, [navigateTo]);

  // Hydrate catalog + role directory + ensure valid active server session token on mount
  useEffect(() => {
    let cancelled = false;

    const bootstrapWorkspace = async () => {
      try {
        const [plansRes, trainersRes, accountsRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/trainers'),
          fetch('/api/auth/accounts')
        ]);

        if (!cancelled && plansRes.ok) {
          const data = await plansRes.json();
          if (Array.isArray(data) && data.length > 0) setPlans(data);
        }
        if (!cancelled && trainersRes.ok) {
          const data = await trainersRes.json();
          if (Array.isArray(data) && data.length > 0) setTrainers(normalizeServerTrainers(data));
        }
        if (!cancelled && accountsRes.ok) {
          const data = await accountsRes.json();
          if (Array.isArray(data) && data.length > 0) setSwitchableAccounts(data);
        }

        const existingToken = getStoredToken();
        if (existingToken) {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${existingToken}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            if (!cancelled && meData.user) {
              setAuthToken(existingToken);
              setCurrentUser(meData.user);
              if (meData.member) {
                setMembers(prev => {
                  const exists = prev.some(m => m.id === meData.member.id);
                  return exists ? prev.map(m => (m.id === meData.member.id ? meData.member : m)) : [meData.member, ...prev];
                });
              }
              return;
            }
          }
        }

        // Issue a live server RBAC token silently for the selected role persona
        const switchRes = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            accountId: currentUser.id,
            role: currentUser.role,
            trainerId: currentUser.trainerId,
            memberId: currentUser.memberId
          })
        });

        if (!cancelled && switchRes.ok) {
          const data = await switchRes.json();
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          setAuthToken(data.token);
          setCurrentUser(data.user);
        } else if (!cancelled) {
          const fallbackRes = await fetch('/api/auth/switch-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: DEMO_ACCOUNTS[0].email })
          });
          if (!cancelled && fallbackRes.ok) {
            const data = await fallbackRes.json();
            localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
            setAuthToken(data.token);
            setCurrentUser(data.user);
          }
        }
      } catch {
        // Offline / fallback to cached client state cleanly
      }
    };

    bootstrapWorkspace();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss transient role switch alert banner
  useEffect(() => {
    if (!roleSwitchNotice) return;
    const timer = setTimeout(() => setRoleSwitchNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [roleSwitchNotice]);

  // Hydrate role-scoped CRM records when active role is Admin or Manager
  useEffect(() => {
    if (!authToken || !currentUser) return;
    if (currentUser.role !== 'OWNER / ADMIN' && currentUser.role !== 'CLUB MANAGER') return;

    let cancelled = false;
    const syncOperationalData = async () => {
      try {
        const headers = { Authorization: `Bearer ${authToken}` };
        const [memRes, leadsRes, bioRes, renRes, trainersRes, plansRes, settingsRes] = await Promise.all([
          fetch('/api/members', { headers }),
          fetch('/api/leads', { headers }),
          fetch('/api/biometric-logs', { headers }),
          fetch('/api/renewals', { headers }),
          fetch('/api/trainers'),
          fetch('/api/plans'),
          fetch('/api/settings', { headers })
        ]);
        if (!cancelled && memRes.ok) {
          const data = await memRes.json();
          if (Array.isArray(data) && data.length > 0) setMembers(data);
        }
        if (!cancelled && leadsRes.ok) {
          const data = await leadsRes.json();
          if (Array.isArray(data) && data.length > 0) setLeads(data);
        }
        if (!cancelled && bioRes.ok) {
          const data = await bioRes.json();
          if (Array.isArray(data) && data.length > 0) setBiometricLogs(data);
        }
        if (!cancelled && renRes.ok) {
          const data = await renRes.json();
          if (Array.isArray(data) && data.length > 0) setRenewals(data);
        }
        if (!cancelled && trainersRes.ok) {
          const data = await trainersRes.json();
          if (Array.isArray(data) && data.length > 0) setTrainers(normalizeServerTrainers(data));
        }
        if (!cancelled && plansRes.ok) {
          const data = await plansRes.json();
          if (Array.isArray(data) && data.length > 0) setPlans(data);
        }
        if (!cancelled && settingsRes.ok) {
          const data = await settingsRes.json();
          if (data && typeof data.managerPaymentAccessEnabled === 'boolean') setSystemSettings(data);
        }
      } catch {
        // Retain current state gracefully
      }
    };

    syncOperationalData();
    return () => { cancelled = true; };
  }, [authToken, currentUser]);

  // Persist public website consultation / enquiry submissions into CRM Leads Pipeline
  const handleSubmitLandingLead = async (input: {
    name: string;
    mobile: string;
    email: string;
    interestedPlan: string;
    message: string;
  }) => {
    const planLower = input.interestedPlan.toLowerCase();
    const interestedProduct: Lead['interestedProduct'] =
      planLower.includes('personal') ? 'Personal Training' :
      planLower.includes('box') ? 'Boxing' :
      planLower.includes('group') || planLower.includes('condition') ? 'Group Classes' :
      'Gym Membership';

    const combinedNotes = `${input.interestedPlan}${input.message ? ` — ${input.message}` : ''}`;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          mobile: input.mobile,
          email: input.email,
          source: 'Website',
          interestedProduct,
          stage: 'New enquiry',
          notes: combinedNotes
        })
      });
      if (res.ok) {
        const createdLead: Lead = await res.json();
        setLeads(prev => [createdLead, ...prev.filter(l => l.id !== createdLead.id)]);
        return;
      }
    } catch {
      // Fall back to local persistence
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const fallbackLead: Lead = {
      id: `LEAD-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: input.name,
      mobile: input.mobile,
      email: input.email,
      source: 'Website',
      interestedProduct,
      assignedExecutive: 'Sneha Rao (Front Office)',
      stage: 'New enquiry',
      enquiryDate: today,
      lastContactDate: today,
      nextFollowUpDate: tomorrow,
      notes: combinedNotes
    };
    setLeads(prev => [fallbackLead, ...prev]);
  };

  // Reset cached client demo state to clean sample seed and Owner/Admin view
  const handleResetDemoData = () => {
    if (window.confirm('Reset all local CRM demo state to original sample data?')) {
      [
        'wfit_demo_members',
        'wfit_demo_plans',
        'wfit_demo_invoices',
        'wfit_demo_trainers',
        'wfit_demo_leads',
        'wfit_demo_logs',
        'wfit_demo_pt_sessions',
        'wfit_demo_renewals',
        'wfit_demo_audit',
        'wfit_demo_settings'
      ].forEach(k => localStorage.removeItem(k));

      setMembers(INITIAL_MEMBERS);
      setPlans(INITIAL_PLANS);
      setInvoices(INITIAL_INVOICES);
      setTrainers(INITIAL_TRAINERS);
      setLeads(INITIAL_LEADS);
      setBiometricLogs(INITIAL_BIOMETRIC_LOGS);
      setPtSessions(INITIAL_PT_SESSIONS);
      setRenewals(INITIAL_RENEWAL_TASKS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setSystemSettings(INITIAL_SYSTEM_SETTINGS);
      handleSwitchRole(DEMO_ACCOUNTS[0]);
    }
  };

  return (
    <>
      {roleSwitchNotice && (
        <div
          role="alert"
          className="fixed bottom-5 right-5 z-[100] max-w-sm bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center justify-between gap-3"
        >
          <span>{roleSwitchNotice}</span>
          <button
            type="button"
            onClick={() => setRoleSwitchNotice(null)}
            className="text-white/80 hover:text-white font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {currentView === 'crm' ? (
        <WFitCrm
          onBackToLanding={() => navigateTo('landing')}
          currentUser={currentUser}
          authToken={authToken}
          switchableAccounts={switchableAccounts}
          onSwitchDemoAccount={(acc) => handleSwitchRole(acc, true)}
          onRefreshAccounts={refreshAccounts}
          onResetDemoData={handleResetDemoData}
          plans={plans}
          setPlans={setPlans}
          members={members}
          setMembers={setMembers}
          invoices={invoices}
          setInvoices={setInvoices}
          trainers={trainers}
          setTrainers={setTrainers}
          leads={leads}
          setLeads={setLeads}
          biometricLogs={biometricLogs}
          setBiometricLogs={setBiometricLogs}
          ptSessions={ptSessions}
          setPtSessions={setPtSessions}
          renewals={renewals}
          setRenewals={setRenewals}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          systemSettings={systemSettings}
          setSystemSettings={setSystemSettings}
        />
      ) : (
        <WFitLanding
          plans={plans}
          trainers={trainers}
          currentUser={currentUser}
          switchableAccounts={switchableAccounts}
          onSwitchRole={(acc, openCrm) => handleSwitchRole(acc, Boolean(openCrm))}
          onOpenCrm={() => navigateTo('crm')}
          onSubmitLead={handleSubmitLandingLead}
        />
      )}
    </>
  );
};

export default App;
