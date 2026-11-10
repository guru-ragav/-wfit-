import React, { useState, useEffect } from 'react';
import {
  AuthPortalConfig, AuthAccentPreset, AuthLayoutMode, AuthPhotoKey, MembershipPlan
} from '../types';
import { INITIAL_AUTH_CONFIG } from '../mockData';
import { GYM_IMAGES } from '../assets/images';
import {
  Palette, Layout, Sparkles, Lock, UserPlus, Check, RotateCcw,
  ExternalLink, Save, Smartphone, Eye, Shield, Dumbbell, Megaphone
} from 'lucide-react';

interface AuthCustomizerViewProps {
  authConfig: AuthPortalConfig;
  plans: MembershipPlan[];
  onSaveConfig: (nextConfig: AuthPortalConfig) => Promise<void> | void;
  onPreviewLive: (mode: 'login' | 'register') => void;
}

const PHOTO_OPTIONS: { key: AuthPhotoKey; label: string; src: string }[] = [
  { key: 'gymInterior', label: 'Main Lobby & Turnstiles', src: GYM_IMAGES.gymInterior },
  { key: 'heroEquipment', label: 'Olympic Free Weights', src: GYM_IMAGES.heroEquipment },
  { key: 'strengthFeature', label: 'Barbell Strength Zone', src: GYM_IMAGES.strengthFeature },
  { key: 'coachingFeature', label: 'Personal Coaching Turf', src: GYM_IMAGES.coachingFeature },
  { key: 'dumbbellsTraining', label: 'Dumbbell Arsenal', src: GYM_IMAGES.dumbbellsTraining },
  { key: 'cardioFeature', label: 'Cardio Conditioning Deck', src: GYM_IMAGES.cardioFeature }
];

const ACCENT_PRESETS: {
  id: AuthAccentPreset;
  label: string;
  swatchHex: string;
  previewBtnClass: string;
}[] = [
  { id: 'electric-blue', label: 'Electric Blue', swatchHex: '#1D4ED8', previewBtnClass: 'bg-[#1D4ED8] text-white' },
  { id: 'volt-lime', label: 'Athletic Volt', swatchHex: '#C6FF00', previewBtnClass: 'bg-[#C6FF00] text-[#080808]' },
  { id: 'emerald-club', label: 'Emerald Club', swatchHex: '#15803D', previewBtnClass: 'bg-[#15803D] text-white' },
  { id: 'obsidian-slate', label: 'Obsidian Ink', swatchHex: '#172033', previewBtnClass: 'bg-[#172033] text-white' }
];

