"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CloudinaryUploadButton } from "@/components/ui/CloudinaryUploadButton";
import { 
  Save, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Store, 
  Image as ImageIcon, 
  Phone, 
  Info,
  Loader2
} from "lucide-react";

export default function MerchantStorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    pin_code: "",
    logo_url: "",
    banner_url: "",
  });
  
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from("merchant_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (profileError || !profile) {
          setMessage({ type: "error", text: "Merchant profile not found." });
          setLoading(false);
          return;
        }
        
        setMerchantProfile(profile);
        
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("merchant_id", profile.id)
          .single();
          
        if (storeData) {
          setStore(storeData);
          setFormData({
            name: storeData.name || "",
            slug: storeData.slug || "",
            description: storeData.description || "",
            phone: storeData.phone || "",
            email: storeData.email || "",
            city: storeData.city || "",
            state: storeData.state || "",
            pin_code: storeData.pin_code || "",
            logo_url: storeData.logo_url || "",
            banner_url: storeData.banner_url || "",
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadData();
    }
  }, [user, supabase]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from name if name is changed
      if (name === "name" && !store?.id) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      }
      return updated;
    });
  };



  const handleSave = async () => {
    if (!merchantProfile) return;
    
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const storePayload = {
        merchant_id: merchantProfile.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        pin_code: formData.pin_code,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        updated_at: new Date().toISOString()
      };
      
      if (store?.id) {
        // Update
        const { error } = await supabase
          .from("stores")
          .update(storePayload)
          .eq("id", store.id);
          
        if (error) throw error;
        setMessage({ type: "success", text: "Store updated successfully." });
      } else {
        // Insert
        const { data, error } = await supabase
          .from("stores")
          .insert([{ ...storePayload, is_active: false, status: 'pending' }])
          .select()
          .single();
          
        if (error) throw error;
        setStore(data);
        setMessage({ type: "success", text: "Store created successfully." });
      }
    } catch (error: any) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: error.message || "Failed to save store." });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (merchantProfile?.verification_status !== 'approved') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-orange-50 border-l-4 border-[#FF6B00] p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-[#FF6B00] mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-orange-800">Account Pending Verification</h3>
              <p className="mt-1 text-orange-700">
                Your merchant profile is currently <strong>{merchantProfile?.verification_status || 'pending'}</strong>. 
                You can set up your store details, but it won't be visible to customers until your account is approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isFormChanged = () => {
    if (!store) return formData.name !== "";
    return (
      formData.name !== store.name ||
      formData.slug !== store.slug ||
      formData.description !== store.description ||
      formData.phone !== store.phone ||
      formData.email !== store.email ||
      formData.city !== store.city ||
      formData.state !== store.state ||
      formData.pin_code !== store.pin_code ||
      formData.logo_url !== store.logo_url ||
      formData.banner_url !== store.banner_url
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Profile</h1>
          <p className="text-gray-500">Manage your store's appearance and contact details.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isFormChanged() || saving}
          className="flex items-center space-x-2 bg-[#FF6B00] hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md mb-6 flex items-start ${message.type === 'error' ? 'bg-red-50 text-red-700 border-l-4 border-red-500' : 'bg-green-50 text-green-700 border-l-4 border-green-500'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'basic', label: 'Basic Info', icon: Store },
            { id: 'images', label: 'Images', icon: ImageIcon },
            { id: 'contact', label: 'Contact & Location', icon: Phone },
            { id: 'status', label: 'Store Status', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#FF6B00] text-[#FF6B00]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    placeholder="E.g., Yuvak's Electronics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Slug URL *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      eyuvashop.com/store/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="flex-1 block w-full px-4 py-2 border border-gray-300 rounded-none rounded-r-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                      placeholder="yuvaks-electronics"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  placeholder="Tell customers about your store and products..."
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Logo (1:1 aspect ratio recommended)</label>
                <CloudinaryUploadButton
                  folder="eyuvashop/store-logos"
                  onUpload={(img) => setFormData(prev => ({ ...prev, logo_url: img.url }))}
                  maxSizeMB={2}
                  label="Upload Store Logo"
                  currentImageUrl={formData.logo_url}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Banner (16:9 aspect ratio recommended)</label>
                <CloudinaryUploadButton
                  folder="eyuvashop/store-banners"
                  onUpload={(img) => setFormData(prev => ({ ...prev, banner_url: img.url }))}
                  maxSizeMB={5}
                  label="Upload Store Banner"
                  currentImageUrl={formData.banner_url}
                />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    name="pin_code"
                    value={formData.pin_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              {store ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Store Visibility</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-600">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        store.status === 'active' ? 'bg-green-100 text-green-800' :
                        store.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(store.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-600">Active</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {store.is_active ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-gray-600">Featured</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        store.is_featured ? 'bg-[#FF6B00]/20 text-[#FF6B00]' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {store.is_featured ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                  {store.status !== 'active' && (
                    <p className="text-sm text-gray-500 mt-4">
                      Your store needs admin approval before it becomes active. Please make sure all details are filled accurately.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No Store Found</h3>
                  <p className="text-gray-500 mt-1">Please fill in your basic info and save to create your store profile.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
