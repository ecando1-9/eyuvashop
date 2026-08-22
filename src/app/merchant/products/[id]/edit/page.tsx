"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PriceHistoryModal } from "@/components/merchant/PriceHistoryModal";
import { 
  Save, X, Image as ImageIcon, History, Loader2,
  AlertCircle, CheckCircle2, ArrowLeft, Plus
} from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const { upload: uploadImage, isUploading: imageUploading } = useCloudinaryUpload({ folder: 'eyuvashop/products', maxSizeMB: 5 });
  
  const [store, setStore] = useState<any>(null);
  const [mProfile, setMProfile] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
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
    parcel_weight_kg: "",
    status: "draft",
    approval_status: "draft"
  });

  const [images, setImages] = useState<{ id?: string; url: string; is_primary: boolean }[]>([]);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Quick Category Creation Modal State
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [quickCategoryForm, setQuickCategoryForm] = useState({ name: "", description: "" });
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);
  const [quickCategoryError, setQuickCategoryError] = useState("");

  // Load categories independently on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");
        const { data: catData, error } = await supabase
          .from('categories')
          .select('id, name, slug, type, merchant_id, status, approval_status')
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
  }, [supabase]);

  // Load product data
  useEffect(() => {
    async function loadProductData() {
      if (!user || !productId) return;
      try {
        setLoadingProduct(true);
        
        // 1. Get merchant profile and store
        const { data: profileData } = await supabase
          .from('merchant_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setMProfile(profileData);
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('merchant_id', profileData.id)
            .maybeSingle();
          if (storeData) setStore(storeData);
        }

        // 2. Fetch product details
        const { data: productData, error: productErr } = await supabase
          .from('products')
          .select(`
            *,
            images:product_images(id, url, is_primary, display_order)
          `)
          .eq('id', productId)
          .single();

        if (productErr || !productData) {
          setErrorMsg("Product not found or access denied.");
          setLoadingProduct(false);
          return;
        }

        setFormData({
          title: productData.title || "",
          title_te: productData.title_te || "",
          description: productData.description || "",
          short_description: productData.short_description || "",
          brand: productData.brand || "",
          sku: productData.sku || "",
          category_id: productData.category_id || "",
          price: productData.price?.toString() || "",
          compare_at_price: productData.compare_at_price?.toString() || "",
          stock_quantity: productData.stock_quantity?.toString() || "0",
          low_stock_threshold: productData.low_stock_threshold?.toString() || "5",
          weight_kg: productData.weight_kg?.toString() || "0.500",
          parcel_weight_kg: productData.parcel_weight_kg?.toString() || "",
          status: productData.status || "draft",
          approval_status: productData.approval_status || "draft"
        });

        if (productData.images && productData.images.length > 0) {
          const sorted = [...productData.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          setImages(sorted);
        }

      } catch (err: any) {
        console.error("Error loading product:", err);
        setErrorMsg(err.message || "Failed to load product details.");
      } finally {
        setLoadingProduct(false);
      }
    }

    loadProductData();
  }, [user?.id, productId, supabase]);
  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = quickCategoryForm.name.trim();
    if (!nameTrimmed) {
      setQuickCategoryError("Category name is required.");
      return;
    }

    if (!mProfile?.id) {
      setQuickCategoryError("Merchant profile is not ready. Please wait a moment.");
      return;
    }

    try {
      setQuickCategoryLoading(true);
      setQuickCategoryError("");

      const slug = nameTrimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-m-' + mProfile.id.slice(0, 6);

      const { data: newCat, error } = await supabase
        .from('categories')
        .insert([{
          name: nameTrimmed,
          slug,
          description: quickCategoryForm.description.trim() || null,
          type: 'MERCHANT',
          merchant_id: mProfile.id,
          status: 'active',
          approval_status: 'approved'
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [newCat, ...prev]);
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      setShowQuickCategoryModal(false);
      setQuickCategoryForm({ name: '', description: '' });
    } catch (err: any) {
      console.error("Quick create category error:", err);
      setQuickCategoryError(err.message || "Failed to create category.");
    } finally {
      setQuickCategoryLoading(false);
    }
  };

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

  const handleSave = async (submitForApproval = false) => {
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

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const canPublishDirectly = mProfile?.can_publish || mProfile?.verification_status === 'approved';
      
      let nextStatus = formData.status;
      let nextApproval = formData.approval_status;

      if (submitForApproval) {
        if (canPublishDirectly) {
          nextStatus = 'published';
          nextApproval = 'approved';
        } else {
          nextStatus = 'draft';
          nextApproval = 'pending';
        }
      }

      // 1. Update product
      const { error: prodUpdateErr } = await supabase
        .from('products')
        .update({
          category_id: formData.category_id,
          title: formData.title.trim(),
          title_te: formData.title_te.trim() || null,
          description: formData.description || formData.short_description,
          brand: formData.brand.trim() || null,
          sku: formData.sku.trim(),
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 0.500,
          parcel_weight_kg: formData.parcel_weight_kg ? parseFloat(formData.parcel_weight_kg) : null,
          status: nextStatus,
          approval_status: nextApproval,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (prodUpdateErr) throw prodUpdateErr;

      // 2. Update inventory table
      await supabase
        .from('inventory')
        .upsert({
          product_id: productId,
          quantity: parseInt(formData.stock_quantity) || 0,
          low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id' });

      // 3. Sync images
      await supabase.from('product_images').delete().eq('product_id', productId);
      if (images.length > 0) {
        const imageInserts = images.map((img, i) => ({
          product_id: productId,
          url: img.url,
          is_primary: img.is_primary,
          display_order: i
        }));
        await supabase.from('product_images').insert(imageInserts);
      }

      setSuccessMsg("Product updated successfully!");
      setTimeout(() => {
        router.push("/merchant/products");
      }, 1200);

    } catch (err: any) {
      console.error("Update error:", err);
      setErrorMsg(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProduct) {
    return (
      <MerchantLayout title="Edit Product" subtitle="Update product catalog details">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout title="Edit Product" subtitle="Modify your product details, category, pricing, and stock">
      <div className="space-y-6 pb-20 w-full">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/merchant/products"
            className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products List
          </Link>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            formData.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
          }`}>
            Status: {formData.status} ({formData.approval_status})
          </span>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-lg">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs font-bold rounded-r-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* 1. Multilingual Basic Info */}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Category *</label>
                <button
                  type="button"
                  onClick={() => {
                    setQuickCategoryError('');
                    setShowQuickCategoryModal(true);
                  }}
                  className="text-[11px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create Category
                </button>
              </div>
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
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none bg-white disabled:opacity-60 disabled:cursor-wait font-medium"
                >
                  <option value="">
                    {categoriesLoading ? 'Loading categories...' : `Select Category (${categories.length} available)`}
                  </option>
                  
                  {/* My Custom Categories */}
                  {categories.filter(c => c.type === 'MERCHANT' || c.merchant_id).length > 0 && (
                    <optgroup label="── My Custom Categories ──">
                      {categories
                        .filter(c => c.type === 'MERCHANT' || c.merchant_id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            ★ {c.name}
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {/* Platform Default Categories */}
                  <optgroup label="── Platform Categories ──">
                    {categories
                      .filter(c => c.type !== 'MERCHANT' && !c.merchant_id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
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
                placeholder="Product SKU"
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

        {/* 2. Pricing & Weights */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">2. Pricing, Margin & Physical Weight</h2>
            <button
              type="button"
              onClick={() => setPriceHistoryOpen(true)}
              className="text-xs text-[#FF6B00] font-bold flex items-center gap-1 hover:underline"
            >
              <History className="w-3.5 h-3.5" /> Price History
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

        {/* 3. Stock & Inventory */}
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

        {/* 4. Product Media Gallery */}
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
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/merchant/products"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
          >
            Cancel
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
            >
              Save Changes
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{mProfile?.can_publish || mProfile?.verification_status === 'approved' ? 'Save & Publish' : 'Save & Submit for Approval'}</span>
            </button>
          </div>
        </div>

        {/* QUICK CATEGORY CREATION MODAL */}
        {showQuickCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h3 className="font-extrabold text-gray-900 text-sm">Create New Category</h3>
                <button
                  onClick={() => setShowQuickCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {quickCategoryError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{quickCategoryError}</span>
                </div>
              )}

              <form onSubmit={handleQuickCreateCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Category Name * <span className="text-gray-400 font-normal">(max 50 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Sarees, Sweets"
                    value={quickCategoryForm.name}
                    onChange={(e) => setQuickCategoryForm({ ...quickCategoryForm, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Short description..."
                    value={quickCategoryForm.description}
                    onChange={(e) => setQuickCategoryForm({ ...quickCategoryForm, description: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#FF6B00] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryModal(false)}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickCategoryLoading}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {quickCategoryLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{quickCategoryLoading ? "Creating..." : "Create & Select"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PriceHistoryModal
          productId={productId}
          productTitle={formData.title || "Product"}
          isOpen={priceHistoryOpen}
          onClose={() => setPriceHistoryOpen(false)}
        />
      </div>
    </MerchantLayout>
  );
}