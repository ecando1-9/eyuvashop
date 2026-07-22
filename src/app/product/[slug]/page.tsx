import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('title, description, images')
    .eq('slug', slug)
    .single();

  if (!data) return { title: 'Product Not Found' };

  return {
    title: data.title,
    description: data.description?.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.description?.slice(0, 160),
      images: data.images?.[0] ? [{ url: data.images[0] }] : [],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) notFound();

  // Related products
  const { data: related } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('is_active', true)
    .limit(6);

  // Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profile:profiles(first_name, last_name, avatar_url)')
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <ProductDetailClient
      product={product as Product}
      related={(related || []) as Product[]}
      reviews={reviews || []}
    />
  );
}
