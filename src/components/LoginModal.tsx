import React, { useState } from 'react';
import {
  Dumbbell, Eye, EyeOff, Lock, User, AlertCircle, ShieldCheck,
  ArrowRight, Loader2, X, Sparkles, KeyRound, UserPlus
} from 'lucide-react';
import { UserAccount, Member, UserPermissions } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (
    user: UserAccount,
    token: string,
    permissions: UserPermissions,
    member?: Member,
    rememberMe?: boolean
  ) => void;
  onOpenFullAuthPage?: (mode: 'login' | 'register' | 'forgot') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenFullAuthPage
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const authenticate = async (loginId: string, loginPass: string, remember: boolean) => {
    setErrorMessage(null);
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
        throw new Error(data.message || 'Authentication failed. Please verify credentials.');
      }

      onLoginSuccess(data.user, data.token, data.permissions, data.member, remember);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticate(identifier, password, rememberMe);
  };

  const handleInstantDemoLogin = async (demoUser: string, demoPass: string) => {
    setIdentifier(demoUser);
    setPassword(demoPass);
    await authenticate(demoUser, demoPass, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Top Accent Header Bar */}
        <div className="bg-[#1D4ED8] text-white px-4 py-1.5 text-center text-[11px] font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>WFIT GYM AUTHENTICATION & DEMO ACCESS</span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-4 p-1.5 rounded-full text-[#70798A] hover:text-[#172033] hover:bg-slate-100 transition-colors z-10 cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="p-6 bg-[#F8FAFC] border-b border-[#E2E8F0] text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Dumbbell className="w-6 h-6 text-[#1D4ED8]" />
          </div>

          <h2 className="font-archivo-brand text-xl font-bold tracking-widest text-[#172033] uppercase">
            WFIT GYM CRM
          </h2>
          <p className="text-xs text-[#5B6475] mt-1 font-mono font-semibold">
            SIGN IN WITH REGISTERED CREDENTIALS OR DEMO ROLES
          </p>
        </div>

        {/* 1-Click Instant Demo Role Switcher */}
        <div className="p-5 border-b border-[#E2E8F0] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6475] mb-2.5 flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
            <span>Quick Demo Sign-In (Real Server Session):</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('admin@wfitgym.com', 'Admin@WFIT2026!')}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200 text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="font-bold text-[#1D4ED8] flex items-center justify-between">
                <span>1. Owner / Admin</span>
                <span className="text-[10px] bg-blue-200/60 text-[#1D4ED8] px-1.5 rounded font-mono">Full Ops</span>
              </div>
              <div className="text-[10px] text-[#5B6475] font-mono mt-0.5 truncate">admin@wfitgym.com</div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('manager@wfitgym.com', 'Manager@WFIT2026!')}
              className="p-2.5 rounded-xl bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200 text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="font-bold text-sky-800 flex items-center justify-between">
                <span>2. Club Manager</span>
                <span className="text-[10px] bg-sky-200/60 text-sky-800 px-1.5 rounded font-mono">Members</span>
              </div>
              <div className="text-[10px] text-[#5B6475] font-mono mt-0.5 truncate">manager@wfitgym.com</div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('alex.chen@wfitgym.com', 'Trainer@WFIT2026!')}
              className="p-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200 text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="font-bold text-purple-800 flex items-center justify-between">
                <span>3. Trainer (Coach)</span>
                <span className="text-[10px] bg-purple-200/60 text-purple-800 px-1.5 rounded font-mono">No Financials</span>
              </div>
              <div className="text-[10px] text-[#5B6475] font-mono mt-0.5 truncate">alex.chen@wfitgym.com</div>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('rohan.mehra@example.com', 'Member@WFIT2026!')}
              className="p-2.5 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer shadow-xs"
            >
              <div className="font-bold text-emerald-800 flex items-center justify-between">
                <span>4. Member Portal</span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 rounded font-mono">Active Pass</span>
              </div>
              <div className="text-[10px] text-[#5B6475] font-mono mt-0.5 truncate">rohan.mehra@example.com</div>
            </button>
          </div>

          <div className="mt-2.5 text-center">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleInstantDemoLogin('vikram.sengupta@example.com', 'Member@WFIT2026!')}
              className="text-[11px] text-[#1D4ED8] hover:underline font-mono font-semibold cursor-pointer"
            >
              Switch to Pending-Dues Demo Member (Vikramaditya Sengupta) →
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Authentication Notice</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Standard Account Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs font-semibold text-[#70798A] uppercase tracking-wider font-mono">
            Sign In With Any Account Credentials:
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5B6475] uppercase tracking-wider mb-1 font-mono">
              Email or Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
              <input
                type="text"
                required
                placeholder="email@wfitgym.com or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#5B6475] uppercase tracking-wider font-mono">
                Password
              </label>
              {onOpenFullAuthPage && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullAuthPage('forgot');
                  }}
                  className="text-[11px] font-semibold text-[#1D4ED8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot password?</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70798A]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70798A] hover:text-[#172033] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-[#5B6475] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#1D4ED8]"
            />
            <span>Remember me for 7 days</span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          {onOpenFullAuthPage && (
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#5B6475]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullAuthPage('register');
                }}
                className="inline-flex items-center gap-1 font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Member Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullAuthPage('login');
                }}
                className="font-semibold text-[#5B6475] hover:text-[#172033] cursor-pointer"
              >
                Open Full Login Page →
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
