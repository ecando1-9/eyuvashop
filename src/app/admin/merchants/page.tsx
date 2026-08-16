"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, CheckCircle, XCircle, Eye, AlertCircle, Building, User, Store,
  X, Ban, ShieldCheck, CreditCard, Check
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminMerchantsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionModal, setActionModal] = useState<{ open: boolean; type: 'approve' | 'reject' | 'suspend' | null }>({
    open: false, type: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = ["All", "Pending", "Active", "Suspended", "Rejected"];
  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchant_profiles")
        .select(`
          id, business_name, business_email, business_phone, verification_status, rejection_reason, created_at, approved_at,
          user:users(full_name, email, avatar_url, is_active),
          store:stores(id, name, slug, is_active, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMerchants(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchMerchants();
    }
  }, [user, isAdmin]);

  const handleUpdateStatus = async () => {
    if (!selectedMerchant || !actionModal.type) return;

    try {
      setActionLoading(true);
      
      let newStatus = actionModal.type === 'approve' ? 'approved' 
                    : actionModal.type === 'reject' ? 'rejected' 
                    : 'suspended';

      const { error } = await supabase.rpc('admin_update_merchant_status', {
        p_admin_id: user?.id,
        p_merchant_id: selectedMerchant.id,
        p_status: newStatus,
        p_rejection_reason: rejectionReason
      });

      if (error) throw error;

      await fetchMerchants();
      setActionModal({ open: false, type: null });
      setRejectionReason("");
      setSelectedMerchant(null);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    if (activeTab === "Pending" && merchant.verification_status !== "pending") return false;
    if (activeTab === "Active" && merchant.verification_status !== "approved") return false;
    if (activeTab === "Suspended" && merchant.verification_status !== "suspended") return false;
    if (activeTab === "Rejected" && merchant.verification_status !== "rejected") return false;

    if (search) {
      const q = search.toLowerCase();
      const matchName = merchant.business_name?.toLowerCase().includes(q);
      const matchEmail = merchant.business_email?.toLowerCase().includes(q);
      const matchUser = merchant.user?.full_name?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUser) return false;
    }

    return true;
  });

  const stats = {
    total: merchants.length,
    pending: merchants.filter(m => m.verification_status === "pending").length,
    active: merchants.filter(m => m.verification_status === "approved").length,
    rejected: merchants.filter(m => m.verification_status === "rejected").length,
  };

  if (authLoading) return null;

  return (
    <AdminLayout title="Merchant Management & Verification" subtitle="Review store verification applications, business credentials, and seller compliance">
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Merchants</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Verification</p>
            <p className="text-xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Sellers</p>
            <p className="text-xl font-black text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-black text-red-600 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex overflow-x-auto gap-2 w-full md:w-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab ? "bg-[#FF6B00] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search merchant or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Account Owner</th>
                  <th className="p-4">Store Profile</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading merchants...</td></tr>
                ) : filteredMerchants.length > 0 ? (
                  filteredMerchants.map((m) => {
                    const storeObj = Array.isArray(m.store) ? m.store[0] : m.store;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{m.business_name}</p>
                          <p className="text-[11px] text-slate-400">{m.business_email}</p>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{m.user?.full_name || m.user?.email || '-'}</td>
                        <td className="p-4 font-mono text-slate-600">{storeObj?.name ? `${storeObj.name} (/store/${storeObj.slug})` : 'No store yet'}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            m.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            m.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            m.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {m.verification_status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedMerchant(m)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No merchants found for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Merchant Modal */}
        {selectedMerchant && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-slate-900 text-sm">Merchant Profile Review</h3>
                <button onClick={() => { setSelectedMerchant(null); setActionModal({ open: false, type: null }); }} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {actionModal.type ? (
                  <div className="space-y-4">
                    <h4 className="font-black text-slate-900 text-sm uppercase">
                      Confirm {actionModal.type} Action
                    </h4>
                    <p className="text-slate-600">
                      Are you sure you want to {actionModal.type} <strong className="text-slate-900">{selectedMerchant.business_name}</strong>?
                    </p>

                    {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Reason (Required)</label>
                        <textarea
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide explanation to seller..."
                          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B00] outline-none"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setActionModal({ open: false, type: null })} className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateStatus}
                        disabled={actionLoading || ((actionModal.type === 'reject' || actionModal.type === 'suspend') && !rejectionReason.trim())}
                        className="px-5 py-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl font-bold disabled:opacity-50"
                      >
                        Confirm Action
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] font-black text-lg flex items-center justify-center">
                        {selectedMerchant.business_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{selectedMerchant.business_name}</h4>
                        <p className="text-slate-400">{selectedMerchant.business_email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                      <div>
                        <span className="text-slate-400 block font-semibold">Phone</span>
                        <span className="font-bold text-slate-900">{selectedMerchant.business_phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Status</span>
                        <span className="font-bold uppercase text-[#FF6B00]">{selectedMerchant.verification_status}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                      {selectedMerchant.verification_status === 'pending' && (
                        <>
                          <button onClick={() => setActionModal({ open: true, type: 'reject' })} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl">
                            Reject
                          </button>
                          <button onClick={() => setActionModal({ open: true, type: 'approve' })} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl">
                            Approve
                          </button>
                        </>
                      )}
                      {selectedMerchant.verification_status === 'approved' && (
                        <button onClick={() => setActionModal({ open: true, type: 'suspend' })} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl">
                          Suspend
                        </button>
                      )}
                      {selectedMerchant.verification_status === 'suspended' && (
                        <button onClick={() => setActionModal({ open: true, type: 'approve' })} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl">
                          Reactivate
                        </button>
                      )}
                      <button onClick={() => setSelectedMerchant(null)} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
