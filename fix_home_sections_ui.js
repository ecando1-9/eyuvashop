const fs = require('fs');
let c = fs.readFileSync('src/app/admin/products/page.tsx', 'utf8');

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
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">`;

c = c.replace(/<\/div>\s*<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">/, sectionsUI);

if (!c.includes('Layers,')) {
  c = c.replace(/Tag, /g, 'Tag, Layers, ');
}

fs.writeFileSync('src/app/admin/products/page.tsx', c);
