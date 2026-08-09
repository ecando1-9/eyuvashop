'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User, Store, UserPlus, LogIn, AlertCircle, Loader2, Phone, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const tabParam = searchParams.get('tab');
  const modeParam = searchParams.get('mode');

  const isMerchantRedirect = redirectPath.startsWith('/merchant') || tabParam === 'merchant';
  const isRegisterParam = modeParam === 'register' || isMerchantRedirect;

  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>(isMerchantRedirect ? 'merchant' : 'customer');
  const [isRegister, setIsRegister] = useState(isRegisterParam);

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Google authentication.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        const role = activeTab === 'merchant' ? 'merchant' : 'customer';
        const metaName = activeTab === 'merchant' ? businessName : fullName;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          phone: phone ? phone : undefined,
          options: {
            data: {
              full_name: metaName,
              business_name: activeTab === 'merchant' ? businessName : undefined,
              role: role,
              phone: phone ? phone : undefined,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(role === 'merchant' ? '/merchant' : redirectPath);
        } else {
          setErrorMsg('Registration successful! Please check your email for confirmation.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'merchant') {
            router.push('/merchant');
          } else if (profile?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push(redirectPath);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10 space-y-6">
      {/* Portal Selector */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab('customer');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'customer' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 text-[#FF6B00]" /> Customer Portal
        </button>
        <button
          onClick={() => {
            setActiveTab('merchant');
            setErrorMsg(null);
          }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'merchant' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Store className="w-4 h-4 text-[#FF6B00]" /> Merchant Portal
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-orange-50/60 rounded-xl border border-orange-100">
        <button
          type="button"
          onClick={() => {
            setIsRegister(false);
            setErrorMsg(null);
          }}
          className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            !isRegister ? 'bg-[#FF6B00] text-white shadow-md' : 'text-[#1E293B] hover:bg-white/50'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" /> Sign In (Login)
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegister(true);
            setErrorMsg(null);
          }}
          className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isRegister ? 'bg-[#FF6B00] text-white shadow-md' : 'text-[#1E293B] hover:bg-white/50'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Create Account
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Google Auth Button */}
      {activeTab === 'customer' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-[#1E293B] border border-gray-200 font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-2 text-gray-400 font-semibold">Or use email credentials</span>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form className="space-y-4" onSubmit={handleEmailAuth}>
        {isRegister && (
          <>
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                {activeTab === 'merchant' ? 'Business / Merchant Name' : 'Full Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={activeTab === 'merchant' ? businessName : fullName}
                  onChange={(e) =>
                    activeTab === 'merchant' ? setBusinessName(e.target.value) : setFullName(e.target.value)
                  }
                  placeholder={activeTab === 'merchant' ? 'e.g. Apex Retailers' : 'John Doe'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1">
                Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  pattern="^[0-9\+\-\s\(\)]{10,15}$"
                  title="Please enter a valid phone number (10-15 digits)"
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
                />
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-[#1E293B] mb-1">
            {activeTab === 'merchant' ? 'Merchant Business Email' : 'Email Address'}
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
            />
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1E293B] mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
            />
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isRegister && (
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-gray-600 font-medium">
              <input type="checkbox" className="rounded text-[#FF6B00] focus:ring-[#FF6B00] mr-2" />
              Remember me
            </label>
            <a href="#" className="font-extrabold text-[#FF6B00] hover:underline">Forgot password?</a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRegister ? (
            activeTab === 'merchant' ? 'Register Merchant Store' : 'Create Customer Account'
          ) : activeTab === 'merchant' ? (
            'Sign In to Seller Hub'
          ) : (
            'Sign In to eYuvaShop'
          )}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Top Back Link */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#FF6B00] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>

      <Link href="/" className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 group block">
        <div className="relative w-16 h-16 rounded-2xl mx-auto overflow-hidden shadow-md border border-gray-100 bg-white group-hover:scale-105 transition-transform">
          <Image
            src="https://res.cloudinary.com/dw9oeeyt3/image/upload/v1785690896/Thank_you_sticker_design_with_branding_xgab7m.png"
            alt="eYuvaShop Logo"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
        <h2 className="text-3xl font-black tracking-tight italic">
          <span className="text-[#FF6B00] not-italic">e</span>
          <span className="text-[#1E293B]">YuvaShop</span>
        </h2>
        <p className="text-xs text-gray-500 font-medium">Fashion & Lifestyle Multi-Vendor Platform</p>
      </Link>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={
          <div className="bg-white py-8 px-4 shadow-xl border border-gray-100 sm:rounded-3xl sm:px-10 text-center text-xs font-semibold text-gray-400">
            Loading authentication portal...
          </div>
        }>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
