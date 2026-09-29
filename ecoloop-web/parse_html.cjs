const fs = require('fs');
const html = fs.readFileSync('/Users/franzylmacalua/.gemini/antigravity-cli/brain/91cac298-2f53-497e-b6d0-6be60f6ccbd4/.system_generated/steps/325/content.md', 'utf8');
const text = html.replace(/<[^>]+>/g, ' ');
const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
let out = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes('allow') || lines[i].toLowerCase().includes('*')) {
    out.push(`--- Line ${i} ---`);
    out.push(lines.slice(Math.max(0, i-2), Math.min(lines.length, i+3)).join('\n'));
  }
}
fs.writeFileSync('out.txt', out.join('\n\n'));
