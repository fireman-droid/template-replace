const fs = require('fs');
const xml = fs.readFileSync('e:/前端好玩的东西/templateReplace/template-replace/信用卡纠纷/信用卡纠纷/word/document.xml', 'utf8');
const re = /w:bookmarkStart[^>]*?w:name="([^"]+)"/g;
const arr = [];
let m;
while ((m = re.exec(xml)) !== null) arr.push(m[1]);
console.log('Total bookmarks: ' + arr.length);
arr.slice(0, 30).forEach(function(n, i) { console.log(i + ': ' + n); });

// Check for wpsCustomData
const wpsRe = /wpsCustomData/g;
const wpsCount = (xml.match(wpsRe) || []).length;
console.log('\nwpsCustomData occurrences: ' + wpsCount);

// Check for customXml or structured doc tags
const sdtRe = /w:sdt/g;
const sdtCount = (xml.match(sdtRe) || []).length;
console.log('w:sdt (structured doc tag) occurrences: ' + sdtCount);

// Check for any UUID-like patterns in the XML
const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const uuids = [];
while ((m = uuidRe.exec(xml)) !== null) uuids.push(m[0]);
console.log('\nUUID-like patterns found: ' + uuids.length);
// Show unique UUIDs
const unique = [...new Set(uuids)];
console.log('Unique UUIDs: ' + unique.length);
unique.slice(0, 30).forEach(function(u, i) { console.log(i + ': ' + u); });

// Check markData for comparison
const markJson = fs.readFileSync('e:/前端好玩的东西/templateReplace/template-replace/信用卡纠纷/markData.json', 'utf8');
const markUuids = [];
const markRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
while ((m = markRe.exec(markJson)) !== null) markUuids.push(m[0]);
const markUnique = [...new Set(markUuids)];
console.log('\nmarkData.json unique UUIDs: ' + markUnique.length);

// Check overlap
const docSet = new Set(unique.map(u => u.toLowerCase()));
const markSet = new Set(markUnique.map(u => u.toLowerCase()));
let overlap = 0;
markSet.forEach(u => { if (docSet.has(u)) overlap++; });
console.log('Overlap (markData UUIDs found in docx): ' + overlap + ' / ' + markSet.size);
