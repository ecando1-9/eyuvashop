'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Package, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const supabase = createClient();

  const passwordStrength = password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please agree to the terms'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      if (data.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
        });
        toast.success('Account created! Please check your email to verify.', { duration: 5000 });
        router.push('/login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-gray-900">
              e<span className="text-orange-500">Yuva</span>Shop
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Create Account</h1>
          <p className="text-sm text-gray-500 mb-8">Join millions of happy shoppers</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Yuva"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Kumar"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {['weak', 'medium', 'strong'].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i === 0 ? password.length >= 1 ? passwordStrength === 'weak' ? 'bg-red-400' : 'bg-green-400' : 'bg-gray-200'
                          : i === 1 ? password.length >= 6 ? passwordStrength !== 'weak' ? 'bg-green-400' : 'bg-gray-200' : 'bg-gray-200'
                          : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                    {passwordStrength === 'strong' ? '✓ Strong password' : passwordStrength === 'medium' ? 'Medium strength' : 'Weak password'}
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-orange-500"
              />
              <span className="text-xs text-gray-500">
                I agree to the{' '}
                <Link href="/terms" className="text-orange-500 font-medium hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-orange-500 font-medium hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !agreed}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.01] shadow-md shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Benefits */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-medium">Why join eYuvaShop?</p>
            <div className="space-y-2">
              {[
                'Exclusive member-only deals',
                'Easy order tracking & returns',
                'Save wishlist & delivery addresses',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-green-600" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
