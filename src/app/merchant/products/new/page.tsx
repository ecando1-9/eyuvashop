"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { PriceHistoryModal } from "@/components/merchant/PriceHistoryModal";
import { Save, X, Image as ImageIcon, History, Loader2 } from "lucide-react";

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { upload: uploadImage, isUploading: imageUploading } = useCloudinaryUpload({ folder: 'eyuvashop/products', maxSizeMB: 5 });
  
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
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

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const { data: mProfile } = await supabase.from('merchant_profiles').select('id').eq('user_id', user.id).single();
        if (mProfile) {
          const { data: storeData } = await supabase.from('stores').select('*').eq('merchant_id', mProfile.id).single();
          if (storeData) setStore(storeData);
        }

        const { data: catData } = await supabase.from('categories').select('id, name').order('name');
        if (catData) setCategories(catData);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [user, supabase]);

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
    } catch (err: any) {
      alert("Image upload failed: " + err.message);
    }
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === index })));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(img => img.is_primary)) {
        next[0].is_primary = true;
      }
      return next;
    });
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (!store) {
      setErrorMsg("Please complete your store setup before adding products.");
      return;
    }

    if (!formData.title.trim()) {
      setErrorMsg("Product Title (English) is required.");
      return;
    }

    if (!formData.category_id) {
      setErrorMsg("Category is required.");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const productSlug = generateSlug(formData.title);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          store_id: store.id,
          category_id: formData.category_id,
          title: formData.title,
          title_te: formData.title_te || null,
          slug: productSlug,
          description: formData.description || formData.short_description,
          brand: formData.brand,
          sku: formData.sku || `SKU-${Date.now()}`,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 0.500,
          parcel_weight_kg: formData.parcel_weight_kg ? parseFloat(formData.parcel_weight_kg) : null,
          status: 'draft',
          approval_status: submitForApproval ? 'pending' : 'draft',
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
      <div className="space-y-6 pb-20 max-w-4xl">
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
                placeholder="e.g. Classic Cotton Denim Jacket"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Title (Telugu / తెలుగు శీర్షిక)</label>
              <input
                type="text"
                name="title_te"
                value={formData.title_te}
                onChange={handleChange}
                placeholder="ఉదా: కాటన్ డెనిమ్ జాకెట్"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Urban Style"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed product features, materials, and care instructions..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">2. Pricing & Inventory</h2>
            <button
              type="button"
              onClick={() => setPriceHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-200"
            >
              <History className="w-3.5 h-3.5" /> View Price History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="1299"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">MRP / Strikethrough (₹)</label>
              <input
                type="number"
                name="compare_at_price"
                step="0.01"
                value={formData.compare_at_price}
                onChange={handleChange}
                placeholder="1999"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Product Weight & Parcel Weight */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">3. Weight & Shipping Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Weight (kg)</label>
              <input
                type="number"
                name="weight_kg"
                step="0.001"
                value={formData.weight_kg}
                onChange={handleChange}
                placeholder="0.500"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">Default product unit weight used for delivery calculations.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Custom Parcel Weight Override (kg)</label>
              <input
                type="number"
                name="parcel_weight_kg"
                step="0.001"
                value={formData.parcel_weight_kg}
                onChange={handleChange}
                placeholder="e.g. 1.200 (Optional)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">If specified, parcel weight takes precedence over normal product quantity weight.</span>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">4. Product Media</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-50">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.is_primary && (
                  <span className="absolute top-2 left-2 bg-[#FF6B00] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="p-1.5 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-orange-50"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {images.length < 8 && (
              <label className="border-2 border-dashed border-gray-300 hover:border-[#FF6B00] rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 transition-colors">
                <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs font-bold text-gray-600">{imageUploading ? 'Uploading...' : 'Add Image'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold hover:bg-[#e05e00] shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Submit for Publishing</span>
          </button>
        </div>

        {/* Price History Modal */}
        <PriceHistoryModal
          productId=""
          productTitle={formData.title || "New Product"}
          isOpen={priceHistoryOpen}
          onClose={() => setPriceHistoryOpen(false)}
        />
      </div>
    </MerchantLayout>
  );
}
