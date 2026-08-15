"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Download, RefreshCw, FileText } from "lucide-react";

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
    if (user && user.role === "admin") fetchLogs();
  }, [user]);

  const exportCSV = () => {
    const headers = ['Date', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity ID'];
    const rows = logs.map(l => [
      new Date(l.created_at).toISOString(),
      l.actor?.email || 'System',
      l.actor_role,
      l.action,
      l.entity_type,
      l.entity_id
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString()}.csv`;
    a.click();
  };

  if (authLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Activity className="h-6 w-6 text-[#FF6B00]" /> Audit Logs</h1>
          <p className="text-sm text-gray-500">System activity and administrative actions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} className="p-2 border rounded-md hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-50 rounded"></div>)}
          </div>
        ) : (
          <div className="relative border-l border-gray-200 ml-3 space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#FF6B00] border-2 border-white ring-2 ring-orange-100"></div>
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{log.actor?.full_name || log.actor?.email || 'System'}</span>
                    <span className="text-xs bg-gray-100 px-1.5 rounded uppercase">{log.actor_role}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 font-medium">{log.action}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {log.entity_type} ({log.entity_id?.substring(0,8)}...)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
