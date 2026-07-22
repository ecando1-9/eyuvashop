import { createClient } from '@/lib/supabase/server';
import AdminReviewRow from './AdminReviewRow';

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, product:products(title)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Customer Feedback</p>
        <h1 className="text-2xl font-semibold text-slate-900">Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">Approve, hide, or remove reviews.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Review</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(reviews || []).map((review) => (
                <AdminReviewRow key={review.id} review={review} />
              ))}
            </tbody>
          </table>
          {(!reviews || reviews.length === 0) && (
            <div className="text-center py-16 text-slate-400">No reviews submitted.</div>
          )}
        </div>
      </div>
    </div>
  );
}

