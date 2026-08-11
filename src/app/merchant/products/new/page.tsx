"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { 
  Save, 
  Upload, 
  X, 
  Image as ImageIcon,
  Check,
  ChevronLeft,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { upload: uploadImage, isUploading: imageUploading, progress: uploadProgress } = useCloudinaryUpload({ folder: 'eyuvashop/products', maxSizeMB: 5 });
  
  const [store, setStore] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    brand: "",
    sku: "",
    barcode: "",
    category_id: "",
    price: "",
    compare_at_price: "",
    stock_quantity: "0",
    low_stock_threshold: "5",
  });
  
  const [images, setImages] = useState<{url: string, isPrimary: boolean}[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("merchant_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (profile) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id")
          .eq("merchant_id", profile.id)
          .single();
        setStore(storeData);
      }
      
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .eq("approval_status", "approved");
        
      if (catData) setCategories(catData);
    }
    loadData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    if (images.length + newFiles.length > 8) {
      alert("Maximum 8 images allowed.");
      return;
    }
    
    for (const file of newFiles) {
      try {
        const result = await uploadImage(file);
        if (result && result.url) {
          setImages(prev => [
            ...prev,
            {
              url: result.url,
              isPrimary: prev.length === 0 // First image is primary
            }
          ]);
        }
      } catch (err) {
        console.error("Image upload failed:", err);
        setErrorMsg("Failed to upload one or more images.");
      }
    }
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImgs = [...prev];
      newImgs.splice(index, 1);
      // Reset primary if needed
      if (prev[index].isPrimary && newImgs.length > 0) {
        newImgs[0].isPrimary = true;
      }
      return newImgs;
    });
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (!store) {
      setErrorMsg("Store not found. Please setup your store first.");
      return;
    }
    
    if (!formData.title || !formData.price || !formData.category_id) {
      setErrorMsg("Please fill all required fields (Title, Price, Category).");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      // 1. Insert product
      const productSlug = generateSlug(formData.title);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          store_id: store.id,
          category_id: formData.category_id,
          title: formData.title,
          slug: productSlug,
          description: formData.description || formData.short_description,
          brand: formData.brand,
          sku: formData.sku || `SKU-${Date.now()}`,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          status: 'draft',
          approval_status: submitForApproval ? 'pending' : 'draft',
          submitted_at: submitForApproval ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (productError) throw productError;

      // 2. Upload images (already uploaded to Cloudinary, just save URLs to DB)
      if (images.length > 0 && productData) {
        const imageInserts = images.map((img, i) => ({
          product_id: productData.id,
          url: img.url,
          alt_text: formData.title,
          display_order: i,
          is_primary: img.isPrimary
        }));
        
        await supabase.from('product_images').insert(imageInserts);
      }

      // 3. Create inventory record
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

  const discountPercent = (formData.price && formData.compare_at_price && parseFloat(formData.compare_at_price) > parseFloat(formData.price))
    ? Math.round(((parseFloat(formData.compare_at_price) - parseFloat(formData.price)) / parseFloat(formData.compare_at_price)) * 100)
    : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto mb-20">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500">Create a new product listing for your store.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start text-red-700">
          <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
                <input 
                  type="text" name="title" value={formData.title} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="e.g. Wireless Noise Cancelling Headphones" maxLength={150}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input 
                  type="text" name="short_description" value={formData.short_description} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="A brief summary of the product" maxLength={300}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleChange} rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="Detailed product description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="e.g. Sony" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Leave blank to auto-generate" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Images */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>
              <span className="text-sm text-gray-500">{images.length}/8 Images</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {images.map((img, idx) => (
                <div key={idx} className={`relative aspect-square rounded-lg border-2 overflow-hidden group ${img.isPrimary ? 'border-[#FF6B00]' : 'border-gray-200'}`}>
                  <img src={img.url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <button type="button" onClick={() => removeImage(idx)} className="self-end p-1 bg-white text-red-600 rounded-full hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </button>
                    {!img.isPrimary && (
                      <button type="button" onClick={() => setPrimaryImage(idx)} className="text-xs bg-white text-gray-900 px-2 py-1 rounded font-medium">
                        Set Primary
                      </button>
                    )}
                  </div>
                  {img.isPrimary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#FF6B00] text-white text-[10px] text-center py-1 font-medium">
                      Primary
                    </div>
                  )}
                </div>
              ))}
              
              {images.length < 8 && (
                <label className={`aspect-square rounded-lg border-2 border-dashed ${imageUploading ? 'border-gray-400 bg-gray-100' : 'border-gray-300 hover:border-[#FF6B00] bg-gray-50 hover:bg-orange-50'} flex flex-col items-center justify-center cursor-pointer transition-colors relative`}>
                  {imageUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-6 h-6 text-gray-400 mb-2 animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 font-medium">Add Image</span>
                    </>
                  )}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">First image will be used as the primary thumbnail. We recommend square images (1:1).</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 2: Category & Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select 
                name="category_id" value={formData.category_id} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Pricing */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                <input 
                  type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRP / Compare at Price (₹)</label>
                <input 
                  type="number" min="0" step="0.01" name="compare_at_price" value={formData.compare_at_price} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="0.00"
                />
              </div>
              {discountPercent > 0 && (
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-sm font-medium">
                  {discountPercent}% Discount
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Inventory */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                <input 
                  type="number" min="0" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input 
                  type="number" min="0" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                />
                <p className="text-xs text-gray-500 mt-1">Get notified when stock falls below this level.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg md:pl-64 z-10">
        <div className="max-w-5xl mx-auto flex justify-end space-x-4">
          <button 
            type="button" 
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button 
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-[#FF6B00] text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save & Submit for Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
}
