import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

const homeCategories = [
  {
    id: '1',
    name: 'Premium Nighties',
    slug: 'nighties',
    image_url: 'https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156858/kalyani_night_red_color_wwljgh.jpg',
  },
  {
    id: '2',
    name: 'Langaalu',
    slug: 'langaalu',
    image_url: 'https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156853/langa_red_color_ca7qdw.jpg',
  },
  {
    id: '3',
    name: 'Women Tops',
    slug: 'tops',
    image_url: 'https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156857/tops_gdfked.jpg',
  },
  {
    id: '4',
    name: 'Petticoats',
    slug: 'petticoats',
    image_url: 'https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156856/long_piti_coate_ipbfuw.jpg',
  },
  {
    id: '5',
    name: 'Girls T-Shirts',
    slug: 'girls-tshirts',
    image_url: 'https://res.cloudinary.com/dw9oeeyt3/image/upload/w_1000,h_1000,c_fill,g_auto,q_auto,f_auto/v1773156855/girls_t_shot_an_dpant_sjl5jg.jpg',
  },
];

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-[#fffafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 font-display tracking-tight">
              Shop by Category
            </h2>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Explore authentic products from our store catalog.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ff3e6c] hover:text-[#e02a55]"
          >
            Our Collection <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {homeCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group block rounded-2xl overflow-hidden border border-slate-200/50 bg-white shadow-sm hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[4/5] bg-gray-100 w-full overflow-hidden">
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
              </div>
              <div className="p-4 text-center">
                <p className="text-sm font-bold text-slate-900">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
