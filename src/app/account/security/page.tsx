'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  KeyRound,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface FeedbackState {
  type: 'success' | 'error' | null;
  message: string;
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="text-[#FF6B00]">{icon}</span>
        <h2 className="font-semibold text-gray-800 text-base">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

function Feedback({ state }: { state: FeedbackState }) {
  if (!state.type) return null;
  const isSuccess = state.type === 'success';
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm mt-3 ${
        isSuccess
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      )}
      <span>{state.message}</span>
    </div>
  );
}

// ─── PasswordInput ────────────────────────────────────────────────────────────

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Password state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>({
    type: null,
    message: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email state
  const [emailFeedback, setEmailFeedback] = useState<FeedbackState>({
    type: null,
    message: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);

  // Sign-out state
  const [signOutLoading, setSignOutLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback({ type: null, message: '' });
    const { next, confirm } = passwordForm;

    if (!next || !confirm) {
      setPasswordFeedback({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }
    if (next.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (next !== confirm) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setPasswordLoading(false);

    if (error) {
      setPasswordFeedback({ type: 'error', message: error.message });
    } else {
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully!' });
      setPasswordForm({ current: '', next: '', confirm: '' });
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setEmailFeedback({ type: null, message: '' });
    setEmailLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
    setEmailLoading(false);

    if (error) {
      setEmailFeedback({ type: 'error', message: error.message });
    } else {
      setEmailFeedback({
        type: 'success',
        message: `Verification email sent to ${user.email}. Please check your inbox.`,
      });
    }
  };

  const handleSignOutAllDevices = async () => {
    setSignOutLoading(true);
    await supabase.auth.signOut({ scope: 'global' });
    setSignOutLoading(false);
    await signOut();
    router.push('/login');
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="h-14 bg-gray-100" />
            <div className="px-6 py-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isEmailVerified = !!user?.email_confirmed_at;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Security</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your password, email verification, and security settings.
        </p>
      </div>

      {/* ── 1. Change Password ─────────────────────────────────────────────── */}
      <SectionCard title="Change Password" icon={<KeyRound size={18} />}>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <PasswordInput
            id="current-password"
            label="Current Password"
            value={passwordForm.current}
            onChange={(v) => setPasswordForm((f) => ({ ...f, current: v }))}
            placeholder="Enter current password"
          />
          <PasswordInput
            id="new-password"
            label="New Password"
            value={passwordForm.next}
            onChange={(v) => setPasswordForm((f) => ({ ...f, next: v }))}
            placeholder="Minimum 8 characters"
          />
          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            value={passwordForm.confirm}
            onChange={(v) => setPasswordForm((f) => ({ ...f, confirm: v }))}
            placeholder="Re-enter new password"
          />
          <Feedback state={passwordFeedback} />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 px-5 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50"
            >
              {passwordLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── 2. Email ──────────────────────────────────────────────────────── */}
      <SectionCard title="Email Address" icon={<Mail size={18} />}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Current email</p>
            <p className="font-medium text-gray-800 text-sm">{user?.email ?? '-'}</p>
            <div className="mt-2">
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                  <ShieldCheck size={12} />
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
                  <ShieldAlert size={12} />
                  Not Verified
                </span>
              )}
            </div>
          </div>
          {!isEmailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={emailLoading}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg border border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white disabled:opacity-60 px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            >
              {emailLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current/40 border-t-current animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={14} />
                  Verify Email
                </>
              )}
            </button>
          )}
        </div>
        <Feedback state={emailFeedback} />
      </SectionCard>

      {/* ── 3. Login Activity ─────────────────────────────────────────────── */}
      <SectionCard title="Login Activity" icon={<Activity size={18} />}>
        <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3.5">
          <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            Login activity tracking will be available soon. You will be able to review recent
            sign-ins and device history from this section.
          </p>
        </div>
      </SectionCard>

      {/* ── 4. Active Sessions ────────────────────────────────────────────── */}
      <SectionCard title="Active Sessions" icon={<LogOut size={18} />}>
        <p className="text-sm text-gray-500 mb-4">
          Signing out of all devices will end every active session, including this one, and redirect
          you to the login page.
        </p>
        <button
          onClick={handleSignOutAllDevices}
          disabled={signOutLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 disabled:opacity-60 px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          {signOutLoading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut size={14} />
              Sign Out of All Devices
            </>
          )}
        </button>
      </SectionCard>

      {/* ── 5. Two-Factor Authentication ──────────────────────────────────── */}
      <SectionCard title="Two-Factor Authentication" icon={<Shield size={18} />}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10">
            <Shield size={22} className="text-[#FF6B00]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-800 text-sm">Two-Factor Authentication</p>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Add an extra layer of protection to your account with authenticator apps or SMS
              verification.
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
        </div>
      </SectionCard>

      {/* ── 6. Security Tips ──────────────────────────────────────────────── */}
      <SectionCard title="Security Tips" icon={<Lightbulb size={18} />}>
        <ul className="space-y-3">
          {[
            {
              tip: "Use a strong, unique password that you don't reuse on other sites.",
              icon: <KeyRound size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />,
            },
            {
              tip: 'Never share your password or one-time codes with anyone, including support staff.',
              icon: <ShieldAlert size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />,
            },
            {
              tip: 'Keep your email address up to date so you can always recover your account.',
              icon: <Mail size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />,
            },
            {
              tip: 'Sign out of all devices if you ever suspect your account has been compromised.',
              icon: <LogOut size={14} className="text-[#FF6B00] shrink-0 mt-0.5" />,
            },
          ].map(({ tip, icon }, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {icon}
              <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
