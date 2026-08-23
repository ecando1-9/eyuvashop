const fs = require('fs');
let c = fs.readFileSync('src/app/admin/products/page.tsx', 'utf8');

// Add state for home sections
c = c.replace(
  'const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);',
  'const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);\n  const [allHomeSections, setAllHomeSections] = useState<any[]>([]);\n  const [activeSectionIds, setActiveSectionIds] = useState<string[]>([]);'
);

// Fetch home sections
c = c.replace(
  /const \{ data: storesData \} = await supabase\.from\('stores'\)\.select\('id, name'\)\.order\('name'\);\n\s*if \(storesData\) setAllStores\(storesData\);/,
  `const { data: storesData } = await supabase.from('stores').select('id, name').order('name');
        if (storesData) setAllStores(storesData);
        const { data: sectionsData } = await supabase.from('home_sections').select('*');
        if (sectionsData) setAllHomeSections(sectionsData);`
);

// In fetchProducts, we need to get home_section_products too, but we can just fetch them in handleOpenProduct
c = c.replace(
  /setActiveLabelIds\(p\.label_assignments\?\.map\(\(la: any\) => la\.label_id\) \|\| \[\]\);\n\s*\};/,
  `setActiveLabelIds(p.label_assignments?.map((la: any) => la.label_id) || []);
      // Fetch sections for this product
      supabase.from('home_section_products').select('section_id').eq('product_id', p.id).then(({data}) => {
        if(data) setActiveSectionIds(data.map((s: any) => s.section_id));
      });
    };`
);

// In handleSaveRankings, sync the section ids
c = c.replace(
  /await supabase\.from\('product_label_assignments'\)\.insert\(inserts\);\n\s*\}/,
  `await supabase.from('product_label_assignments').insert(inserts);
          }
          
          await supabase.from('home_section_products').delete().eq('product_id', selectedProduct.id);
          if (activeSectionIds.length > 0) {
            const secInserts = activeSectionIds.map(section_id => ({ product_id: selectedProduct.id, section_id }));
            await supabase.from('home_section_products').insert(secInserts);
          }`
);

// Add the Home Sections UI block below the Tags block
const sectionsUI = `                  </div>

                  {/* Assign to Manual Home Sections */}
                  <div className="bg-slate-50 p-4 border-t border-slate-100">
                    <h5 className="font-extrabold text-xs text-slate-900 mb-2 flex items-center gap-1"><Layers className="w-4 h-4 text-slate-400" /> Assign to Home Sections</h5>
                    <p className="text-[10px] text-slate-500 mb-3">Add this product to manual collections on the Home Page (e.g., "For Women", "Skin Care Essentials").</p>
                    <div className="flex flex-col gap-2">
                      {allHomeSections.map(section => {
                        const isSelected = activeSectionIds.includes(section.id);
                        return (
                          <label key={section.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all hover:bg-white" style={{ borderColor: isSelected ? '#FF6B00' : '#e2e8f0', backgroundColor: isSelected ? '#fff7ed' : 'transparent' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => setActiveSectionIds(prev => e.target.checked ? [...prev, section.id] : prev.filter(id => id !== section.id))}
                              className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                            />
                            <span className="font-bold text-xs text-slate-800">{section.title}</span>
                          </label>
                        );
                      })}
                      {allHomeSections.length === 0 && <span className="text-xs text-slate-400 italic">No Home Sections created. Go to the Home Sections tab to create some.</span>}
                    </div>
                  </div>`;

c = c.replace(
  /<\/div>\s*\{\/\* Assign Custom Tags\(Labels\) \*\/\}/, // This is not what's there
  'wait let me replace properly'
);
fs.writeFileSync('src/app/admin/products/page.tsx', c);