export const AuthCustomizerView: React.FC<AuthCustomizerViewProps> = ({
  authConfig,
  plans,
  onSaveConfig,
  onPreviewLive
}) => {
  const [draft, setDraft] = useState<AuthPortalConfig>(authConfig);
  const [branchesText, setBranchesText] = useState((authConfig.branches || []).join(', '));
  const [previewTab, setPreviewTab] = useState<'login' | 'register'>('login');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(authConfig);
    setBranchesText((authConfig.branches || []).join(', '));
  }, [authConfig]);

  const applyBranchesText = (raw: string) => {
    setBranchesText(raw);
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalBranches = parsed.length > 0 ? parsed : ['Downtown Flagship'];
    setDraft((prev) => ({
      ...prev,
      branches: finalBranches,
      defaultBranch: finalBranches.includes(prev.defaultBranch) ? prev.defaultBranch : finalBranches[0]
    }));
  };

  const applyPreset = (presetName: 'default' | 'minimal' | 'volt' | 'production') => {
    if (presetName === 'default') {
      setDraft(INITIAL_AUTH_CONFIG);
      setBranchesText(INITIAL_AUTH_CONFIG.branches.join(', '));
      return;
    }
    if (presetName === 'minimal') {
      const next: AuthPortalConfig = {
        ...draft,
        layoutMode: 'centered-card',
        accentPreset: 'obsidian-slate',
        heroPhotoKey: 'heroEquipment',
        welcomeNoticeBanner: ''
      };
      setDraft(next);
      return;
    }
    if (presetName === 'volt') {
      const next: AuthPortalConfig = {
        ...draft,
        layoutMode: 'split-showcase',
        accentPreset: 'volt-lime',
        heroPhotoKey: 'strengthFeature',
        welcomeNoticeBanner: 'Complimentary InBody scan & movement screening included with online signup.'
      };
      setDraft(next);
      return;
    }
    if (presetName === 'production') {
      const next: AuthPortalConfig = {
        ...draft,
        layoutMode: 'split-showcase',
        accentPreset: 'emerald-club',
        showDemoRoleAccess: false,
        enableMobileOtpLogin: true,
        allowSelfRegistration: true,
        welcomeNoticeBanner: 'Online Member Onboarding Open · Instant Digital Gate Pass',
        signupFields: {
          ...draft.signupFields,
          requireUsername: true,
          showBranchSelector: true,
          showPlanSelector: true,
          showFitnessGoals: true,
          requireDateOfBirth: true,
          showEmergencyContact: true,
          showReferralCode: true
        }
      };
      setDraft(next);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(draft);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setDraft(INITIAL_AUTH_CONFIG);
    setBranchesText(INITIAL_AUTH_CONFIG.branches.join(', '));
    setIsSaving(true);
    try {
      await onSaveConfig(INITIAL_AUTH_CONFIG);
    } finally {
      setIsSaving(false);
    }
  };

  const activePresetStyle = ACCENT_PRESETS.find((p) => p.id === draft.accentPreset) || ACCENT_PRESETS[0];
  const activeBgSrc = PHOTO_OPTIONS.find((p) => p.key === draft.heroPhotoKey)?.src || GYM_IMAGES.gymInterior;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#172033]">Login & Signup Portal Customization</h3>
          <p className="text-xs text-[#5B6475]">
            Configure layout, club branding, color theme, authentication providers, and custom signup fields published directly to /login and /register.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#5B6475] hover:text-[#172033] text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => onPreviewLive(previewTab)}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Open Live /{previewTab === 'login' ? 'login' : 'register'}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Changes'}</span>
          </button>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
          <Sparkles className="w-4 h-4 text-[#1D4ED8]" />
          <span>Quick Style Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-blue-50 border border-[#E2E8F0] hover:border-blue-200 text-xs font-semibold text-[#172033] cursor-pointer whitespace-nowrap"
          >
            Default Athletic Split
          </button>
          <button
            type="button"
            onClick={() => applyPreset('minimal')}
            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-xs font-semibold text-[#172033] cursor-pointer whitespace-nowrap"
          >
            Minimal Centered Card
          </button>
          <button
            type="button"
            onClick={() => applyPreset('volt')}
            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-lime-50 border border-[#E2E8F0] hover:border-lime-300 text-xs font-semibold text-[#172033] cursor-pointer whitespace-nowrap"
          >
            Athletic Volt Theme
          </button>
          <button
            type="button"
            onClick={() => applyPreset('production')}
            className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-emerald-50 border border-[#E2E8F0] hover:border-emerald-200 text-xs font-semibold text-[#172033] cursor-pointer whitespace-nowrap"
          >
            Live Member Mode (Full Intake)
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: CUSTOMIZATION CONTROLS */}
        <div className="xl:col-span-7 space-y-5">
          {/* 1. Brand, Layout & Color Palette */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Palette className="w-4 h-4 text-[#1D4ED8]" />
              <h4 className="font-bold text-sm text-[#172033]">01. Visual Branding, Layout & Photography</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Brand Name</label>
                <input
                  type="text"
                  value={draft.brandTitle}
                  onChange={(e) => setDraft({ ...draft, brandTitle: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Portal Tagline</label>
                <input
                  type="text"
                  value={draft.brandSubtitle}
                  onChange={(e) => setDraft({ ...draft, brandSubtitle: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1.5">Page Layout Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'split-showcase', label: 'Split Showcase' },
                      { id: 'centered-card', label: 'Centered Card' }
                    ] as { id: AuthLayoutMode; label: string }[]
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, layoutMode: mode.id })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        draft.layoutMode === mode.id
                          ? 'bg-blue-50 text-[#1D4ED8] border-blue-300'
                          : 'bg-white text-[#5B6475] border-[#E2E8F0] hover:bg-slate-50'
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#5B6475] font-semibold mb-1.5">Button & Accent Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, accentPreset: preset.id })}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                        draft.accentPreset === preset.id
                          ? 'bg-slate-100 text-[#172033] border-[#172033]'
                          : 'bg-white text-[#5B6475] border-[#E2E8F0] hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: preset.swatchHex }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[#5B6475] font-semibold mb-1.5">Showcase Background Photo</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHOTO_OPTIONS.map((photo) => {
                  const selected = draft.heroPhotoKey === photo.key;
                  return (
                    <button
                      key={photo.key}
                      type="button"
                      onClick={() => setDraft({ ...draft, heroPhotoKey: photo.key })}
                      className={`p-1.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selected ? 'border-[#1D4ED8] bg-blue-50/50' : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="h-14 rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                        <img
                          src={photo.src}
                          alt={photo.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-[11px] font-semibold text-[#172033] truncate">{photo.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Showcase Hero Headline</label>
                <input
                  type="text"
                  value={draft.heroHeadline}
                  onChange={(e) => setDraft({ ...draft, heroHeadline: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Showcase Description</label>
                <textarea
                  rows={2}
                  value={draft.heroDescription}
                  onChange={(e) => setDraft({ ...draft, heroDescription: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Optional Top Announcement Banner (leave blank to hide)</label>
                <input
                  type="text"
                  placeholder="e.g. New Year Transformation Batch Open — Free InBody Check on Signup"
                  value={draft.welcomeNoticeBanner}
                  onChange={(e) => setDraft({ ...draft, welcomeNoticeBanner: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>
          </section>

          {/* 2. Sign In Behavior & Providers */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <Lock className="w-4 h-4 text-[#1D4ED8]" />
              <h4 className="font-bold text-sm text-[#172033]">02. Login Screen Copy & Authentication Methods</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Sign-In Heading</label>
                <input
                  type="text"
                  value={draft.loginHeading}
                  onChange={(e) => setDraft({ ...draft, loginHeading: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Sign-In Helper Subtitle</label>
                <input
                  type="text"
                  value={draft.loginSubtext}
                  onChange={(e) => setDraft({ ...draft, loginSubtext: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="font-bold text-[#172033] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>Mobile Phone OTP Sign-In</span>
                  </div>
                  <div className="text-[11px] text-[#5B6475]">Allow SMS OTP login using registered phone</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.enableMobileOtpLogin}
                  onChange={(e) => setDraft({ ...draft, enableMobileOtpLogin: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="font-bold text-[#172033]">Quick Demo Role Panel</div>
                  <div className="text-[11px] text-[#5B6475]">Show or hide 1-click demo accounts card</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.showDemoRoleAccess}
                  onChange={(e) => setDraft({ ...draft, showDemoRoleAccess: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="font-bold text-[#172033]">7-Day "Remember Me"</div>
                  <div className="text-[11px] text-[#5B6475]">Allow persistent login sessions across browser restarts</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.showRememberMe}
                  onChange={(e) => setDraft({ ...draft, showRememberMe: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 cursor-pointer">
                <div>
                  <div className="font-bold text-[#172033]">Self-Service Password Reset</div>
                  <div className="text-[11px] text-[#5B6475]">Show Forgot / Reset Password flow on login</div>
                </div>
                <input
                  type="checkbox"
                  checked={draft.showForgotPassword}
                  onChange={(e) => setDraft({ ...draft, showForgotPassword: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* 3. Signup Form Builder */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1D4ED8]" />
                <h4 className="font-bold text-sm text-[#172033]">03. Member Signup Field Builder & Branches</h4>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-[#172033] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.allowSelfRegistration}
                  onChange={(e) => setDraft({ ...draft, allowSelfRegistration: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <span>Public Signup Enabled</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Signup Heading</label>
                <input
                  type="text"
                  value={draft.signupHeading}
                  onChange={(e) => setDraft({ ...draft, signupHeading: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Signup Subtitle</label>
                <input
                  type="text"
                  value={draft.signupSubtext}
                  onChange={(e) => setDraft({ ...draft, signupSubtext: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Available Gym Branches (comma-separated)</label>
                <input
                  type="text"
                  value={branchesText}
                  onChange={(e) => applyBranchesText(e.target.value)}
                  placeholder="Downtown Flagship, West End Wing, Madurai Central"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#5B6475] font-semibold mb-1">Default Assigned Branch</label>
                <select
                  value={draft.defaultBranch}
                  onChange={(e) => setDraft({ ...draft, defaultBranch: e.target.value })}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
                >
                  {draft.branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#5B6475]">Configure Fields Shown on Signup Form:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {(
                  [
                    { key: 'requireUsername', label: 'Preferred Username' },
                    { key: 'showBranchSelector', label: 'Branch Selector' },
                    { key: 'showPlanSelector', label: 'Starting Plan Dropdown' },
                    { key: 'showFitnessGoals', label: 'Fitness Goals Field' },
                    { key: 'requireDateOfBirth', label: 'Date of Birth (Required)' },
                    { key: 'showEmergencyContact', label: 'Emergency Contact Pair' },
                    { key: 'showReferralCode', label: 'Promo / Referral Code' }
                  ] as { key: keyof AuthPortalConfig['signupFields']; label: string }[]
                ).map((field) => {
                  const checked = draft.signupFields[field.key];
                  return (
                    <label
                      key={field.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        checked ? 'bg-blue-50/50 border-blue-200 text-[#172033]' : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#5B6475]'
                      }`}
                    >
                      <span className="font-semibold text-[11px]">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            signupFields: { ...draft.signupFields, [field.key]: e.target.checked }
                          })
                        }
                        className="w-4 h-4 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[#5B6475] font-semibold mb-1">Registration Terms & Conduct Policy Text</label>
              <input
                type="text"
                value={draft.termsText}
                onChange={(e) => setDraft({ ...draft, termsText: e.target.value })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#172033] focus:outline-none focus:border-[#1D4ED8]"
              />
            </div>
          </section>
        </div>

        {/* RIGHT: LIVE PORTAL PREVIEW */}
        <div className="xl:col-span-5 xl:sticky xl:top-24 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                <Eye className="w-4 h-4 text-[#1D4ED8]" />
                <span>Live Portal Preview</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewTab('login')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                    previewTab === 'login' ? 'bg-white text-[#172033] shadow-xs' : 'text-[#5B6475]'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('register')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                    previewTab === 'register' ? 'bg-white text-[#172033] shadow-xs' : 'text-[#5B6475]'
                  }`}
                >
                  Signup
                </button>
              </div>
            </div>

            {/* Scaled Live Preview Frame */}
            <div className="bg-[#080808] relative p-4 overflow-hidden">
              <img
                src={activeBgSrc}
                alt={draft.brandTitle}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale"
              />
              <div className="relative z-10 space-y-3">
                {/* Preview Hero Strip */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#C6FF00]">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-archivo-brand text-xs font-bold uppercase tracking-wider leading-none">
                        {draft.brandTitle || 'WFIT GYM'}
                      </div>
                      <div className="text-[8px] font-mono text-[#C6FF00] uppercase">{draft.brandSubtitle}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/60">
                    {draft.layoutMode === 'split-showcase' ? 'Split 2-Column' : 'Centered Single Card'}
                  </span>
                </div>

                {draft.layoutMode === 'split-showcase' && (
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-white space-y-1">
                    <div className="font-archivo-wide text-sm font-bold uppercase leading-tight">{draft.heroHeadline}</div>
                    <div className="text-[10px] text-white/70 line-clamp-2">{draft.heroDescription}</div>
                  </div>
                )}

                {draft.welcomeNoticeBanner.trim() && (
                  <div className="p-2 rounded-lg bg-white/95 text-[#172033] text-[10px] font-semibold flex items-center gap-1.5">
                    <Megaphone className="w-3 h-3 text-[#1D4ED8] shrink-0" />
                    <span className="truncate">{draft.welcomeNoticeBanner}</span>
                  </div>
                )}

                {/* White Auth Card Simulation */}
                <div className="bg-white rounded-xl p-4 text-[#172033] space-y-3 shadow-lg">
                  {previewTab === 'login' ? (
                    <>
                      <div>
                        <div className="font-bold text-sm">{draft.loginHeading}</div>
                        <div className="text-[10px] text-[#5B6475] mt-0.5">{draft.loginSubtext}</div>
                      </div>
                      {draft.enableMobileOtpLogin && (
                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg text-[10px] font-semibold text-center">
                          <div className="py-1 bg-white rounded shadow-xs text-[#172033]">Email / Password</div>
                          <div className="py-1 text-[#5B6475]">Mobile OTP</div>
                        </div>
                      )}
                      <div className="space-y-2 text-[10px]">
                        <div className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#70798A]">Email or Username</div>
                        <div className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[#70798A] flex justify-between">
                          <span>Password</span>
                          {draft.showForgotPassword && <span className="text-[#1D4ED8] font-semibold">Forgot?</span>}
                        </div>
                        {draft.showRememberMe && (
                          <div className="flex items-center gap-1.5 text-[#5B6475]">
                            <Check className="w-3 h-3 text-[#1D4ED8]" />
                            <span>Keep me signed in for 7 days</span>
                          </div>
                        )}
                      </div>
                      <div className={`w-full py-2 rounded-lg text-center text-[11px] font-bold ${activePresetStyle.previewBtnClass}`}>
                        Sign In to Portal →
                      </div>
                    </>
                  ) : !draft.allowSelfRegistration ? (
                    <div className="py-4 text-center space-y-1.5 text-[11px]">
                      <Shield className="w-6 h-6 text-[#B45309] mx-auto" />
                      <div className="font-bold text-[#172033]">Public Self-Registration Disabled</div>
                      <div className="text-[#5B6475]">Members must be registered at the club front desk.</div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-bold text-sm">{draft.signupHeading}</div>
                        <div className="text-[10px] text-[#5B6475] mt-0.5">{draft.signupSubtext}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#5B6475]">
                        <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Full Name *</div>
                        <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Mobile *</div>
                        <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Email *</div>
                        {draft.signupFields.requireUsername && <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Username</div>}
                        {draft.signupFields.showBranchSelector && <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Branch ({draft.defaultBranch})</div>}
                        {draft.signupFields.showPlanSelector && <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Plan ({plans.length})</div>}
                        {draft.signupFields.requireDateOfBirth && <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Date of Birth *</div>}
                        {draft.signupFields.showReferralCode && <div className="px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Referral Code</div>}
                        {draft.signupFields.showEmergencyContact && <div className="col-span-2 px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Emergency Contact Name & Phone</div>}
                        {draft.signupFields.showFitnessGoals && <div className="col-span-2 px-2 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]">Fitness Goals</div>}
                      </div>
                      <div className="text-[9.5px] text-[#5B6475] border-t border-[#E2E8F0] pt-2">
                        ☑ {draft.termsText}
                      </div>
                      <div className={`w-full py-2 rounded-lg text-center text-[11px] font-bold ${activePresetStyle.previewBtnClass}`}>
                        Register & Enter Portal
                      </div>
                    </>
                  )}
                </div>

                {draft.showDemoRoleAccess && (
                  <div className="px-3 py-2 rounded-lg bg-white/90 text-[#172033] text-[10px] font-semibold flex items-center justify-between">
                    <span>Quick Demo Role Access Card</span>
                    <span className="font-mono text-[#15803D]">Visible</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
