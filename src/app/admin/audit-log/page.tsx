"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Activity, Download, RefreshCw, FileText, Shield, User, Clock } from "lucide-react";

export default function AdminAuditLogPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || user?.email === 'eyuvashop@gmail.com';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, profile, authLoading, isAdmin, router]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('audit_logs')
        .select(`
          id, actor_role, action, entity_type, entity_id, metadata, created_at,
          actor:users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) fetchLogs();
  }, [user, isAdmin]);

  const exportCSV = () => {
    const headers = ['Date', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity ID'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.actor?.full_name || l.actor?.email || 'System',
      l.actor_role,
      l.action,
      l.entity_type,
      l.entity_id
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (authLoading) return null;

  return (
    <AdminLayout 
      title="Audit Trail & Database Security Logs" 
      subtitle="Complete chronological audit records of administrative actions, status updates, and database modifications"
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button 
            onClick={exportCSV} 
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor / Responsible</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading audit trail...</td></tr>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        <span className="font-mono">{new Date(log.created_at).toLocaleString()}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {log.actor?.full_name || log.actor?.email || 'System Trigger'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.actor_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          log.actor_role === 'merchant' ? 'bg-orange-100 text-[#FF6B00]' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.actor_role || 'system'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{log.entity_type}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-400">{log.entity_id ? log.entity_id.slice(0, 13) + '...' : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No audit logs recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
