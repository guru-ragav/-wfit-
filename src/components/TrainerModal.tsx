import React, { useState } from 'react';
import { TrainerProfile } from '../types';
import { X, UserPlus, AlertCircle, Sparkles, Check } from 'lucide-react';
import { GYM_IMAGES } from '../assets/images';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrainer: (trainer: TrainerProfile, createAccount: boolean, initialPassword?: string) => void;
  existingTrainers: TrainerProfile[];
}

const PRESET_PHOTOS = [
  { label: 'Gym Turf Coach', url: GYM_IMAGES.coachingFeature },
  { label: 'Athletic Coach', url: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&auto=format&fit=crop&q=80' },
  { label: 'Mobility Specialist', url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&auto=format&fit=crop&q=80' },
  { label: 'Conditioning Coach', url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=80' },
  { label: 'Strength Specialist', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { label: 'Performance Coach', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' }
];

const SPECIALISATION_CHIPS = [
  'Strength & Conditioning',
  'Olympic Weightlifting',
  'Functional Mobility & Rehab',
  'Hypertrophy & Bodybuilding',
  'Cardio & Boxing Conditioning',
  'Powerlifting & Biomechanics'
];

const CERTIFICATION_CHIPS = [
  'CSCS (NSCA)',
  'NASM-CPT',
  'ACE-CPT',
  'USA Weightlifting L2',
  'Precision Nutrition L1',
  'FRC Mobility Specialist',
  'ISSA Master Trainer',
  'CrossFit L2'
];

export const TrainerModal: React.FC<TrainerModalProps> = ({
  isOpen,
  onClose,
  onSaveTrainer,
  existingTrainers
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98');
  const [specialisation, setSpecialisation] = useState('Strength & Conditioning');
  const [branch, setBranch] = useState('Downtown Flagship');
  const [workingHours, setWorkingHours] = useState('06:00 - 14:00 (Mon - Fri)');
  const [experienceYears, setExperienceYears] = useState(4);
  const [certifications, setCertifications] = useState<string[]>(['CSCS (NSCA)', 'Precision Nutrition L1']);
  const [customCert, setCustomCert] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState(PRESET_PHOTOS[0].url);
  const [createAccount, setCreateAccount] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCertification = (cert: string) => {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const addCustomCert = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customCert.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications(prev => [...prev, trimmed]);
      setCustomCert('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter the trainer’s full legal or professional name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please provide a valid email address for trainer communication and account access.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please provide a valid mobile or contact number.');
      return;
    }

    const duplicateEmail = existingTrainers.some(
      t => t.email.toLowerCase() === cleanEmail
    );
    if (duplicateEmail) {
      setErrorMessage(`A trainer with email address "${cleanEmail}" already exists in the roster.`);
      return;
    }

    const namePrefix = cleanName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'COACH';
    const trainerId = `TR-${namePrefix}-${Date.now().toString().slice(-4)}`;

    const newTrainer: TrainerProfile = {
      id: trainerId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      photoUrl: photoUrl.trim() || PRESET_PHOTOS[0].url,
      specialisation: specialisation.trim() || 'Strength & Conditioning',
      branch,
      workingHours,
      experienceYears: Number(experienceYears) || 1,
      certifications: certifications.length > 0 ? certifications : ['Certified Fitness Trainer'],
      bio: bio.trim() || `Experienced coach at WFIT Gym specializing in ${specialisation}. Dedicated to client results and biomechanical integrity.`,
      assignedMemberIds: []
    };

    onSaveTrainer(newTrainer, createAccount, 'Trainer@WFIT2026!');
    setName('');
    setEmail('');
    setPhone('+91 98');
    setBio('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-2xl text-[#172033] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1D4ED8] shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-[#172033]">
                Add New Trainer to Roster
              </h3>
              <p className="text-xs text-[#5B6475]">
                Admin credentialed action • Assign client workouts and branch shifts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#70798A] hover:text-[#172033] hover:bg-slate-100 transition-colors p-1.5 rounded-lg cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-[#B91C1C]">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Validation Notice</strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Photo & Preset Selector */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
            <span className="text-xs font-bold text-[#172033] block">
              Trainer Photo & Avatar
            </span>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-200 bg-slate-200 shrink-0 shadow-sm">
                <img src={photoUrl} alt="Trainer preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  {PRESET_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(preset.url)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                        photoUrl === preset.url
                          ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs'
                          : 'bg-white text-[#5B6475] border-[#E2E8F0] hover:text-[#172033] hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter custom image URL..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>
          </div>

          {/* Primary Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. rahul.sharma@wfitgym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Coaching Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              />
            </div>
          </div>

          {/* Specialisation & Chips */}
          <div className="space-y-2">
            <label className="block text-xs text-[#172033] font-semibold">
              Primary Coaching Specialisation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Olympic Weightlifting, Hypertrophy & Powerlifting"
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SPECIALISATION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSpecialisation(chip)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border cursor-pointer ${
                    specialisation === chip
                      ? 'bg-blue-100 text-[#1D4ED8] border-blue-300'
                      : 'bg-[#F8FAFC] text-[#5B6475] border-[#E2E8F0] hover:bg-slate-100'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Branch & Shift Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Assigned Branch Location
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              >
                <option value="Downtown Flagship">Downtown Flagship</option>
                <option value="West End Wing">West End Wing</option>
                <option value="North Studio">North Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#172033] font-semibold mb-1">
                Working Shift / Hours
              </label>
              <select
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-[#172033] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              >
                <option value="06:00 - 14:00 (Mon - Fri)">Morning Shift: 06:00 - 14:00 (Mon - Fri)</option>
                <option value="14:00 - 22:00 (Mon - Fri)">Evening Shift: 14:00 - 22:00 (Mon - Fri)</option>
                <option value="07:00 - 15:00 (Tue - Sat)">Weekend Shift: 07:00 - 15:00 (Tue - Sat)</option>
                <option value="09:00 - 18:00 (Mon - Fri)">General Shift: 09:00 - 18:00 (Mon - Fri)</option>
              </select>
            </div>
          </div>

          {/* Professional Certifications */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs text-[#172033] font-semibold">
                Certifications & Accreditations
              </label>
              <span className="text-[11px] text-[#70798A]">Click to toggle or add new</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CERTIFICATION_CHIPS.map((cert) => {
                const active = certifications.includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleCertification(cert)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-emerald-50 text-[#15803D] border-emerald-300 shadow-xs'
                        : 'bg-white text-[#5B6475] border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    {active && <Check className="w-3 h-3" />}
                    <span>{cert}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add other certification (e.g. EXOS, Kettlebell L1)..."
                value={customCert}
                onChange={(e) => setCustomCert(e.target.value)}
                onKeyDown={addCustomCert}
                className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8]"
              />
              <button
                type="button"
                onClick={addCustomCert}
                className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#172033] transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Coach Bio */}
          <div>
            <label className="block text-xs text-[#172033] font-semibold mb-1">
              Coaching Bio & Philosophy
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of coaching methodology, athletic background, or training philosophy..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#172033] placeholder-[#70798A] focus:outline-none focus:border-[#1D4ED8] shadow-xs"
            />
          </div>

          {/* Role Switcher Profile Provisioning Toggle */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>Add Coach Persona to Role Switcher</span>
                </div>
                <div className="text-[11px] text-[#5B6475] leading-relaxed">
                  Provisions a TRAINER role profile so you can immediately switch into this coach's workspace using the top Role Switcher.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1D4ED8]" />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B6475] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Trainer into Roster</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
