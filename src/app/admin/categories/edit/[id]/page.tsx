import { createClient } from '@/lib/supabase/server';
import CategoryForm from '../../CategoryForm';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug, description, image_url, position')
    .eq('id', params.id)
    .single();

  if (!category) {
    return (
      <div className="space-y-4">
        <p className="text-slate-500">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Categories</p>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Category</h1>
        <p className="text-sm text-slate-500 mt-1">Update category details and display order.</p>
      </div>

      <CategoryForm
        mode="edit"
        initialData={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url,
          position: category.position,
        }}
      />
    </div>
  );
}
