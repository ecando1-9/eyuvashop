import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Product, Category } from '@/types';
import ShopLayout from './ShopLayout';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description: 'Discover thousands of products across all categories at the best prices.',
};

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
}

async function getShopData(params: SearchParams) {
  const supabase = await createClient();
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })
    .eq('is_active', true);

  if (params.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  if (params.minPrice) query = query.gte('price', parseInt(params.minPrice));
  if (params.maxPrice) query = query.lte('price', parseInt(params.maxPrice));

  if (params.sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (params.sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (params.sort === 'newest') query = query.order('created_at', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(from, from + pageSize - 1);

  const { data, count } = await query;

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('position');

  return {
    products: (data || []) as Product[],
    categories: (categories || []) as Category[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

interface ShopPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const data = await getShopData(params);

  return <ShopLayout {...data} searchParams={params} />;
}
