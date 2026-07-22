import CategoryForm from '../CategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Categories</p>
        <h1 className="text-2xl font-semibold text-slate-900">Create Category</h1>
        <p className="text-sm text-slate-500 mt-1">Add a new category to organize your products.</p>
      </div>

      <CategoryForm mode="create" />
    </div>
  );
}
