'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, Home, Briefcase, MoreVertical, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonCard } from '@/components/account/SkeletonLoader';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  area?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
  created_at: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

interface AddressFormData {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  postal_code: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
}

const EMPTY_FORM: AddressFormData = {
  full_name: '', phone: '', address_line1: '', address_line2: '',
  area: '', landmark: '', city: '', state: '', postal_code: '',
  address_type: 'home', is_default: false,
};

function AddressTypeIcon({ type }: { type: string }) {
  if (type === 'home') return <Home className="w-4 h-4" />;
  if (type === 'work') return <Briefcase className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressLine1Ref = useRef<HTMLInputElement>(null);
  const addressLine2Ref = useRef<HTMLInputElement>(null);
  const areaInputRef = useRef<HTMLInputElement>(null);
  const landmarkInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Instant Offline Indian Postal Zone Map (0ms latency fallback)
  const getOfflineStateFromPin = (pin: string): string | null => {
    const prefix2 = pin.slice(0, 2);
    if (['50', '51', '52', '53'].includes(prefix2)) return pin.startsWith('50') ? 'Telangana' : 'Andhra Pradesh';
    if (['56', '57', '58', '59'].includes(prefix2)) return 'Karnataka';
    if (['40', '41', '42', '43', '44'].includes(prefix2)) return 'Maharashtra';
    if (['11'].includes(prefix2)) return 'Delhi';
    if (['60', '61', '62', '63', '64'].includes(prefix2)) return 'Tamil Nadu';
    if (['70', '71', '72', '73'].includes(prefix2)) return 'West Bengal';
    if (['38', '39'].includes(prefix2)) return 'Gujarat';
    if (['30', '31', '32', '33', '34'].includes(prefix2)) return 'Rajasthan';
    if (['20', '21', '22', '23', '24', '25', '26', '27', '28'].includes(prefix2)) return 'Uttar Pradesh';
    if (['14', '15', '16'].includes(prefix2)) return 'Punjab';
    if (['12', '13'].includes(prefix2)) return 'Haryana';
    if (['67', '68', '69'].includes(prefix2)) return 'Kerala';
    if (['80', '81', '82', '83', '84', '85'].includes(prefix2)) return 'Bihar';
    if (['75', '76', '77'].includes(prefix2)) return 'Odisha';
    if (['45', '46', '47', '48'].includes(prefix2)) return 'Madhya Pradesh';
    if (['78', '79'].includes(prefix2)) return 'Assam';
    return null;
  };

  // Instant Offline City Map for popular postal hubs
  const getOfflineCityFromPin = (pin: string): string | null => {
    if (pin.startsWith('500') || pin.startsWith('501')) return 'Hyderabad';
    if (pin.startsWith('530')) return 'Visakhapatnam';
    if (pin.startsWith('520')) return 'Vijayawada';
    if (pin.startsWith('560') || pin.startsWith('561') || pin.startsWith('562')) return 'Bengaluru';
    if (pin.startsWith('400') || pin.startsWith('401')) return 'Mumbai';
    if (pin.startsWith('411')) return 'Pune';
    if (pin.startsWith('110')) return 'New Delhi';
    if (pin.startsWith('600')) return 'Chennai';
    if (pin.startsWith('700')) return 'Kolkata';
    if (pin.startsWith('380')) return 'Ahmedabad';
    if (pin.startsWith('302')) return 'Jaipur';
    if (pin.startsWith('201')) return 'Noida';
    if (pin.startsWith('122')) return 'Gurugram';
    if (pin.startsWith('160')) return 'Chandigarh';
    return null;
  };

  const handlePinCodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, '').slice(0, 6);
    f('postal_code', cleanPin);

    // Instant 0ms state & city pre-population based on postal zone
    const instantState = getOfflineStateFromPin(cleanPin);
    if (instantState) f('state', instantState);

    const instantCity = getOfflineCityFromPin(cleanPin);
    if (instantCity) f('city', instantCity);

    if (cleanPin.length === 6) {
      setPincodeLoading(true);

      // Fast CDN API (zippopotam.us)
      const fetchZippo = async () => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1200);
        try {
          const res = await fetch(`https://api.zippopotam.us/IN/${cleanPin}`, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.places?.[0]) {
            const place = data.places[0];
            const cityVal = place['place name'] !== 'NA' ? place['place name'] : null;
            return { city: cityVal, state: place['state'] };
          }
        } catch {
          // ignore timeout
        }
        return null;
      };

      // Government API with robust District/Block/Name extraction
      const fetchGov = async () => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 1500);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
            const po = data[0].PostOffice[0];
            const cityVal = po.District && po.District !== 'NA' 
              ? po.District 
              : (po.Block && po.Block !== 'NA' ? po.Block : po.Name);
            return { city: cityVal, state: po.State };
          }
        } catch {
          // ignore timeout
        }
        return null;
      };

      try {
        const result = await fetchGov() || await fetchZippo();

        if (result) {
          if (result.city && result.city !== 'NA') f('city', result.city);
          if (result.state) {
            const matchedState = INDIAN_STATES.find(
              (s) => s.toLowerCase() === result.state.toLowerCase()
            );
            if (matchedState) f('state', matchedState);
          }
        }
      } catch {
        // Graceful fallback to offline map
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Addresses fetch notice:', fetchError.message || fetchError);
        setAddresses([]);
        return;
      }
      setAddresses((data || []) as Address[]);
    } catch (err: any) {
      console.warn('Addresses load exception handled:', err?.message || err);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.full_name.trim()) errors.full_name = 'Name is required';
    
    const cleanPhone = form.phone.replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Enter valid 10-digit mobile number';
    }

    if (!form.address_line1.trim() || form.address_line1.trim().length < 5) {
      errors.address_line1 = 'Address Line 1 must be at least 5 characters';
    }
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state) errors.state = 'State is required';
    
    const cleanPin = form.postal_code.replace(/\D/g, '').slice(0, 6);
    if (!cleanPin || cleanPin.length !== 6) {
      errors.postal_code = 'PIN code must be exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormErrors({});
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      address_type: addr.address_type || 'home',
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setFormErrors({});
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      setError(null);

      // 1. Ensure user row exists in public.users to satisfy foreign key constraint
      const { error: uErr } = await supabase.from('users').update({
        full_name: form.full_name.trim() || user!.user_metadata?.full_name || 'User',
      }).eq('id', user!.id);

      if (uErr) {
        await supabase.from('users').upsert(
          {
            id: user!.id,
            email: user!.email || '',
            full_name: form.full_name.trim() || user!.user_metadata?.full_name || 'User',
          },
          { onConflict: 'id' }
        );
      }

      // 2. If setting as default, remove default from all others first
      if (form.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user!.id);
      }

      const payload = {
        user_id: user!.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        area: form.area.trim() || null,
        landmark: form.landmark.trim() || null,
        city: form.city.trim(),
        state: form.state,
        postal_code: form.postal_code.trim(),
        country: 'India',
        address_type: form.address_type || 'home',
        is_default: form.is_default,
      };

      let saveErr;
      if (editingId) {
        const { error: err } = await supabase.from('addresses').update(payload).eq('id', editingId).eq('user_id', user!.id);
        saveErr = err;
      } else {
        const { error: err } = await supabase.from('addresses').insert(payload);
        saveErr = err;
      }

      if (saveErr) throw saveErr;

      setShowForm(false);
      fetchAddresses();
    } catch (err: any) {
      setError(err?.message || 'Failed to save address. Please verify your details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await supabase.from('addresses').delete().eq('id', id).eq('user_id', user!.id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete address.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
      await supabase.from('addresses').update({ is_default: true }).eq('id', id).eq('user_id', user!.id);
      fetchAddresses();
    } catch {
      alert('Failed to set default address.');
    }
  };

  const f = (key: keyof AddressFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all ${
      formErrors[field] ? 'border-red-300' : 'border-gray-200'
    }`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Saved Addresses</h1>
          <p className="text-sm text-gray-400 mt-0.5">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Addresses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-40" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Add your delivery addresses so checkout is faster and easier."
            actionLabel="Add Address"
            onAction={openAddForm}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 relative transition-all ${
                addr.is_default ? 'border-[#FF6B00] shadow-orange-100' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Default Badge */}
              {addr.is_default && (
                <span className="absolute top-3 right-3 bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}

              {/* Type */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                  addr.address_type === 'home' ? 'bg-blue-50 text-blue-700' :
                  addr.address_type === 'work' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <AddressTypeIcon type={addr.address_type} />
                  <span className="capitalize">{addr.address_type}</span>
                </div>
              </div>

              {/* Address Content */}
              <div className="space-y-1">
                <p className="font-bold text-gray-900">{addr.full_name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {addr.address_line1}
                  {addr.address_line2 && `, ${addr.address_line2}`}
                  {addr.area && `, ${addr.area}`}
                </p>
                {addr.landmark && <p className="text-xs text-gray-400">Near {addr.landmark}</p>}
                <p className="text-sm text-gray-600">{addr.city}, {addr.state} — {addr.postal_code}</p>
                <p className="text-sm text-gray-500">📞 {addr.phone}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditForm(addr)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#FF6B00] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {deletingId === addr.id ? 'Removing...' : 'Delete'}
                </button>
                {!addr.is_default && (
                  <>
                    <span className="text-gray-200">|</span>
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#FF6B00] transition-colors ml-auto"
                    >
                      <Star className="w-3.5 h-3.5" /> Set Default
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-3xl">
              <h2 className="font-extrabold text-gray-900 text-lg">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Address Type */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">Address Type</label>
                <div className="flex gap-2">
                  {(['home', 'work', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => f('address_type', type)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all capitalize ${
                        form.address_type === type
                          ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <AddressTypeIcon type={type} />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Full Name *</label>
                  <input
                    className={inputClass('full_name')}
                    maxLength={34}
                    value={form.full_name}
                    onChange={(e) => f('full_name', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        phoneInputRef.current?.focus();
                      }
                    }}
                    placeholder="Yuva Kiran"
                  />
                  {formErrors.full_name && <p className="text-xs text-red-500 mt-1">{formErrors.full_name}</p>}
                </div>

                {/* Mobile Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Mobile Number *</label>
                  <input
                    ref={phoneInputRef}
                    className={inputClass('phone')}
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => f('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        pinInputRef.current?.focus();
                      }
                    }}
                    placeholder="9XXXXXXXXX"
                  />
                  {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                </div>

                {/* PIN Code */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 block">PIN Code *</label>
                    {pincodeLoading && (
                      <span className="text-[10px] text-[#FF6B00] font-bold animate-pulse">Auto-fetching...</span>
                    )}
                  </div>
                  <input
                    ref={pinInputRef}
                    type="text"
                    inputMode="numeric"
                    className={inputClass('postal_code')}
                    maxLength={6}
                    value={form.postal_code}
                    onChange={(e) => handlePinCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addressLine1Ref.current?.focus();
                      }
                    }}
                    placeholder="500001"
                  />
                  {formErrors.postal_code && <p className="text-xs text-red-500 mt-1">{formErrors.postal_code}</p>}
                </div>

                {/* City */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">City *</label>
                  <input
                    ref={cityInputRef}
                    className={inputClass('city')}
                    maxLength={50}
                    value={form.city}
                    onChange={(e) => f('city', e.target.value)}
                    placeholder="Hyderabad"
                  />
                  {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
                </div>

                {/* State (Auto-filled from PIN Code) */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">State *</label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm cursor-not-allowed"
                    value={form.state || (form.postal_code?.length === 6 ? 'Auto-detecting state...' : 'Auto-filled from PIN Code')}
                    placeholder="Auto-filled from PIN Code"
                  />
                  {formErrors.state && <p className="text-xs text-red-500 mt-1">{formErrors.state}</p>}
                </div>

                {/* Address Line 1 */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Address Line 1 *</label>
                  <textarea
                    ref={addressLine1Ref as any}
                    rows={2}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm resize-none focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all min-h-[58px] ${
                      formErrors.address_line1 ? 'border-red-300' : 'border-gray-200'
                    }`}
                    maxLength={140}
                    value={form.address_line1}
                    onChange={(e) => f('address_line1', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addressLine2Ref.current?.focus();
                      }
                    }}
                    placeholder="House No, Building Name, Street / Road"
                  />
                  {formErrors.address_line1 && <p className="text-xs text-red-500 mt-1">{formErrors.address_line1}</p>}
                </div>

                {/* Address Line 2 */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Address Line 2</label>
                  <textarea
                    ref={addressLine2Ref as any}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all min-h-[58px]"
                    maxLength={140}
                    value={form.address_line2}
                    onChange={(e) => f('address_line2', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        areaInputRef.current?.focus();
                      }
                    }}
                    placeholder="Apartment, Suite, Unit, Floor (optional)"
                  />
                </div>

                {/* Area / Locality */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Area / Locality</label>
                  <input
                    ref={areaInputRef}
                    className={inputClass('area')}
                    maxLength={80}
                    value={form.area}
                    onChange={(e) => f('area', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        landmarkInputRef.current?.focus();
                      }
                    }}
                    placeholder="Colony / Locality"
                  />
                </div>

                {/* Landmark */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Landmark</label>
                  <input
                    ref={landmarkInputRef}
                    className={inputClass('landmark')}
                    maxLength={80}
                    value={form.landmark}
                    onChange={(e) => f('landmark', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    placeholder="Near hospital..."
                  />
                </div>
              </div>

              {/* Default Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${form.is_default ? 'bg-[#FF6B00]' : 'bg-gray-200'}`}
                  onClick={() => f('is_default', !form.is_default)}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_default ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Set as default address</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-3xl flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
