"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, CheckCircle, XCircle, Eye, AlertCircle, Building, User, Store,
  X, Ban, ShieldCheck, CreditCard
} from "lucide-react";

export default function AdminMerchantsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<{type: 'approve' | 'reject' | 'suspend' | null, reason: string}>({ type: null, reason: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const tabs = ["All", "Pending", "Active", "Suspended", "Rejected"];

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.from('merchant_profiles')
        .select(`
          id, business_name, business_email, business_phone, verification_status, rejection_reason, created_at, approved_at,
          user:users(full_name, email, avatar_url, is_active),
          store:stores(id, name, slug, is_active, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMerchants(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchMerchants();
    }
  }, [user]);

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
        p_rejection_reason: actionModal.reason
      });

      if (error) throw error;

      await fetchMerchants();
      setActionModal({ type: null, reason: "" });
      setSelectedMerchant(null);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = 
      m.business_name.toLowerCase().includes(search.toLowerCase()) || 
      (m.user?.email && m.user.email.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Pending") return matchesSearch && m.verification_status === "pending";
    if (activeTab === "Active") return matchesSearch && m.verification_status === "approved" && m.user?.is_active;
    if (activeTab === "Suspended") return matchesSearch && (m.verification_status === "suspended" || !m.user?.is_active);
    if (activeTab === "Rejected") return matchesSearch && m.verification_status === "rejected";
    
    return matchesSearch;
  });

  const stats = {
    total: merchants.length,
    pending: merchants.filter(m => m.verification_status === 'pending').length,
    active: merchants.filter(m => m.verification_status === 'approved' && m.user?.is_active).length,
    rejected: merchants.filter(m => m.verification_status === 'rejected').length,
  };

  if (authLoading || (loading && merchants.length === 0)) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>)}
        </div>
        <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage merchant accounts and applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Merchants</p>
              <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Approval</p>
              <h3 className="text-xl font-bold text-gray-900">{stats.pending}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Accounts</p>
              <h3 className="text-xl font-bold text-gray-900">{stats.active}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><XCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Rejected</p>
              <h3 className="text-xl font-bold text-gray-900">{stats.rejected}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs & Search */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? "border-[#FF6B00] text-[#FF6B00]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
                {tab === "Pending" && stats.pending > 0 && (
                  <span className="ml-2 bg-[#FF6B00] text-white text-xs py-0.5 px-2 rounded-full">{stats.pending}</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4 bg-gray-50 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Business Info</th>
                <th className="px-6 py-4 font-medium">Store</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Applied Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMerchants.length > 0 ? (
                filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                          {merchant.business_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{merchant.business_name}</p>
                          <p className="text-xs text-gray-500">{merchant.business_email || merchant.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {merchant.store && merchant.store.length > 0 ? (
                        <div>
                          <p className="font-medium text-gray-900">{merchant.store[0].name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${merchant.store[0].is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {merchant.store[0].status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No store created</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {merchant.verification_status === "pending" && <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-medium">Pending</span>}
                      {merchant.verification_status === "approved" && <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-medium">Active</span>}
                      {merchant.verification_status === "rejected" && <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-medium">Rejected</span>}
                      {merchant.verification_status === "suspended" && <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-medium">Suspended</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(merchant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedMerchant(merchant)}
                        className="text-[#FF6B00] hover:text-orange-700 font-medium text-sm"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No merchants found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail/Action Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Merchant Profile</h3>
              <button onClick={() => {
                setSelectedMerchant(null);
                setActionModal({ type: null, reason: "" });
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {actionModal.type ? (
                // Action Form
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    {actionModal.type === 'approve' ? 'Approve Merchant' : actionModal.type === 'reject' ? 'Reject Application' : 'Suspend Account'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    You are about to {actionModal.type} <span className="font-bold">{selectedMerchant.business_name}</span>.
                  </p>
                  
                  {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                      <textarea 
                        className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-[#FF6B00] focus:border-[#FF6B00] border"
                        rows={4}
                        placeholder={`Please provide a reason for ${actionModal.type === 'reject' ? 'rejection' : 'suspension'}...`}
                        value={actionModal.reason}
                        onChange={e => setActionModal({...actionModal, reason: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 justify-end mt-6">
                    <button 
                      onClick={() => setActionModal({ type: null, reason: "" })}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateStatus}
                      disabled={actionLoading || ((actionModal.type === 'reject' || actionModal.type === 'suspend') && !actionModal.reason)}
                      className={`px-4 py-2 text-white rounded-md ${
                        actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                      } disabled:opacity-50`}
                    >
                      {actionLoading ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              ) : (
                // Profile Details
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <div className="h-16 w-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl font-bold">
                      {selectedMerchant.business_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedMerchant.business_name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{selectedMerchant.business_email}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase tracking-wide">
                          {selectedMerchant.verification_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Info</h4>
                      <div className="space-y-3">
                        <p className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-gray-400" /> {selectedMerchant.user?.full_name}</p>
                        <p className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" /> {selectedMerchant.business_phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Store Details</h4>
                      {selectedMerchant.store && selectedMerchant.store.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-900">{selectedMerchant.store[0].name}</p>
                          <p className="text-xs text-gray-500">/{selectedMerchant.store[0].slug}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No store setup yet</p>
                      )}
                    </div>
                  </div>

                  {selectedMerchant.rejection_reason && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Previous Rejection Reason</h4>
                      <p className="text-sm text-red-600">{selectedMerchant.rejection_reason}</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-100 flex gap-3 justify-end">
                    {selectedMerchant.verification_status === 'pending' && (
                      <>
                        <button 
                          onClick={() => setActionModal({ type: 'reject', reason: "" })}
                          className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md font-medium flex items-center gap-2 hover:bg-red-100"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                        <button 
                          onClick={() => setActionModal({ type: 'approve', reason: "" })}
                          className="px-4 py-2 bg-green-600 text-white rounded-md font-medium flex items-center gap-2 hover:bg-green-700"
                        >
                          <ShieldCheck className="h-4 w-4" /> Approve
                        </button>
                      </>
                    )}
                    {selectedMerchant.verification_status === 'approved' && (
                      <button 
                        onClick={() => setActionModal({ type: 'suspend', reason: "" })}
                        className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md font-medium flex items-center gap-2 hover:bg-gray-200"
                      >
                        <Ban className="h-4 w-4" /> Suspend Account
                      </button>
                    )}
                    {selectedMerchant.verification_status === 'suspended' && (
                       <button 
                       onClick={() => setActionModal({ type: 'approve', reason: "" })}
                       className="px-4 py-2 bg-green-600 text-white rounded-md font-medium flex items-center gap-2 hover:bg-green-700"
                     >
                       <ShieldCheck className="h-4 w-4" /> Reactivate Account
                     </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
