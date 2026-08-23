'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, User, Search, Eye, ArrowLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [userData, setUserData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch User Info
      const { data: uData } = await supabase.from('users').select('*').eq('id', params.id).single();
      
      // Fetch user tracking events
      const { data: eData } = await supabase.from('user_events')
        .select(`
          *,
          product:products(id, title, slug, price, images:product_images(url))
        `)
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setUserData(uData);
      setEvents(eData || []);
      setLoading(false);
    };

    fetchData();
  }, [params.id, supabase]);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-full pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      </div>
    </AdminLayout>
  );

  if (!userData) return (
    <AdminLayout>
      <div className="p-6">User not found.</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 font-bold">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
              {userData.full_name?.charAt(0) || userData.email.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{userData.full_name || 'No Name'}</h1>
              <p className="text-sm text-slate-500 mt-1">{userData.email} • Joined {new Date(userData.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FF6B00]" /> Recent Activity & Tracking
        </h2>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No tracking data recorded for this user yet.</td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="p-4 whitespace-nowrap text-slate-500 text-xs font-mono">
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {event.event_type === 'search' ? (
                      <span className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded w-fit text-xs">
                        <Search className="w-3 h-3" /> Search
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded w-fit text-xs">
                        <Eye className="w-3 h-3" /> Viewed Product
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {event.event_type === 'search' && (
                      <span className="text-slate-800 font-medium">"{event.search_term}"</span>
                    )}
                    {event.event_type === 'view_product' && event.product && (
                      <div className="flex items-center gap-3">
                        {event.product.images?.[0]?.url ? (
                          <img src={event.product.images[0].url} className="w-8 h-8 rounded object-cover border" alt="prod" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 border flex items-center justify-center text-xs">IMG</div>
                        )}
                        <a href={`/product/\${event.product.slug}`} target="_blank" className="text-blue-600 hover:underline font-medium line-clamp-1">
                          {event.product.title}
                        </a>
                      </div>
                    )}
                    {event.event_type === 'view_product' && !event.product && (
                      <span className="text-slate-400 italic">Product deleted or unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
