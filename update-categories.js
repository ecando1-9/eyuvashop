const fs = require('fs');
let content = fs.readFileSync('src/app/categories/page.tsx', 'utf8');

// 1. Remove shell imports and components
content = content.replace(/import\s+\{\s*Header\s*\}\s+from\s+['"].*Header['"];?/g, '');
content = content.replace(/import\s+\{\s*Footer\s*\}\s+from\s+['"].*Footer['"];?/g, '');
content = content.replace(/import\s+\{\s*BottomNav\s*\}\s+from\s+['"].*BottomNav['"];?/g, '');
content = content.replace(/<Header\s*\/>/g, '');
content = content.replace(/<Footer\s*\/>/g, '');
content = content.replace(/<BottomNav\s*\/>/g, '');

// 2. Add import
if (!content.includes('getDefaultCategoryImage')) {
  content = content.replace(
    /import \{ Grid, Search, ChevronRight, Sparkles \} from 'lucide-react';/,
    `import { Grid, Search, ChevronRight, Sparkles } from 'lucide-react';\nimport { getDefaultCategoryImage } from '@/lib/utils';`
  );
}

// 3. Replace image rendering logic exactly
content = content.replace(
  /\{category\.image_url \? \([\s\S]*?<Image[\s\S]*?\/>[\s\S]*?\) : \([\s\S]*?<Sparkles[\s\S]*?\/>[\s\S]*?\)\}/g,
  `<Image src={category.image_url || getDefaultCategoryImage(category.name)} alt={category.name} fill className="object-cover" sizes="80px" />`
);

fs.writeFileSync('src/app/categories/page.tsx', content);
