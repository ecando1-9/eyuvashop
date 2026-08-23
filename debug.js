const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');
const debugBlock = `
            <div className="bg-yellow-100 p-4 mb-8 max-w-[1800px] mx-auto text-black overflow-x-auto text-xs">
              <strong>DEBUG DATA:</strong>
              <p>Home Sections Count: {homeSections.length}</p>
              <pre>{JSON.stringify(homeSections, null, 2)}</pre>
            </div>
            {/* Custom Home Sections */}
`;
c = c.replace(/\{\/\* Custom Home Sections \*\/\}/, debugBlock);
fs.writeFileSync('src/app/page.tsx', c);
