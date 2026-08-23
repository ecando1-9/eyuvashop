const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add imports for HomeSection
content = content.replace(
  /import \{ Product, Banner, Category, Store \} from '@\/types\/database';/,
  `import { Product, Banner, Category, Store, HomeSection } from '@/types/database';`
);

// Update types and state
if (!content.includes('const [homeSections, setHomeSections]')) {
  content = content.replace(
    /const \[stores, setStores\] = useState<any\[\]>\(\[\]\);/,
    `const [stores, setStores] = useState<any[]>([]);\n  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);`
  );
}

// Update data fetching
content = content.replace(
  /const \[bannersRes, categoriesRes, productsRes, storesRes\] = await Promise\.all\(\[/,
  `const [bannersRes, categoriesRes, productsRes, storesRes, homeSectionsRes] = await Promise.all([`
);

content = content.replace(
  /supabase\.from\('stores'\)\.select\('\*'\)\.eq\('is_active', true\)\.limit\(8\)/,
  `supabase.from('stores').select('*').eq('is_active', true).limit(8),\n          supabase.from('home_sections').select('*, products:home_section_products(product:products(*, images:product_images(*)))').eq('is_active', true).order('display_order', { ascending: true })`
);

content = content.replace(
  /if \(storesRes\.data\) setStores\(storesRes\.data\);/,
  `if (storesRes.data) setStores(storesRes.data);\n        if (homeSectionsRes?.data) {\n          const formattedSections = homeSectionsRes.data.map((section: any) => ({\n            ...section,\n            products: section.products?.map((p: any) => p.product).filter(Boolean) || []\n          }));\n          setHomeSections(formattedSections);\n        }`
);

// Replace grid with horizontal scrolling for Categories
content = content.replace(
  /<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 md:gap-6">/,
  `<div className="flex overflow-x-auto snap-x scrollbar-hide gap-4 md:gap-6 pb-4">`
);
content = content.replace(
  /className="flex flex-col items-center group"/g,
  `className="flex flex-col items-center group flex-shrink-0 snap-start w-20 md:w-24"`
);

// Replace grid with horizontal scrolling for Products
content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">/,
  `<div className="flex overflow-x-auto snap-x scrollbar-hide gap-4 pb-6">`
);
// We also need to add flex-shrink-0 to the ProductCard, but ProductCard is a component.
// I will wrap ProductCard in a div.
content = content.replace(
  /\{products\.map\(\(product\) => \(\s*<ProductCard key=\{product\.id\} product=\{product\} \/>\s*\)\)\}/,
  `{products.map((product) => (\n                      <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">\n                        <ProductCard product={product} />\n                      </div>\n                    ))}`
);

// Replace grid with horizontal scrolling for Stores
content = content.replace(
  /<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">/,
  `<div className="flex overflow-x-auto snap-x scrollbar-hide gap-6 pb-6">`
);
content = content.replace(
  /href=\{`\/store\/\$\{store\.slug\}`\} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group block"/,
  `href={\`/store/\${store.slug}\`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group block flex-shrink-0 snap-start w-[280px] md:w-[320px]"`
);


// Add Custom Home Sections rendering after Featured Stores
const homeSectionsRender = `
            {/* Custom Home Sections */}
            {homeSections.map(section => section.products && section.products.length > 0 && (
              <section key={section.id} className="max-w-7xl mx-auto px-4 mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{section.title}</h2>
                  {section.description && (
                    <p className="text-sm text-gray-500 hidden md:block">{section.description}</p>
                  )}
                </div>
                <div className="flex overflow-x-auto snap-x scrollbar-hide gap-4 pb-6">
                  {section.products.map((product: any) => (
                    <div key={product.id} className="flex-shrink-0 snap-start w-[240px] md:w-[280px]">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
`;

content = content.replace(
  /\{\/\* Why Choose Us \/ Helping Text \*\/\}/,
  `${homeSectionsRender}\n            {/* Why Choose Us / Helping Text */}`
);

fs.writeFileSync('src/app/page.tsx', content);
