"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CloudinaryUploadButton } from "@/components/ui/CloudinaryUploadButton";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { Save, AlertCircle, CheckCircle2, Store, Image as ImageIcon, Phone, Loader2 } from "lucide-react";

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
    banner_url: ""
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null, text: string }>({ type: null, text: "" });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: mProfile } = await supabase
        .from("merchant_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
        
      if (mProfile) {
        setMerchantProfile(mProfile);
        
        const { data: storeData } = await supabase
          .from("stores")
          .select("*")
          .eq("merchant_id", mProfile.id)
          .single();
          
        if (storeData) {
          setStore(storeData);
          setFormData({
            name: storeData.name || "",
            slug: storeData.slug || "",
            description: storeData.description || "",
            phone: storeData.phone || mProfile.business_phone || "",
            email: storeData.email || mProfile.business_email || user.email || "",
            city: storeData.city || "",
            state: storeData.state || "",
            pin_code: storeData.pin_code || "",
            logo_url: storeData.logo_url || "",
            banner_url: storeData.banner_url || ""
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData(prev => ({ ...prev, name, slug: store?.slug ? prev.slug : slug }));
  };

  const handleSave = async () => {
    if (!merchantProfile) return;
    
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Store name is required." });
      return;
    }
    
    try {
      setSaving(true);
      setMessage({ type: null, text: "" });
      
      const storePayload = {
        merchant_id: merchantProfile.id,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
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
        const { error } = await supabase
          .from("stores")
          .update(storePayload)
          .eq("id", store.id);
          
        if (error) throw error;
        setMessage({ type: "success", text: "Store profile updated successfully." });
      } else {
        const { data: newStore, error } = await supabase
          .from("stores")
          .insert({
            ...storePayload,
            is_active: false,
            status: 'draft'
          })
          .select()
          .single();
          
        if (error) throw error;
        setStore(newStore);
        setMessage({ type: "success", text: "Store profile created successfully." });
      }
      
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save store profile." });
    } finally {
      setSaving(false);
    }
  };

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

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" /></div>;
  }

  return (
    <MerchantLayout title="Storefront Profile & Branding" subtitle="Customize your store appearance, logo, banner, and business contact information">
      <div className="space-y-6">
        <div className="flex justify-end mb-2">
          <button
            onClick={handleSave}
            disabled={!isFormChanged() || saving}
            className="flex items-center space-x-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-5 py-2 rounded-xl font-bold text-xs disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl flex items-start ${message.type === 'error' ? 'bg-red-50 text-red-700 border-l-4 border-red-500' : 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'}`}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'basic', label: 'Basic Info', icon: Store },
              { id: 'branding', label: 'Store Branding', icon: ImageIcon },
              { id: 'contact', label: 'Contact Details', icon: Phone },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#FF6B00] text-[#FF6B00] bg-orange-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Store Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="My Amazing Store"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Store Slug URL *</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 rounded-l-lg text-xs text-gray-500 font-mono">
                      eyuvashop.com/store/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-r-lg font-mono focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell customers about your store, product specialization, and origin story..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Store Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <CloudinaryUploadButton
                      folder="eyuvashop/store-logos"
                      onUploadSuccess={(img) => setFormData(prev => ({ ...prev, logo_url: img.url }))}
                      currentImageUrl={formData.logo_url}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">Store Banner</label>
                  <div className="space-y-3">
                    <div className="w-full h-36 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {formData.banner_url ? (
                        <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <CloudinaryUploadButton
                      folder="eyuvashop/store-banners"
                      onUploadSuccess={(img) => setFormData(prev => ({ ...prev, banner_url: img.url }))}
                      currentImageUrl={formData.banner_url}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      name="pin_code"
                      value={formData.pin_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
