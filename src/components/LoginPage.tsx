import React, { useState, useEffect } from 'react';
import {
  Dumbbell, Eye, EyeOff, Lock, User, Mail, Phone, MapPin, ShieldCheck,
  ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2, KeyRound,
  Sparkles, UserPlus, Check, Shield
} from 'lucide-react';
import { UserAccount, Member, MembershipPlan, UserPermissions } from '../types';
import { GYM_IMAGES } from '../assets/images';

export type AuthPageMode = 'login' | 'register' | 'forgot';

interface LoginPageProps {
  initialMode?: AuthPageMode;
  plans: MembershipPlan[];
  onBackToLanding: () => void;
  onModeChange?: (mode: AuthPageMode) => void;
  onAuthSuccess: (payload: {
    user: UserAccount;
    token: string;
    permissions: UserPermissions;
    member?: Member;
    rememberMe: boolean;
  }) => void;
}

const DEMO_ROLES = [
  {
    key: 'admin',
    roleLabel: 'Owner / Admin',
    badge: 'Full Access',
    identifier: 'admin@wfitgym.com',
    password: 'Admin@WFIT2026!',
    description: 'Revenue, staff policies, trainers, plans & audit logs',
    colorClass: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200 text-[#1D4ED8]'
  },
  {
    key: 'manager',
    roleLabel: 'Club Manager',
    badge: 'Operations',
    identifier: 'manager@wfitgym.com',
    password: 'Manager@WFIT2026!',
    description: 'Members, leads pipeline, turnstile gates & renewals',
    colorClass: 'bg-sky-50/70 hover:bg-sky-100/80 border-sky-200 text-sky-800'
  },
  {
    key: 'trainer',
    roleLabel: 'Trainer (Alex)',
    badge: 'No Financials',
    identifier: 'alex.chen@wfitgym.com',
    password: 'Trainer@WFIT2026!',
    description: 'Assigned roster, workout programming & coach schedule',
    colorClass: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200 text-purple-800'
  },
  {
    key: 'member',
    roleLabel: 'Member (Rohan)',
    badge: 'Active Pass',
    identifier: 'rohan.mehra@example.com',
    password: 'Member@WFIT2026!',
    description: 'Personal dashboard, workouts & interactive checkout',
    colorClass: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-[#15803D]'
  },
  {
    key: 'member-due',
    roleLabel: 'Member (Pending Dues)',
    badge: 'Billing Alert',
    identifier: 'vikram.sengupta@example.com',
    password: 'Member@WFIT2026!',
    description: 'Test outstanding dues & blocked turnstile workflow',
    colorClass: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200 text-[#B45309]'
  }
];

function evaluatePasswordStrength(pw: string) {
  const checks = {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
    hasSpecial: /[^A-Za-z0-9]/.test(pw)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

export const LoginPage: React.FC<LoginPageProps> = ({
  initialMode = 'login',
  plans,
  onBackToLanding,
  onModeChange,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<AuthPageMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthPageMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessNotice(null);
    if (onModeChange) onModeChange(nextMode);
  };

  // Shared UI Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sign In Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('+91 ');
  const [regUsername, setRegUsername] = useState('');
  const [regBranch, setRegBranch] = useState('Downtown Flagship');
  const [regPlanId, setRegPlanId] = useState(plans[1]?.id || plans[0]?.id || 'plan-3m');
  const [regGoals, setRegGoals] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Forgot / Reset Password State
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [demoPreviewCode, setDemoPreviewCode] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const regStrength = evaluatePasswordStrength(regPassword);
  const resetStrength = evaluatePasswordStrength(newPassword);

  const performLogin = async (loginId: string, loginPass: string, remember: boolean) => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginId.trim(),
          password: loginPass,
          rememberMe: remember
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Check your email/username and password.');
      }

      onAuthSuccess({
        user: data.user,
        token: data.token,
        permissions: data.permissions,
        member: data.member,
        rememberMe: remember
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }
    await performLogin(identifier, password, rememberMe);
  };

  const handleDemoQuickSignIn = async (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    await performLogin(demoId, demoPass, true);
  };

  const handleDemoFillOnly = (demoId: string, demoPass: string) => {
    switchMode('login');
    setIdentifier(demoId);
    setPassword(demoPass);
    setErrorMessage(null);
    setSuccessNotice(`Loaded credentials for ${demoId}. Click Sign In to authenticate.`);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (regFullName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (regMobile.replace(/\D/g, '').length < 8) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }
    if (!acceptTerms) {
      setErrorMessage('Please accept the club membership policy to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          mobile: regMobile.trim(),
          username: regUsername.trim() || undefined,
          password: regPassword,
          branch: regBranch,
          planId: regPlanId,
          fitnessGoals: regGoals.trim() || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      onAuthSuccess({
        user: data.user,
        token: data.token,
        permissions: data.permissions,
        member: data.member,
        rememberMe: true
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register new account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address or username.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Account lookup failed.');
      }

      setForgotIdentifier(data.email);
      setForgotMaskedEmail(data.maskedEmail);
      setDemoPreviewCode(data.demoPreviewCode);
      setForgotStep(2);
      setSuccessNotice(data.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate reset verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!resetCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          code: resetCode.trim(),
          newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification code invalid or expired.');
      }

      setIdentifier(data.email || forgotIdentifier);
      setPassword('');
      setForgotStep(1);
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setDemoPreviewCode(null);
      switchMode('login');
      setSuccessNotice('Password updated cleanly. You can now sign in with your new password.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col lg:flex-row font-sans antialiased">
      {/* =========================================================================
          LEFT COLUMN: WFIT ATHLETIC CLUB BRAND SHOWCASE (OBSIDIAN #080808)
      ========================================================================= */}
      <aside className="lg:w-[44%] xl:w-[42%] bg-[#080808] border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Background Atmospheric Photograph */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={GYM_IMAGES.gymInterior}
            alt="WFIT GYM Interior Training Zone"
            className="w-full h-full object-cover opacity-25 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/95 via-[#080808]/85 to-[#080808]" />
        </div>

        {/* Top Bar: Logo + Back Button */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#C6FF00] group-hover:scale-105 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="font-archivo-brand text-lg font-bold tracking-wider text-white uppercase block leading-none">
                WFIT GYM
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#C6FF00] uppercase">
                ATHLETIC CLUB PORTAL
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#C6FF00]" />
            <span>Back to Website</span>
          </button>
        </div>

        {/* Middle Hero Copy */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-[11px] font-mono text-[#C6FF00] uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Unified Club Access & RBAC Security</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-archivo-title text-3xl sm:text-4xl xl:text-5xl text-white uppercase tracking-tight leading-[0.98]">
              TRAIN SMART. <br />
              MANAGE WITH PRECISION.
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-md">
              Sign in with your verified credentials or create a new member pass. Every account is protected by cryptographic hashing and role-isolated operational permissions.
            </p>
          </div>

          {/* 4-Role Capability Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-mono text-[#C6FF00] font-bold uppercase">Owner / Admin</div>
              <p className="text-xs text-white/70 mt-1">Financial analytics, GST reconciliation, staff policies, trainer hiring & audit logs.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-mono text-sky-400 font-bold uppercase">Club Manager</div>
              <p className="text-xs text-white/70 mt-1">Member desk, leads conversion, turnstile gate logs & expiry follow-up tasks.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-mono text-purple-400 font-bold uppercase">Certified Trainers</div>
              <p className="text-xs text-white/70 mt-1">Assigned roster, workout programming & zero financial data visibility.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Gym Members</div>
              <p className="text-xs text-white/70 mt-1">Digital pass, biometric entry status, assigned workouts & invoice checkouts.</p>
            </div>
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-6 border-t border-white/10 text-[11px] font-mono text-white/50">
          <span>PBKDF2-SHA512 • Rate-Limited Login Protection</span>
          <span className="text-[#C6FF00]">WFIT 2026 CRM</span>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT COLUMN: AUTHENTICATION WORKSPACE (CRISP WHITE #FFFFFF)
      ========================================================================= */}
      <section className="flex-1 bg-[#F8FAFC] text-[#172033] flex flex-col justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Main Auth Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-lg overflow-hidden">
            {/* Top Navigation Tabs (Sign In vs Create Account vs Password Recovery) */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 pt-5 pb-4">
              <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white text-[#172033] shadow-xs'
                      : 'text-[#5B6475] hover:text-[#172033]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white text-[#172033] shadow-xs'
                      : 'text-[#5B6475] hover:text-[#172033]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    switchMode('forgot');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'forgot'
                      ? 'bg-white text-[#172033] shadow-xs'
                      : 'text-[#5B6475] hover:text-[#172033]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Reset Password</span>
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Alerts */}
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-[#B91C1C]">
                  <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authentication Error</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {successNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Verification Update</span>
                    <span>{successNotice}</span>
                  </div>
                </div>
              )}

              {/* =========================================================
                  MODE 1: SIGN IN
              ========================================================= */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight">
                      Sign in to WFIT GYM
                    </h2>
                    <p className="text-xs text-[#5B6475] mt-1">
                      Enter your email address or username for Owner, Manager, Trainer, or Member access.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="login-identifier" className="block text-xs font-semibold text-[#172033] mb-1.5">
                      Email Address or Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70798A]" />
                      <input
                        id="login-identifier"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="e.g. rohan.mehra@example.com or admin"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-xs font-semibold text-[#172033]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotIdentifier(identifier);
                          setForgotStep(1);
                          switchMode('forgot');
                        }}
                        className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70798A]" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/15 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798A] hover:text-[#172033] cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-[#5B6475] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                      />
                      <span>Keep me signed in for 7 days</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center text-xs text-[#5B6475] pt-1">
                    New to WFIT GYM?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Create a member account →
                    </button>
                  </div>
                </form>
              )}

              {/* =========================================================
                  MODE 2: CREATE MEMBER ACCOUNT (/register)
              ========================================================= */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight">
                      Create Member Account
                    </h2>
                    <p className="text-xs text-[#5B6475] mt-1">
                      Register for instant WFIT GYM member access, workout tracking, and online billing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Arjun Menon"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 00000"
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <input
                          type="email"
                          required
                          placeholder="arjun@example.com"
                          value={regEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRegEmail(val);
                            if (!regUsername && val.includes('@')) {
                              setRegUsername(val.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                            }
                          }}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Preferred Username
                      </label>
                      <input
                        type="text"
                        placeholder="auto-generated from email"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#1D4ED8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Home Branch
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <select
                          value={regBranch}
                          onChange={(e) => setRegBranch(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                        >
                          <option value="Downtown Flagship">Downtown Flagship</option>
                          <option value="West End Wing">West End Wing</option>
                          <option value="North Studio">North Studio</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Starting Membership Plan
                      </label>
                      <select
                        value={regPlanId}
                        onChange={(e) => setRegPlanId(e.target.value)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} — ₹{plan.price.toLocaleString('en-IN')} ({plan.durationMonths}m)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#172033] mb-1">
                      Primary Fitness Goals (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Build lean muscle mass & 100kg deadlift progression"
                      value={regGoals}
                      onChange={(e) => setRegGoals(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Create Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Min. 8 characters"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-9 py-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#1D4ED8]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#70798A] hover:text-[#172033]"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#172033] mb-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Re-enter password"
                          value={regConfirmPassword}
                          onChange={(e) => setConfirmPasswordSafe(e.target.value, setRegConfirmPassword)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-8.5 pr-3 py-2 text-xs text-[#172033] font-mono focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#5B6475]">Password Strength</span>
                      <span className={`font-mono font-bold ${
                        regStrength.score >= 3 ? 'text-[#15803D]' :
                        regStrength.score === 2 ? 'text-[#B45309]' : 'text-[#70798A]'
                      }`}>
                        {regStrength.score === 4 ? 'Strong' : regStrength.score >= 2 ? 'Fair' : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-colors ${
                            regStrength.score >= step
                              ? regStrength.score >= 3 ? 'bg-emerald-500' : 'bg-amber-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-[#5B6475]">
                      <span className={regStrength.checks.minLength ? 'text-[#15803D] font-semibold' : ''}>
                        {regStrength.checks.minLength ? '✓' : '○'} 8+ chars
                      </span>
                      <span className={regStrength.checks.hasUpper ? 'text-[#15803D] font-semibold' : ''}>
                        {regStrength.checks.hasUpper ? '✓' : '○'} Uppercase
                      </span>
                      <span className={regStrength.checks.hasNumber ? 'text-[#15803D] font-semibold' : ''}>
                        {regStrength.checks.hasNumber ? '✓' : '○'} Number
                      </span>
                      <span className={regStrength.checks.hasSpecial ? 'text-[#15803D] font-semibold' : ''}>
                        {regStrength.checks.hasSpecial ? '✓' : '○'} Symbol
                      </span>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-[#5B6475] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] text-[#1D4ED8]"
                    />
                    <span>I accept WFIT GYM facility conduct policies and biometric membership registration terms.</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Member Profile...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register & Enter Member Portal</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* =========================================================
                  MODE 3: FORGOT / RESET PASSWORD (/forgot-password)
              ========================================================= */}
              {mode === 'forgot' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#172033] tracking-tight">
                      {forgotStep === 1 ? 'Reset Account Password' : 'Verify 6-Digit Reset Code'}
                    </h2>
                    <p className="text-xs text-[#5B6475] mt-1">
                      {forgotStep === 1
                        ? 'Enter your registered email address or username to issue a temporary 6-digit verification code.'
                        : `Enter the verification code issued for ${forgotMaskedEmail || forgotIdentifier} and choose a strong new password.`}
                    </p>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotStep1} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                          Registered Email or Username
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70798A]" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. rohan.mehra@example.com"
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating Code...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>Send 6-Digit Reset Code</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotStep2} className="space-y-4">
                      {demoPreviewCode && (
                        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-mono uppercase font-bold text-[#1D4ED8]">
                              Local Demo Delivery Preview
                            </div>
                            <div className="text-xs text-[#172033] mt-0.5">
                              Verification Code: <strong className="font-mono text-sm tracking-widest text-[#1D4ED8]">{demoPreviewCode}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResetCode(demoPreviewCode)}
                            className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-[11px] font-bold hover:bg-[#1E40AF] cursor-pointer shrink-0"
                          >
                            Fill Code
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-[#172033] mb-1">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="6-digit OTP code"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#172033] mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Min. 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#172033] mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Confirm password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-mono text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                          />
                        </div>
                      </div>

                      {newPassword && (
                        <div className="flex items-center justify-between text-[11px] text-[#5B6475] font-mono">
                          <span>Strength: {resetStrength.score}/4</span>
                          <span className={resetStrength.checks.minLength ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                            {resetStrength.checks.minLength ? '✓ At least 8 characters' : 'Minimum 8 characters required'}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#5B6475] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Confirm New Password</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="text-center text-xs text-[#5B6475] pt-1">
                    Remembered your password?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              INTEGRATED DEMO ACCESS PANEL (REAL SERVER AUTHENTICATION)
          ========================================================================= */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1D4ED8]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wide font-mono">
                    Quick Demo Role Access
                  </h3>
                  <p className="text-[11px] text-[#5B6475]">
                    Instant 1-click sign-in via live <code className="font-mono text-[#1D4ED8]">/api/auth/login</code> or inspect credentials first
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 text-[10px] font-mono font-bold">
                <ShieldCheck className="w-3 h-3" />
                Verified Server Tokens
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ROLES.map((item) => (
                <div
                  key={item.key}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${item.colorClass} ${
                    item.key === 'member-due' ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>{item.roleLabel}</span>
                      </div>
                      <div className="text-[10px] opacity-80 font-mono truncate mt-0.5">
                        {item.identifier}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white/80 text-[9.5px] font-mono font-bold shrink-0">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-[10.5px] opacity-85 leading-snug">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDemoQuickSignIn(item.identifier, item.password)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#172033] hover:bg-black text-white text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      1-Click Sign In →
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDemoFillOnly(item.identifier, item.password)}
                      className="py-1.5 px-2.5 rounded-lg bg-white/90 hover:bg-white border border-black/10 text-[#172033] text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Copy credentials into form without submitting yet"
                    >
                      Fill Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

function setConfirmPasswordSafe(val: string, setter: React.Dispatch<React.SetStateAction<string>>) {
  setter(val);
}
