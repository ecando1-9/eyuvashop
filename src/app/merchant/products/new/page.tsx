"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PriceHistoryModal } from "@/components/merchant/PriceHistoryModal";
import { 
  Save, X, Image as ImageIcon, History, Loader2, Store, Phone, Mail, MapPin, 
  ShieldCheck, AlertCircle, Sparkles, CheckCircle2 
} from "lucide-react";

export default function NewProductPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  // Stable supabase client reference — prevents it from being an unstable useEffect dep
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const { upload: uploadImage, isUploading: imageUploading } = useCloudinaryUpload({ folder: 'eyuvashop/products', maxSizeMB: 5 });
  
  const [store, setStore] = useState<any>(null);
  const [mProfile, setMProfile] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    title_te: "",
    description: "",
    short_description: "",
    brand: "",
    sku: "",
    category_id: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "10",
    low_stock_threshold: "5",
    weight_kg: "0.500",
    parcel_weight_kg: ""
  });

  const [images, setImages] = useState<{ url: string; is_primary: boolean }[]>([]);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  // Mandatory Store Branding & Trust Profile Modal
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [brandingForm, setBrandingForm] = useState({
    store_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Andhra Pradesh",
    pin_code: ""
  });
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX: Load categories INDEPENDENTLY — categories are public (approved) data
  // and should not wait for user authentication or merchant profile to be ready.
  // Previously, categories were fetched inside the merchant profile block, so if
  // the profile was loading or the user wasn't ready, categories never loaded.
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError('');
        const { data: catData, error } = await supabase
          .from('categories')
          .select('id, name')
          .eq('approval_status', 'approved')
          .order('name');
        
        if (error) throw error;
        setCategories(catData || []);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
        setCategoriesError('Failed to load categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, [supabase]); // supabase is stable (useRef), so this runs exactly once on mount

  // Load merchant profile + store data (depends on authenticated user)
  useEffect(() => {
    async function loadMerchantData() {
      if (!user) return;
      try {
        let { data: profileData } = await supabase
          .from('merchant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // If no merchant profile exists yet, create one gracefully
        if (!profileData) {
          const { data: newProfile } = await supabase
            .from('merchant_profiles')
            .insert([{
              user_id: user.id,
              business_name: profile?.full_name || user.email?.split('@')[0] || 'Merchant Store',
              business_email: user.email || '',
              business_phone: profile?.phone || '',
              verification_status: 'pending'
            }])
            .select()
            .maybeSingle();
          profileData = newProfile;
        }

        if (profileData) {
          setMProfile(profileData);
          let { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', profileData.id)
            .maybeSingle();

          // If no store exists yet, auto-provision one
          if (!storeData) {
            const storeSlug = (profileData.business_name || 'store')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-') + '-' + user.id.slice(0, 4);

            const { data: newStore } = await supabase
              .from('stores')
              .insert([{
                merchant_id: profileData.id,
                name: profileData.business_name || 'My Store',
                slug: storeSlug,
                email: profileData.business_email || user.email,
                phone: profileData.business_phone,
                city: 'Local'
              }])
              .select()
              .maybeSingle();
            storeData = newStore;
          }

          if (storeData) {
            setStore(storeData);
            setBrandingForm({
              store_name: storeData.name || profileData.business_name || "",
              phone: storeData.phone || profileData.business_phone || profile?.phone || "",
              email: storeData.email || profileData.business_email || user.email || "",
              address: profileData.business_address || storeData.business_address || "",
              city: storeData.city || "",
              state: storeData.state || "Andhra Pradesh",
              pin_code: storeData.pin_code || ""
            });
          }
        }
      } catch (err) {
        console.error("Error loading merchant data:", err);
      }
    }
    loadMerchantData();
  }, [user?.id, profile, supabase]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const res = await uploadImage(file);
      if (res?.url) {
        setImages(prev => [
          ...prev, 
          { url: res.url, is_primary: prev.length === 0 }
        ]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Failed to upload image.");
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      if (filtered.length > 0 && !filtered.some(img => img.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (indexToPrimary: number) => {
    setImages(prev => prev.map((img, idx) => ({
      ...img,
      is_primary: idx === indexToPrimary
    })));
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);
  };

  const validateAndProceedSave = (submitForApproval = false) => {
    if (!formData.title.trim()) {
      setErrorMsg("Product Title (English) is required.");
      return;
    }

    if (!formData.category_id) {
      setErrorMsg("Please select a category.");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    // Check if store branding details (Name, Phone, Address, City) are complete
    const isFirstTimePublish = !mProfile?.first_product_published_at;
    const isStoreInfoIncomplete = !store?.phone || !brandingForm.address.trim() || !store?.city;

    if (submitForApproval && (isFirstTimePublish || isStoreInfoIncomplete)) {
      setShowBrandingModal(true);
      return;
    }

    executeSave(submitForApproval);
  };

  const handleSaveBrandingAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandingForm.store_name.trim() || !brandingForm.phone.trim() || !brandingForm.address.trim() || !brandingForm.city.trim()) {
      alert("Please fill in all mandatory store branding fields.");
      return;
    }

    try {
      setSavingBranding(true);

      // 1. Update merchant profile address and phone
      if (mProfile?.id) {
        await supabase.from('merchant_profiles').update({
          business_name: brandingForm.store_name.trim(),
          business_phone: brandingForm.phone.trim(),
          business_email: brandingForm.email.trim(),
          business_address: brandingForm.address.trim(),
          updated_at: new Date().toISOString()
        }).eq('id', mProfile.id);
      }

      // 2. Update store table details
      if (store?.id) {
        await supabase.from('stores').update({
          name: brandingForm.store_name.trim(),
          phone: brandingForm.phone.trim(),
          email: brandingForm.email.trim(),
          city: brandingForm.city.trim(),
          state: brandingForm.state.trim(),
          pin_code: brandingForm.pin_code.trim(),
          updated_at: new Date().toISOString()
        }).eq('id', store.id);
      }

      setShowBrandingModal(false);
      await executeSave(true);
    } catch (err: any) {
      alert("Error saving store branding: " + err.message);
    } finally {
      setSavingBranding(false);
    }
  };

  const executeSave = async (submitForApproval = false) => {
    if (!store) {
      setErrorMsg("Store profile is not ready yet. Please setup your store first.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const productSlug = generateSlug(formData.title);
      const canPublishDirectly = mProfile?.can_publish || mProfile?.verification_status === 'approved';

      const finalStatus = submitForApproval && canPublishDirectly ? 'published' : 'draft';
      const finalApproval = submitForApproval && canPublishDirectly ? 'approved' : submitForApproval ? 'pending' : 'draft';

      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          store_id: store.id,
          category_id: formData.category_id,
          title: formData.title,
          title_te: formData.title_te || null,
          slug: productSlug,
          description: formData.description || formData.short_description,
          brand: formData.brand || brandingForm.store_name || store.name,
          sku: formData.sku || `SKU-${Date.now()}`,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 0.500,
          parcel_weight_kg: formData.parcel_weight_kg ? parseFloat(formData.parcel_weight_kg) : null,
          status: finalStatus,
          approval_status: finalApproval,
          submitted_at: submitForApproval ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (productError) throw productError;

      if (images.length > 0 && productData) {
        const imageInserts = images.map((img, i) => ({
          product_id: productData.id,
          url: img.url,
          is_primary: img.is_primary,
          display_order: i
        }));

        await supabase.from('product_images').insert(imageInserts);
      }

      if (productData) {
        await supabase.from('inventory').insert([{
          product_id: productData.id,
          quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold)
        }]);

        // If published, update merchant profile publishing tracking
        if (finalStatus === 'published' && mProfile?.id) {
          await supabase.from('merchant_profiles').update({
            first_product_published_at: mProfile.first_product_published_at || new Date().toISOString(),
            last_published_product_id: productData.id,
            updated_at: new Date().toISOString()
          }).eq('id', mProfile.id);
        }
      }

      router.push("/merchant/products");
      
    } catch (err: any) {
      console.error("Save error:", err);
      setErrorMsg(err.message || "Failed to save product.");
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" /></div>;
  }

  return (
    <MerchantLayout title="Add New Product" subtitle="Create a new product listing and submit for marketplace publishing">
      <div className="space-y-6 pb-20 w-full">
        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-lg">
            {errorMsg}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">1. Multilingual Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Title (English) *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Sona Masoori Raw Rice 25kg"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#FF6B00] mb-1">Product Title (తెలుగు - Telugu)</label>
              <input
                type="text"
                name="title_te"
                value={formData.title_te}
                onChange={handleChange}
                placeholder="ఉదా: సోనా మసూరి బియ్యం 25 కేజీలు"
                className="w-full p-2.5 border border-orange-200 bg-orange-50/20 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              {categoriesError ? (
                <div className="w-full p-2.5 border border-red-300 rounded-lg text-xs bg-red-50 text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {categoriesError}
                </div>
              ) : (
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none bg-white disabled:opacity-60 disabled:cursor-wait"
                >
                  <option value="">
                    {categoriesLoading ? 'Loading categories...' : `Select Category (${categories.length} available)`}
                  </option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Organic Heritage"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Auto-generated if blank"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Short Summary</label>
            <input
              type="text"
              name="short_description"
              value={formData.short_description}
              onChange={handleChange}
              placeholder="Brief 1-sentence product summary"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Detailed Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed ingredients, features, specifications..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
            ></textarea>
          </div>
        </div>

        {/* Pricing & Weights */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">2. Pricing, Margin & Physical Weight</h2>
            <button
              type="button"
              onClick={() => setPriceHistoryOpen(true)}
              className="text-xs text-[#FF6B00] font-bold flex items-center gap-1 hover:underline"
            >
              <History className="w-3.5 h-3.5" /> Price Change Rules
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">MRP / Compare Price (₹)</label>
              <input
                type="number"
                step="0.01"
                name="compare_at_price"
                value={formData.compare_at_price}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Net Weight (kg) *</label>
              <input
                type="number"
                step="0.001"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                placeholder="0.500"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Parcel Weight (kg)</label>
              <input
                type="number"
                step="0.001"
                name="parcel_weight_kg"
                value={formData.parcel_weight_kg}
                onChange={handleChange}
                placeholder="Weight including box"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">3. Stock & Inventory Control</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Current Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleChange}
                min="1"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">4. Product Media Gallery</h2>
          
          <div className="flex flex-wrap gap-4 items-center">
            {images.map((img, idx) => (
              <div key={idx} className={`relative w-28 h-28 rounded-xl border-2 overflow-hidden bg-gray-50 flex items-center justify-center ${img.is_primary ? 'border-[#FF6B00]' : 'border-gray-200'}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
                {img.is_primary ? (
                  <span className="absolute bottom-1 left-1 bg-[#FF6B00] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(idx)}
                    className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded hover:bg-black/80"
                  >
                    Set Main
                  </button>
                )}
              </div>
            ))}

            {images.length < 6 && (
              <label className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B00] transition-colors bg-gray-50/50">
                {imageUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-[10px] font-bold text-gray-500">Upload Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => validateAndProceedSave(false)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => validateAndProceedSave(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{mProfile?.can_publish || mProfile?.verification_status === 'approved' ? 'Save & Publish Product' : 'Save & Request Initial Approval'}</span>
          </button>
        </div>

        {/* Mandatory Store Branding & Customer Trust Modal */}
        {showBrandingModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Store Branding & Trust Verification</h3>
                    <p className="text-[11px] text-slate-600">Provide complete store contact details for customer confidence</p>
                  </div>
                </div>
                <button onClick={() => setShowBrandingModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBrandingAndPublish} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                  <p className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" /> Brand Trust Requirement:</p>
                  <p>Buyers can see your store contact and location details for order support, giving customers 100% confidence to purchase your products.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store / Brand Name *</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={brandingForm.store_name}
                      onChange={(e) => setBrandingForm({ ...brandingForm, store_name: e.target.value })}
                      placeholder="e.g. Yuva Organic Mart"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer Support Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={brandingForm.phone}
                        onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Support Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={brandingForm.email}
                        onChange={(e) => setBrandingForm({ ...brandingForm, email: e.target.value })}
                        placeholder="support@store.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store / Warehouse Physical Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={2}
                      required
                      value={brandingForm.address}
                      onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                      placeholder="Shop/Unit No, Street Name, Area..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City / Town *</label>
                    <input
                      type="text"
                      required
                      value={brandingForm.city}
                      onChange={(e) => setBrandingForm({ ...brandingForm, city: e.target.value })}
                      placeholder="e.g. Vijayawada"
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={brandingForm.state}
                      onChange={(e) => setBrandingForm({ ...brandingForm, state: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={brandingForm.pin_code}
                      onChange={(e) => setBrandingForm({ ...brandingForm, pin_code: e.target.value })}
                      placeholder="520001"
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBrandingModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-xs"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="submit"
                    disabled={savingBranding}
                    className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingBranding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{savingBranding ? 'Saving & Publishing...' : 'Confirm Branding & Publish'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PriceHistoryModal
          productId="new"
          productTitle={formData.title || "New Product"}
          isOpen={priceHistoryOpen}
          onClose={() => setPriceHistoryOpen(false)}
        />
      </div>
    </MerchantLayout>
  );
}
