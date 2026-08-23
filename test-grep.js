const fs = require('fs');
const content = fs.readFileSync('src/app/merchant/categories/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('from') && line.includes('categories')) {
    console.log(i + ': ' + line.trim());
  }
});
