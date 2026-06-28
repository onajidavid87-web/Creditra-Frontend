const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const cssFiles = walk('./src');

cssFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Find all @media (prefers-reduced-motion: reduce) { ... }
  // Since CSS blocks can't be easily parsed with regex, we'll do it manually.
  
  let i = 0;
  while (true) {
    const mediaQuery = '@media (prefers-reduced-motion: reduce) {';
    // some files might have @media (max-width: 767px) and (prefers-reduced-motion: reduce)
    // Let's use a regex to find the start of the block
    let searchContent = newContent.slice(i);
    const match = searchContent.match(/@media\s*\([^\{]*prefers-reduced-motion:\s*reduce[^\{]*\{\s*/);
    if (!match) break;
    
    let startIndex = i + match.index + match[0].length;
    let braceCount = 1;
    let endIndex = startIndex;
    
    while (braceCount > 0 && endIndex < newContent.length) {
      if (newContent[endIndex] === '{') braceCount++;
      if (newContent[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    let innerContent = newContent.slice(startIndex, endIndex - 1);
    
    // Now we prefix the selectors in innerContent with [data-motion="reduced"]
    // CSS rules look like "selector { ... }"
    // Split by { and }
    // Actually, we can just split by "}" to get blocks, then split by "{" to get selector and rules
    let newInnerContent = '';
    
    const blocks = innerContent.split('}');
    for (let b of blocks) {
      if (!b.trim()) continue;
      const parts = b.split('{');
      if (parts.length === 2) {
        let selectors = parts[0].split(',').map(s => {
          let sel = s.trim();
          if (sel === '*, ::before, ::after') return '[data-motion="reduced"] *, [data-motion="reduced"] *::before, [data-motion="reduced"] *::after';
          if (sel === '*' || sel === '::before' || sel === '::after') return `[data-motion="reduced"] ${sel.replace('::', '*::')}`;
          return `[data-motion="reduced"] ${sel}`;
        }).join(',\n');
        
        // Handle global rules from index.css
        if (parts[0].includes('::before')) {
           selectors = parts[0].split(',').map(s => {
             let sel = s.trim();
             if (sel === '*' || sel === '::before' || sel === '::after') {
                 if(sel.startsWith('::')) return `[data-motion="reduced"] *${sel}`;
                 return `[data-motion="reduced"] ${sel}`;
             }
             return `[data-motion="reduced"] ${sel}`;
           }).join(',\n');
        }
        
        newInnerContent += selectors + ' {' + parts[1] + '}\n';
      }
    }
    
    if (newInnerContent.trim() && !content.includes(newInnerContent.trim())) {
      newContent += '\n/* Reduced Motion Override */\n' + newInnerContent + '\n';
    }
    
    i = endIndex;
  }
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
