const fs = require('fs');
let c = fs.readFileSync('src/app/admin/products/page.tsx', 'utf8');

const regexToRemove = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">\s*<div>\s*<label className="block font-bold text-slate-700 mb-1">\s*Search Priority[\s\S]*?<\/div>\s*<\/div>/;

c = c.replace(regexToRemove, '');

// Also remove the "Search Ranking & Homepage Priority" header block completely since it has the save button, wait, the save button is needed for tags/sections/checkboxes!
// I'll keep the Save button but remove the header text if needed, or just leave the header and save button.
c = c.replace(
  /<h5 className="font-extrabold text-xs text-slate-900">Search Ranking & Homepage Priority<\/h5>/,
  '<h5 className="font-extrabold text-xs text-slate-900">Homepage Features & Ranking</h5>'
);

// We should also remove the state variables and payload fields if we want, but it's safer to just let them be 0 or fallbacks so we don't break TS.
// Wait, the user said "dont ask space for search priority and tos etags preyari sapately thos bare del store preyarity".
// So the inputs are removed.
fs.writeFileSync('src/app/admin/products/page.tsx', c);
