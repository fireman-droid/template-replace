const fs = require('fs');
const xml = fs.readFileSync('信用卡纠纷/信用卡纠纷/word/document.xml', 'utf8');

const out = [];

// Extract all docfieldname attributes
const re = /docfieldname="([^"]+)"/g;
const fields = [];
let m;
while ((m = re.exec(xml)) !== null) {
  try {
    // docfieldname might be HTML-encoded
    const decoded = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const parsed = JSON.parse(decoded);
    fields.push(parsed);
  } catch(e) {
    fields.push({ raw: m[1], error: e.message });
  }
}

out.push('Total docfieldname attributes: ' + fields.length);
out.push('');

// Show first 10 in detail
fields.slice(0, 10).forEach((f, i) => {
  out.push('--- Field ' + i + ' ---');
  out.push(JSON.stringify(f, null, 2));
});

out.push('');
out.push('=== All unique keys in docfieldname ===');
const allKeys = new Set();
fields.forEach(f => {
  if (typeof f === 'object') {
    Object.keys(f).forEach(k => allKeys.add(k));
  }
});
out.push(JSON.stringify([...allKeys]));

// Check if docfieldname contains any field labels, types, or other metadata beyond "key"
out.push('');
out.push('=== Sample with all properties ===');
const richFields = fields.filter(f => Object.keys(f).length > 1);
out.push('Fields with more than just "key": ' + richFields.length);
richFields.slice(0, 5).forEach((f, i) => {
  out.push('Rich field ' + i + ': ' + JSON.stringify(f, null, 2));
});

// Also look for any mc:AlternateContent or mc:Choice context around docfieldStart
const ctxRe = /(<mc:AlternateContent[^]*?<\/mc:AlternateContent>)/g;
let altCount = 0;
let firstAlt = '';
while ((m = ctxRe.exec(xml)) !== null) {
  altCount++;
  if (altCount === 1) firstAlt = m[1].substring(0, 1000);
}
out.push('');
out.push('Total mc:AlternateContent blocks: ' + altCount);
out.push('First block (truncated):');
out.push(firstAlt);

fs.writeFileSync('_result.txt', out.join('\n'), 'utf8');
