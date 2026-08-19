"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, Users, Shield, UserX, UserCheck, Eye, X, Mail, Phone, Calendar, CheckCircle2, ShieldAlert
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminUsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user && profile && !isAdmin) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users')
        .select('id, email, full_name, phone, avatar_url, role, is_active, created_at, deleted_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const handleToggleStatus = async (targetUser: any) => {
    const nextStatus = !targetUser.is_active;
    const actionName = nextStatus ? "Reactivate" : "Block / Suspend";
    if (!confirm(`Are you sure you want to ${actionName} ${targetUser.full_name || targetUser.email}?`)) {
      return;
    }

    try {
      setActionLoading(targetUser.id);
      const { error } = await supabase
        .from('users')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);

      if (error) throw error;
      
      await fetchUsers();
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, is_active: nextStatus });
      }
    } catch (err: any) {
      alert("Error updating user status: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (targetUser: any, newRole: string) => {
    if (!confirm(`Are you sure you want to change ${targetUser.full_name || targetUser.email}'s role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      setActionLoading(targetUser.id);
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);

      if (error) throw error;

      await fetchUsers();
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      alert(`User role updated to ${newRole.toUpperCase()} successfully!`);
    } catch (err: any) {
      alert("Error updating user role: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleDisplay = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'merchant') return 'Merchant';
    return 'User';
  };

  const filteredUsers = usersList.filter(u => {
    const term = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase() || '').includes(term) || 
      (u.email?.toLowerCase() || '').includes(term) ||
      getRoleDisplay(u.role).toLowerCase().includes(term)
    );
  });

  const stats = {
    total: usersList.length,
    active: usersList.filter(u => u.is_active).length,
    users: usersList.filter(u => u.role !== 'merchant' && u.role !== 'admin').length,
    merchants: usersList.filter(u => u.role === 'merchant').length,
    admins: usersList.filter(u => u.role === 'admin').length,
    suspended: usersList.filter(u => !u.is_active).length,
  };

  if (authLoading) return null;

  return (
    <AdminLayout title="User Accounts & Access Control" subtitle="Oversee marketplace customers, seller permissions, and security status">
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Accounts</p>
          <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Users</p>
          <p className="text-2xl font-extrabold text-blue-600">{stats.users}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Merchants</p>
          <p className="text-2xl font-extrabold text-orange-600">{stats.merchants}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Admins</p>
          <p className="text-2xl font-extrabold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">Active</p>
          <p className="text-2xl font-extrabold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold font-semibold">Suspended / Blocked</p>
          <p className="text-2xl font-extrabold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">User Details</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => {
                const roleText = getRoleDisplay(u.role);
                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name || 'No Name'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        roleText === 'Admin' 
                          ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                          : roleText === 'Merchant' 
                          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {roleText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                          Blocked / Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        View
                      </button>

                      {u.role !== 'admin' ? (
                        <button 
                          onClick={() => handleToggleStatus(u)}
                          disabled={actionLoading === u.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            u.is_active 
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' 
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === u.id ? '...' : (u.is_active ? 'Block / Suspend' : 'Reactivate')}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg border border-purple-200 inline-block">
                          Admin Protected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-[#FF6B00] shadow-md flex-shrink-0">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedUser.full_name || 'No Name Set'}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {selectedUser.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    selectedUser.role === 'merchant' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {getRoleDisplay(selectedUser.role)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.is_active ? 'Active' : 'Blocked / Suspended'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
              <div>
                <span className="text-xs text-gray-400 font-medium block">Phone Number</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {selectedUser.phone || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">Account Created</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Change User Role Section */}
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">Platform Role Privileges</h4>
                  <p className="text-xs text-purple-700 mt-0.5">Change this account's system permissions</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.role !== 'admin' ? (
                    <button
                      onClick={() => handleUpdateRole(selectedUser, 'admin')}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      👑 Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateRole(selectedUser, 'customer')}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      Demote to User
                    </button>
                  )}
                  {selectedUser.role !== 'merchant' && (
                    <button
                      onClick={() => handleUpdateRole(selectedUser, 'merchant')}
                      disabled={actionLoading === selectedUser.id}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                    >
                      Set as Merchant
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedUser.role !== 'admin' && (
                <button
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                    selectedUser.is_active
                      ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {selectedUser.is_active ? 'Block / Suspend User' : 'Reactivate User'}
                </button>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
