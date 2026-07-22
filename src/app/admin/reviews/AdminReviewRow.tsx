'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, Trash2, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';
import type { Review } from '@/types';

interface Props {
  review: Review & { product?: { title: string } };
}

export default function AdminReviewRow({ review }: Props) {
  const supabase = createClient();
  const [approved, setApproved] = useState(review.is_approved);
  const [loading, setLoading] = useState(false);

  const toggleApproval = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: !approved })
        .eq('id', review.id);
      if (error) throw error;
      setApproved(!approved);
      toast.success(approved ? 'Review hidden' : 'Review approved');
    } catch {
      toast.error('Failed to update review');
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async () => {
    if (!confirm('Delete this review?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', review.id);
      if (error) throw error;
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-3">
        <p className="font-semibold text-slate-800">{review.title || 'Review'}</p>
        <p className="text-xs text-slate-500 line-clamp-1">{review.body}</p>
      </td>
      <td className="px-5 py-3 text-slate-600 hidden md:table-cell">{review.product?.title || '-'}</td>
      <td className="px-5 py-3 text-slate-600">{review.rating}/5</td>
      <td className="px-5 py-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {approved ? 'Visible' : 'Hidden'}
        </span>
      </td>
      <td className="px-5 py-3 text-slate-500 text-xs">{formatDateTime(review.created_at)}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleApproval}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-orange-600"
          >
            {approved ? <EyeOff size={12} /> : <Check size={12} />}
            {approved ? 'Hide' : 'Approve'}
          </button>
          <button
            onClick={deleteReview}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

