"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Search, Users, Shield, UserX, UserCheck, MoreVertical, ShieldAlert
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

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
    if (user && user.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, role: string) => {
    // Prevent admins from suspending themselves or other admins easily without specific checks, but for this basic UI:
    if (role === 'admin' && userId === user?.id) {
      alert("You cannot suspend your own account.");
      return;
    }

    try {
      setActionLoading(userId);
      const { error } = await supabase.from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        actor_role: 'admin',
        action: !currentStatus ? 'REACTIVATE_USER' : 'SUSPEND_USER',
        entity_type: 'user',
        entity_id: userId
      });

      await fetchUsers();
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const term = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
  });

  const stats = {
    total: usersList.length,
    active: usersList.filter(u => u.is_active).length,
    customers: usersList.filter(u => u.role === 'customer').length,
    merchants: usersList.filter(u => u.role === 'merchant').length,
    admins: usersList.filter(u => u.role === 'admin').length,
    suspended: usersList.filter(u => !u.is_active).length,
  };

  if (authLoading || (loading && usersList.length === 0)) {
    return <div className="p-6">Loading users...</div>; // Simplify for brevity in code generation
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500">Manage customers, merchants, and admins</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase">Customers</p>
          <p className="text-xl font-bold text-blue-600">{stats.customers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase">Merchants</p>
          <p className="text-xl font-bold text-orange-600">{stats.merchants}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase">Admins</p>
          <p className="text-xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-xs text-gray-500 uppercase">Suspended</p>
          <p className="text-xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.full_name || 'No Name'}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                      ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        u.role === 'merchant' ? 'bg-orange-100 text-orange-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active ? (
                      <span className="flex items-center text-green-600 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Active</span>
                    ) : (
                      <span className="flex items-center text-red-600 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Suspended</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleStatus(u.id, u.is_active, u.role)}
                      disabled={actionLoading === u.id || (u.role === 'admin' && u.id === user?.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                        u.is_active 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === u.id ? '...' : (u.is_active ? 'Suspend' : 'Reactivate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
