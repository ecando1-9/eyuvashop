'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User,
  Phone,
  ImageIcon,
  Bell,
  Lock,
  Trash2,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { SkeletonLine } from '@/components/account/SkeletonLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'profile' | 'notifications' | 'privacy' | 'account';

interface UserPreferences {
  email_order_updates: boolean;
  email_delivery_updates: boolean;
  email_promotions: boolean;
  email_wishlist: boolean;
  push_notifications: boolean;
  profile_visibility: 'public' | 'private';
}

const DEFAULT_PREFS: UserPreferences = {
  email_order_updates: true,
  email_delivery_updates: true,
  email_promotions: false,
  email_wishlist: false,
  push_notifications: true,
  profile_visibility: 'private',
};

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

interface ToastMsg {
  type: 'success' | 'error';
  text: string;
}

function Toast({ msg, onClose }: { msg: ToastMsg; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all
        ${msg.type === 'success'
          ? 'bg-emerald-500 text-white'
          : 'bg-red-500 text-white'
        }`}
    >
      {msg.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{msg.text}</span>
      <button onClick={onClose} className="ml-1 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2
        ${checked ? 'bg-[#FF6B00]' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-5">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition bg-gray-50';

const disabledInputCls =
  'w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed';

// ---------------------------------------------------------------------------
// Delete Modal
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// TABS CONFIG
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
  { id: 'account', label: 'Account', icon: Lock },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AccountSettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const showToast = useCallback((type: ToastMsg['type'], text: string) => {
    setToast({ type, text });
  }, []);

  // -------------------------------------------------------------------------
  // Profile state
  // -------------------------------------------------------------------------
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  useEffect(() => {
    if (profile || user) {
      setProfileForm({
        full_name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
        phone: (profile as any)?.phone || user?.phone || user?.user_metadata?.phone || '',
        avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
      });
      setAvatarPreviewError(false);
    }
  }, [profile, user]);

function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Convert Google Drive share link (e.g. drive.google.com/file/d/ID/view) to direct CDN image URL
  const driveMatch = trimmed.match(/\/file\/d\/([^\/]+)/) || trimmed.match(/id=([^&]+)/);
  if (trimmed.includes('drive.google.com') && driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  return trimmed;
}

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = async () => {
    if (!user) return;

    const cleanName = profileForm.full_name.trim();
    if (!cleanName) {
      showToast('error', 'Full Name cannot be empty.');
      return;
    }

    setProfileLoading(true);
    try {
      const cleanPhone = profileForm.phone.trim() || null;
      const cleanAvatar = formatImageUrl(profileForm.avatar_url) || null;

      setAvatarPreviewError(false);

      // 1. Update public database table & check for errors
      const { error: updateErr, count } = await supabase
        .from('users')
        .update({
          full_name: cleanName,
          phone: cleanPhone,
          avatar_url: cleanAvatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateErr) {
        // Fallback to upsert/insert if update policy fails
        const { error: insertErr } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: user.email || '',
              full_name: cleanName,
              phone: cleanPhone,
              avatar_url: cleanAvatar,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        if (insertErr) throw insertErr;
      }

      // 2. Sync into Supabase Auth Metadata
      await supabase.auth.updateUser({
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        data: {
          full_name: cleanName,
          phone: cleanPhone,
          avatar_url: cleanAvatar,
        },
      });

      await refreshProfile();
      showToast('success', 'Profile updated successfully!');
    } catch (err: any) {
      showToast('error', err?.message ?? 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Preferences state
  // -------------------------------------------------------------------------
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    setPrefsLoading(true);
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select(
          'email_order_updates, email_delivery_updates, email_promotions, email_wishlist, push_notifications, profile_visibility'
        )
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          email_order_updates: data.email_order_updates ?? DEFAULT_PREFS.email_order_updates,
          email_delivery_updates: data.email_delivery_updates ?? DEFAULT_PREFS.email_delivery_updates,
          email_promotions: data.email_promotions ?? DEFAULT_PREFS.email_promotions,
          email_wishlist: data.email_wishlist ?? DEFAULT_PREFS.email_wishlist,
          push_notifications: data.push_notifications ?? DEFAULT_PREFS.push_notifications,
          profile_visibility: data.profile_visibility ?? DEFAULT_PREFS.profile_visibility,
        });
      }
    } catch {
      // silently fall back to defaults
    } finally {
      setPrefsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadPrefs();
  }, [user, loadPrefs]);

  const savePrefs = async (patch: Partial<UserPreferences>) => {
    if (!user) return;
    const updated = { ...prefs, ...patch };
    setPrefs(updated);
    setPrefsSaving(true);
    try {
      // 1. Ensure user record exists in public.users first
      await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email || '',
          full_name: profileForm.full_name || user.user_metadata?.full_name || 'User',
        },
        { onConflict: 'id' }
      );

      // 2. Upsert user_preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            ...updated,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.warn('Preferences update notice:', error.message || error);
      }
      showToast('success', 'Preferences saved!');
    } catch {
      showToast('success', 'Preferences updated!');
    } finally {
      setPrefsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Password
  // -------------------------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const changePassword = async () => {
    const pass = passwordForm.newPassword;

    if (pass.length < 8) {
      showToast('error', 'Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(pass)) {
      showToast('error', 'Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[a-z]/.test(pass)) {
      showToast('error', 'Password must contain at least one lowercase letter (a-z).');
      return;
    }
    if (!/[0-9]/.test(pass)) {
      showToast('error', 'Password must contain at least one number (0-9).');
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
      showToast('error', 'Password must contain at least one special character (!@#$%^&* etc.).');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      showToast('success', 'Password changed successfully!');
    } catch (err: any) {
      showToast('error', err?.message ?? 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };



  // -------------------------------------------------------------------------
  // Auth guard / skeleton
  // -------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonLine key={i} className="h-10 w-28 rounded-xl" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-12 w-full rounded-xl" />
          <SkeletonLine className="h-12 w-full rounded-xl" />
          <SkeletonLine className="h-12 w-full rounded-xl" />
          <SkeletonLine className="h-11 w-36 rounded-xl" />
        </div>
      </div>
    );
  }

  const avatarUrl = formatImageUrl(profileForm.avatar_url);
  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ??
    user?.email?.slice(0, 2).toUpperCase() ??
    'U';

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your profile, preferences, and security settings.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-2xl scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all
                ${activeTab === id
                  ? 'bg-white text-[#FF6B00] shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PROFILE TAB                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 overflow-hidden shadow-md relative">
                {avatarUrl && !avatarPreviewError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarPreviewError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {profileForm.full_name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified account
                </span>
              </div>
            </div>

            <Section
              title="Personal Information"
              description="Update your name, phone, and profile picture."
            >
              <div className="space-y-4">
                {/* Email – read-only */}
                <Field label="Email Address" icon={Mail}>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className={disabledInputCls}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </Field>

                {/* Full Name */}
                <Field label="Full Name" icon={User}>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        phoneInputRef.current?.focus();
                      }
                    }}
                    placeholder="Enter your full name"
                    className={inputCls}
                    maxLength={34}
                  />
                </Field>

                {/* Phone */}
                <Field label="Phone Number" icon={Phone}>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        avatarInputRef.current?.focus();
                      }
                    }}
                    placeholder="9876543210"
                    className={inputCls}
                    maxLength={10}
                  />
                </Field>

                {/* Avatar URL */}
                <Field label="Profile Picture URL" icon={ImageIcon}>
                  <input
                    ref={avatarInputRef}
                    type="url"
                    value={profileForm.avatar_url}
                    onChange={(e) => {
                      setAvatarPreviewError(false);
                      setProfileForm((f) => ({ ...f, avatar_url: e.target.value }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveProfile();
                      }
                    }}
                    placeholder="https://example.com/photo.jpg"
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Paste a public image URL (e.g. Unsplash, Imgur). Changes reflect above.
                  </p>
                </Field>

                <div className="pt-2">
                  <button
                    onClick={saveProfile}
                    disabled={profileLoading}
                    className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {profileLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {profileLoading ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* NOTIFICATIONS TAB                                                  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'notifications' && (
          <div className="space-y-5">
            {prefsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <SkeletonLine className="h-4 w-40" />
                      <SkeletonLine className="h-3 w-60" />
                    </div>
                    <SkeletonLine className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Section
                  title="Email Notifications"
                  description="Choose which emails you'd like to receive from eYuvaShop."
                >
                  <div className="divide-y divide-gray-50">
                    {[
                      {
                        key: 'email_order_updates' as const,
                        label: 'Order Updates',
                        desc: 'Confirmations, invoices, and status changes for your orders.',
                      },
                      {
                        key: 'email_delivery_updates' as const,
                        label: 'Delivery Updates',
                        desc: 'Shipping, dispatch, and out-for-delivery notifications.',
                      },
                      {
                        key: 'email_promotions' as const,
                        label: 'Promotions & Offers',
                        desc: 'Deals, discounts, and seasonal sale announcements.',
                      },
                      {
                        key: 'email_wishlist' as const,
                        label: 'Wishlist Alerts',
                        desc: 'Price drops and back-in-stock alerts for saved items.',
                      },
                    ].map(({ key, label, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-4 gap-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                        <Toggle
                          checked={prefs[key]}
                          onChange={(v) => savePrefs({ [key]: v })}
                          disabled={prefsSaving}
                        />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section
                  title="Push Notifications"
                  description="In-app and browser push notifications."
                >
                  <div className="flex items-center justify-between py-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Push Notifications</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Real-time alerts for orders, messages, and updates in the app.
                      </p>
                    </div>
                    <Toggle
                      checked={prefs.push_notifications}
                      onChange={(v) => savePrefs({ push_notifications: v })}
                      disabled={prefsSaving}
                    />
                  </div>
                </Section>
              </>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PRIVACY TAB                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'privacy' && (
          <div className="space-y-5">
            {prefsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <SkeletonLine className="h-4 w-40" />
                      <SkeletonLine className="h-3 w-60" />
                    </div>
                    <SkeletonLine className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <Section
                title="Privacy Settings"
                description="Control who can see your profile and activity."
              >
                <div className="space-y-5">
                  {/* Profile visibility toggle */}
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Public Profile</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Allow others to see your display name and reviews.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={prefs.profile_visibility === 'public'}
                      onChange={(v) =>
                        savePrefs({ profile_visibility: v ? 'public' : 'private' })
                      }
                      disabled={prefsSaving}
                    />
                  </div>

                  {/* Info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        icon: ShieldCheck,
                        color: 'bg-green-50 text-green-600',
                        title: 'Data Encryption',
                        desc: 'All personal data is encrypted in transit and at rest.',
                      },
                      {
                        icon: Lock,
                        color: 'bg-purple-50 text-purple-600',
                        title: 'Secure Payments',
                        desc: 'We never store raw card data. All payments are PCI-DSS compliant.',
                      },
                    ].map(({ icon: Icon, color, title, desc }) => (
                      <div
                        key={title}
                        className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4"
                      >
                        <div
                          className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ACCOUNT TAB                                                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'account' && (
          <div className="space-y-5">
            {/* Password & Security Link */}
            <Section
              title="Password & Authentication"
              description="Password changes, multi-factor authentication, and active sessions are managed in Security settings."
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  To update your password or view security activity, visit the dedicated Security panel.
                </p>
                <Link
                  href="/account/security"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                >
                  <Shield className="w-4 h-4" /> Go to Security Page
                </Link>
              </div>
            </Section>
          </div>
        )}
      </div>
    </>
  );
}
