"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MerchantLayout } from "@/components/merchant/MerchantLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { 
  Grid, Plus, Search, Edit2, Trash2, ShieldCheck, Lock, 
  Layers, Package, CheckCircle2, AlertCircle, AlertTriangle, 
  X, Loader2, RefreshCw, FolderPlus, Tag, Check, Info
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "PLATFORM" | "MERCHANT";
  merchant_id: string | null;
  status: "active" | "inactive";
  approval_status: string;
  created_at: string;
  product_count?: number;
}

export default function MerchantCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [store, setStore] = useState<any>(null);

  // Filter & Search state
  const [activeTab, setActiveTab] = useState<"all" | "platform" | "merchant">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit Modal state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "active" as "active" | "inactive" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Modal state
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch merchant profile & store
      const { data: mProfile } = await supabase
        .from("merchant_profiles")
        .select("id, business_name, verification_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mProfile) {
        setMerchantProfile(mProfile);
        const { data: storeData } = await supabase
          .from("stores")
          .select("id, name")
          .eq("merchant_id", mProfile.id)
          .maybeSingle();
        if (storeData) setStore(storeData);
      }

      // 2. Fetch categories (Platform + Merchant's own)
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name, slug, description, type, merchant_id, status, approval_status, created_at")
        .order("name", { ascending: true });

      if (catError) throw catError;

      // 3. Fetch product counts per category for this merchant's store if store exists
      let productCounts: Record<string, number> = {};
      if (mProfile?.id) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("id")
          .eq("merchant_id", mProfile.id)
          .maybeSingle();

        if (storeData?.id) {
          const { data: prodData } = await supabase
            .from("products")
            .select("category_id")
            .eq("store_id", storeData.id)
            .is("deleted_at", null);

          if (prodData) {
            prodData.forEach((p) => {
              if (p.category_id) {
                productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
              }
            });
          }
        }
      }

      const formatted: CategoryItem[] = (catData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || null,
        type: (c.type as "PLATFORM" | "MERCHANT") || (c.merchant_id ? "MERCHANT" : "PLATFORM"),
        merchant_id: c.merchant_id || null,
        status: (c.status as "active" | "inactive") || "active",
        approval_status: c.approval_status || "approved",
        created_at: c.created_at,
        product_count: productCounts[c.id] || 0
      }));

      setCategories(formatted);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      showToast("error", err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  // Filtered categories computed based on active tab and search query
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Tab filter
      if (activeTab === "platform" && cat.type !== "PLATFORM") return false;
      if (activeTab === "merchant" && cat.type !== "MERCHANT") return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesSlug = cat.slug.toLowerCase().includes(q);
        const matchesDesc = cat.description?.toLowerCase().includes(q);
        return matchesName || matchesSlug || matchesDesc;
      }

      return true;
    });
  }, [categories, activeTab, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const platform = categories.filter((c) => c.type === "PLATFORM").length;
    const merchant = categories.filter((c) => c.type === "MERCHANT").length;
    const active = categories.filter((c) => c.status === "active").length;
    return { total: categories.length, platform, merchant, active };
  }, [categories]);

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = createForm.name.trim();

    if (!nameTrimmed) {
      setCreateError("Category name is required.");
      return;
    }

    if (nameTrimmed.length > 50) {
      setCreateError("Category name must be 50 characters or less.");
      return;
    }

    // Check duplicate name in merchant's categories
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === nameTrimmed.toLowerCase() && (c.type === "MERCHANT" || c.type === "PLATFORM")
    );
    if (isDuplicate) {
      setCreateError("A category with this name already exists. Please choose a distinct name.");
      return;
    }

    if (!merchantProfile?.id) {
      setCreateError("Merchant profile not found. Please refresh the page.");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError("");

      const slug = nameTrimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") + "-m-" + merchantProfile.id.slice(0, 6);

      const { data: newCat, error: insertError } = await supabase
        .from("categories")
        .insert([
          {
            name: nameTrimmed,
            slug,
            description: createForm.description.trim() || null,
            type: "MERCHANT",
            merchant_id: merchantProfile.id,
            status: "active",
            approval_status: "approved"
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const createdItem: CategoryItem = {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        description: newCat.description || null,
        type: "MERCHANT",
        merchant_id: merchantProfile.id,
        status: "active",
        approval_status: "approved",
        created_at: newCat.created_at || new Date().toISOString(),
        product_count: 0
      };

      setCategories((prev) => [createdItem, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "" });
      showToast("success", `Custom category "${nameTrimmed}" created successfully!`);
    } catch (err: any) {
      console.error("Create category error:", err);
      setCreateError(err.message || "Failed to create category.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (category: CategoryItem) => {
    if (category.type === "PLATFORM") return;
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || "",
      status: category.status
    });
    setEditError("");
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const nameTrimmed = editForm.name.trim();
    if (!nameTrimmed) {
      setEditError("Category name is required.");
      return;
    }

    if (nameTrimmed.length > 50) {
      setEditError("Category name must be 50 characters or less.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");

      const { error: updateError } = await supabase
        .from("categories")
        .update({
          name: nameTrimmed,
          description: editForm.description.trim() || null,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingCategory.id);

      if (updateError) throw updateError;

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: nameTrimmed, description: editForm.description.trim() || null, status: editForm.status }
            : c
        )
      );

      setEditingCategory(null);
      showToast("success", `Category "${nameTrimmed}" updated successfully!`);
    } catch (err: any) {
      console.error("Update category error:", err);
      setEditError(err.message || "Failed to update category.");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Modal & Check Products Usage
  const handleOpenDelete = async (category: CategoryItem) => {
    if (category.type === "PLATFORM") return;
    setDeletingCategory(category);
    setDeleteWarning(null);

    // Check if products exist under this category
    try {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", category.id)
        .is("deleted_at", null);

      if (!error && count && count > 0) {
        setDeleteWarning(`Note: ${count} product(s) in your store are currently assigned to this category. Deleting it will leave those products uncategorized.`);
      }
    } catch (err) {
      console.error("Check product count error:", err);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      setDeleteLoading(true);

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingCategory.id);

      if (deleteError) throw deleteError;

      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      showToast("success", `Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
    } catch (err: any) {
      console.error("Delete category error:", err);
      showToast("error", err.message || "Failed to delete category.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <MerchantLayout
      title="Category Management"
      subtitle="View platform standard categories and create custom categories for your store catalog"
      actions={
        <button
          onClick={() => {
            setCreateError("");
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      }
    >
      <div className="space-y-6 pb-16">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-in fade-in duration-200 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Category Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase">Available Categories</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-gray-900">{stats.total}</p>
              <span className="text-xs font-bold text-gray-400">Total</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase">Platform Standard</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-blue-600">{stats.platform}</p>
              <span className="text-xs font-bold text-blue-600/80 bg-blue-50 px-2 py-0.5 rounded-full">Default</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase">My Custom Categories</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-[#FF6B00]">{stats.merchant}</p>
              <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-full">Custom</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-xs font-bold text-gray-500 uppercase">Active for Products</span>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Filter Tabs & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: `All Categories (${stats.total})` },
              { id: "platform", label: `Platform (${stats.platform})` },
              { id: "merchant", label: `My Categories (${stats.merchant})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-[#FF6B00] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search category name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Table / List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-xs font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
              <span>Loading category library...</span>
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Type & Ownership</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">My Products</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCategories.map((cat) => {
                    const isPlatform = cat.type === "PLATFORM";

                    return (
                      <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Name & Slug */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPlatform ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-[#FF6B00]"
                              }`}
                            >
                              <Tag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-sm">{cat.name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{cat.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="p-4">
                          {isPlatform ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold border border-blue-200">
                              <ShieldCheck className="w-3 h-3" />
                              Platform Default
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-[#FF6B00] rounded-full text-[11px] font-bold border border-orange-200">
                              <FolderPlus className="w-3 h-3" />
                              My Custom Category
                            </span>
                          )}
                        </td>

                        {/* Description */}
                        <td className="p-4 text-gray-500 max-w-xs truncate">
                          {cat.description || <span className="text-gray-300 italic">No description</span>}
                        </td>

                        {/* Products Count */}
                        <td className="p-4">
                          <span className="font-bold text-gray-700">
                            {cat.product_count || 0} product{(cat.product_count || 0) === 1 ? "" : "s"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              cat.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cat.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          {isPlatform ? (
                            <span
                              className="text-gray-400 text-[11px] font-semibold flex items-center justify-end gap-1"
                              title="Platform categories are read-only and maintained by the marketplace."
                            >
                              <Lock className="w-3.5 h-3.5" /> Read-Only
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(cat)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                title="No categories found"
                description={
                  searchQuery
                    ? `No categories match "${searchQuery}".`
                    : activeTab === "merchant"
                    ? "You haven't created any custom categories yet. Click below to add one."
                    : "No categories available."
                }
                actionLabel={activeTab === "merchant" || !searchQuery ? "Add Custom Category" : "Clear Search"}
                actionHref={undefined}
                onAction={
                  activeTab === "merchant" || !searchQuery
                    ? () => setShowCreateModal(true)
                    : () => setSearchQuery("")
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* CREATE CATEGORY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative border border-gray-100">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF6B00] font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Add Custom Category</h3>
                  <p className="text-xs text-gray-500">Create a category for your products</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Category Name * <span className="text-gray-400 font-normal">(max 50 chars)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Traditional Handloom Sarees, Summer Cotton"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional, max 200 chars)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  placeholder="Brief description of products belonging to this category..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF6B00] outline-none"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-2 text-[11px] text-gray-600">
                <Info className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <span>
                  This category will belong to your store and will be immediately selectable when creating or editing products.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{createLoading ? "Creating..." : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative border border-gray-100">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Edit Custom Category</h3>
                  <p className="text-xs text-gray-500">Update category details</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "inactive" })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#FF6B00] outline-none bg-white"
                >
                  <option value="active">Active (Available for products)</option>
                  <option value="inactive">Inactive (Hidden from product creation)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0 font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Delete Category?</h3>
                <p className="text-xs text-gray-500">Confirm category removal</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              Are you sure you want to delete category <strong>&ldquo;{deletingCategory.name}&rdquo;</strong>?
            </p>

            {deleteWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{deleteWarning}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{deleteLoading ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </MerchantLayout>
  );
}
