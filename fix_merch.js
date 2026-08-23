const fs = require('fs');
let c = fs.readFileSync('src/app/admin/merchants/page.tsx', 'utf8');

c = c.replace(
  /const storeObj = Array\.isArray\(selectedMerchant\.store\) \? selectedMerchant\.store\[0\] : selectedMerchant\.store;/g,
  'const sObj = Array.isArray(selectedMerchant.store) ? selectedMerchant.store[0] : selectedMerchant.store;'
);
c = c.replace(
  /if \(storeObj\) \{[\s\S]*?await supabase\.from\('stores'\)\.update\(\{ priority_level: newPriority \}\)\.eq\('merchant_id', selectedMerchant\.id\);[\s\S]*?\}/,
  `if (sObj) { await supabase.from('stores').update({ priority_level: newPriority }).eq('merchant_id', selectedMerchant.id); }`
);
fs.writeFileSync('src/app/admin/merchants/page.tsx', c);
