'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Clock,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/account/EmptyState';
import { SkeletonCard } from '@/components/account/SkeletonLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  url: string;
  is_primary: boolean;
}

interface ReviewProduct {
  id: string;
  title: string;
  images: ProductImage[];
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  product: ReviewProduct | null;
}

interface AwaitingOrder {
  id: string;
  status: string;
  created_at: string;
}

interface AwaitingItem {
  id: string;
  product_id: string;
  order: AwaitingOrder | null;
  product: ReviewProduct | null;
}

type Tab = 'my-reviews' | 'awaiting';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProductImage(images: ProductImage[] | undefined): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.is_primary);
  return primary ? primary.url : images[0].url;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// StarRating display (read-only)
// ---------------------------------------------------------------------------

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sz} ${
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive StarSelector (for forms)
// ---------------------------------------------------------------------------

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-100'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-gray-600">
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card (My Reviews tab)
// ---------------------------------------------------------------------------

function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: Review;
  onEdit: (review: Review) => void;
  onDelete: (id: string) => void;
}) {
  const imgUrl = getProductImage(review.product?.images);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Product info row */}
      <div className="flex items-start gap-4 mb-4">
        <Link
          href={`/products/${review.product?.id ?? '#'}`}
          className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative block"
        >
          {imgUrl ? (
            <Image src={imgUrl} alt={review.product?.title ?? ''} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-gray-300" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/products/${review.product?.id ?? '#'}`}
            className="text-sm font-semibold text-gray-900 hover:text-[#FF6B00] transition-colors line-clamp-2 leading-snug"
          >
            {review.product?.title ?? 'Product'}
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
            <StarDisplay rating={review.rating} />
            <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(review)}
            className="p-2 rounded-xl text-gray-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-colors"
            title="Edit review"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(review.id)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review content */}
      {review.title && (
        <p className="text-sm font-semibold text-gray-800 mb-1">{review.title}</p>
      )}
      {review.body && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{review.body}</p>
      )}
      {!review.title && !review.body && (
        <p className="text-sm text-gray-400 italic">No written review</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Awaiting Review Card
// ---------------------------------------------------------------------------

function AwaitingCard({
  item,
  onWriteReview,
}: {
  item: AwaitingItem;
  onWriteReview: (item: AwaitingItem) => void;
}) {
  const imgUrl = getProductImage(item.product?.images);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
        {imgUrl ? (
          <Image src={imgUrl} alt={item.product?.title ?? ''} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product_id}`}
          className="text-sm font-semibold text-gray-900 hover:text-[#FF6B00] transition-colors line-clamp-2 leading-snug"
        >
          {item.product?.title ?? 'Product'}
        </Link>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Delivered on {formatDate(item.order?.created_at ?? '')}
        </p>
      </div>
      <button
        onClick={() => onWriteReview(item)}
        className="flex-shrink-0 bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
      >
        Write Review
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Review Modal
// ---------------------------------------------------------------------------

function EditReviewModal({
  review,
  onClose,
  onSaved,
}: {
  review: Review;
  onClose: () => void;
  onSaved: (updated: Review) => void;
}) {
  const supabase = createClient();
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title ?? '');
  const [body, setBody] = useState(review.body ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    const { data, error: err } = await supabase
      .from('reviews')
      .update({
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
        updated_at: now,
      })
      .eq('id', review.id)
      .select(
        `id, rating, title, body, created_at, updated_at,
         product:products(id, title, images:product_images(url, is_primary))`
      )
      .single();

    setSaving(false);
    if (err) {
      setError('Failed to save. Please try again.');
    } else {
      onSaved(data as unknown as Review);
    }
  }

  const imgUrl = getProductImage(review.product?.images);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Edit Review</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product context */}
        <div className="px-6 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 relative flex-shrink-0">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={review.product?.title ?? ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-700 line-clamp-1">
            {review.product?.title}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <StarSelector value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarise your experience"
              maxLength={120}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
              Review
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share what you liked or disliked…"
              rows={4}
              maxLength={2000}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{body.length}/2000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-bold text-white bg-[#FF6B00] hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[96px]"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Write Review Modal (Awaiting tab)
// ---------------------------------------------------------------------------

function WriteReviewModal({
  item,
  userId,
  onClose,
  onSubmitted,
}: {
  item: AwaitingItem;
  userId: string;
  onClose: () => void;
  onSubmitted: (productId: string) => void;
}) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const imgUrl = getProductImage(item.product?.images);

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from('reviews').insert({
      user_id: userId,
      product_id: item.product_id,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    });

    setSubmitting(false);
    if (err) {
      setError('Failed to submit. Please try again.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        onSubmitted(item.product_id);
      }, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Write a Review</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Review Submitted!</h3>
            <p className="text-sm text-gray-500">Thank you for sharing your feedback.</p>
          </div>
        ) : (
          <>
            {/* Product context */}
            <div className="px-6 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative flex-shrink-0">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={item.product?.title ?? ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                  {item.product?.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Delivered {formatDate(item.order?.created_at ?? '')}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <StarSelector value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Review Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarise your experience"
                  maxLength={120}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                  Your Review
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you like or dislike? How was the quality?"
                  rows={4}
                  maxLength={2000}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition resize-none"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{body.length}/2000</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#FF6B00] hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px]"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  deleting,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Delete Review?</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          This action cannot be undone. Your review will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Skeleton Loader
// ---------------------------------------------------------------------------

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-200 rounded-xl" />
              <div className="w-8 h-8 bg-gray-200 rounded-xl" />
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>('my-reviews');

  // My Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Awaiting Reviews state
  const [awaitingItems, setAwaitingItems] = useState<AwaitingItem[]>([]);
  const [awaitingLoading, setAwaitingLoading] = useState(true);
  const [awaitingError, setAwaitingError] = useState<string | null>(null);

  // Modal state
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [writingItem, setWritingItem] = useState<AwaitingItem | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch my reviews
  // ---------------------------------------------------------------------------

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    try {
      setReviewsLoading(true);
      setReviewsError(null);

      // 1. Try nested query
      const { data, error } = await supabase
        .from('reviews')
        .select(
          `id, rating, title, body, created_at, updated_at,
           product:products(id, title, images:product_images(url, is_primary))`
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews((data as unknown as Review[]) ?? []);
        return;
      }

      // 2. Fallback: Direct reviews query
      const { data: rawReviews, error: rawErr } = await supabase
        .from('reviews')
        .select('id, rating, title, body, created_at, updated_at, product_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rawErr) {
        setReviews([]);
        return;
      }

      if (!rawReviews || rawReviews.length === 0) {
        setReviews([]);
        return;
      }

      const productIds = rawReviews.map((r) => r.product_id).filter(Boolean);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, title, images:product_images(url, is_primary)')
        .in('id', productIds);

      const productMap = new Map((productsData || []).map((p: any) => [p.id, p]));

      const formatted = rawReviews.map((r) => ({
        ...r,
        product: productMap.get(r.product_id) || null,
      }));

      setReviews(formatted as unknown as Review[]);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [user, supabase]);

  // ---------------------------------------------------------------------------
  // Fetch awaiting reviews
  // ---------------------------------------------------------------------------

  const fetchAwaiting = useCallback(async () => {
    if (!user) return;
    try {
      setAwaitingLoading(true);
      setAwaitingError(null);

      // Fetch already-reviewed product IDs
      const { data: reviewedData } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('user_id', user.id);

      const reviewedProductIds = new Set(
        (reviewedData ?? []).map((r: { product_id: string }) => r.product_id)
      );

      // Fetch delivered order items
      const { data, error } = await supabase
        .from('order_items')
        .select(
          `id, product_id,
           order:orders!inner(id, status, created_at),
           product:products(id, title, images:product_images(url, is_primary))`
        )
        .eq('order.user_id', user.id)
        .eq('order.status', 'delivered');

      if (!error && data) {
        const items = (data as unknown as AwaitingItem[]) ?? [];
        const seen = new Set<string>();
        const filtered = items.filter((item) => {
          if (reviewedProductIds.has(item.product_id)) return false;
          if (seen.has(item.product_id)) return false;
          seen.add(item.product_id);
          return true;
        });
        setAwaitingItems(filtered);
      } else {
        setAwaitingItems([]);
      }
    } catch {
      setAwaitingItems([]);
    } finally {
      setAwaitingLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReviews();
      fetchAwaiting();
    }
  }, [authLoading, user, fetchReviews, fetchAwaiting]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleEditSaved(updated: Review) {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingReview(null);
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    const { error } = await supabase.from('reviews').delete().eq('id', confirmDeleteId);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== confirmDeleteId));
    }
  }

  function handleReviewSubmitted(productId: string) {
    setWritingItem(null);
    setAwaitingItems((prev) => prev.filter((i) => i.product_id !== productId));
    fetchReviews();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ReviewSkeleton />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'my-reviews', label: 'My Reviews', count: reviews.length },
    { id: 'awaiting', label: 'Awaiting Review', count: awaitingItems.length },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your product reviews and share your experiences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[#FF6B00] text-[#FF6B00]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-orange-100 text-[#FF6B00]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: My Reviews ─────────────────────────────────────────────── */}
      {activeTab === 'my-reviews' && (
        <>
          {reviewsLoading ? (
            <ReviewSkeleton />
          ) : reviewsError ? (
            <div className="bg-red-50 text-red-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {reviewsError}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Reviews Yet"
              description="You haven't reviewed any products yet. Shop and share your experience!"
              actionLabel="Shop Now"
              actionHref="/products"
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onEdit={setEditingReview}
                  onDelete={(id) => setConfirmDeleteId(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Awaiting Review ─────────────────────────────────────────── */}
      {activeTab === 'awaiting' && (
        <>
          {awaitingLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : awaitingError ? (
            <div className="bg-red-50 text-red-700 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              {awaitingError}
            </div>
          ) : awaitingItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="All Caught Up!"
              description="You've reviewed all your delivered products. Keep shopping to share more feedback."
              actionLabel="Continue Shopping"
              actionHref="/products"
            />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                {awaitingItems.length} product
                {awaitingItems.length !== 1 ? 's' : ''} waiting for your review
              </p>
              {awaitingItems.map((item) => (
                <AwaitingCard key={item.id} item={item} onWriteReview={setWritingItem} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSaved={handleEditSaved}
        />
      )}

      {confirmDeleteId && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDeleteId(null)}
          deleting={deletingId === confirmDeleteId}
        />
      )}

      {writingItem && user && (
        <WriteReviewModal
          item={writingItem}
          userId={user.id}
          onClose={() => setWritingItem(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
