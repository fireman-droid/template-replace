const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@test.com';
const PASSWORD = 'admin123';

const MARK_DATA_PATH = path.join(__dirname, '_tpl_1.json');
const INPUT_DOCX_PATH = path.join(__dirname, '..', '虚拟离婚纠纷材料.docx');

function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function extractFields(markData) {
  const fields = [];
  if (!markData?.data) return fields;

  for (const table of markData.data) {
    if (table.type !== 'table' || !table.data) continue;

    for (const row of table.data) {
      if (row.type !== 'table-row' || !row.data) continue;

      let currentCanRepeat = false;
      let currentMarkKey = '';
      let currentSubTitle = '';

      // 先找标题与重复标记
      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue;
        for (const item of col.data) {
          if (item.type === 'table-title') {
            currentCanRepeat = item.data?.canRepeatSubjectRow || false;
            currentMarkKey = item.data?.mark?.markKey || '';
            currentSubTitle = item.data?.title || '';
            break;
          }
        }
        if (currentSubTitle) break;
      }

      // 提取字段
      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue;
        for (const item of col.data) {
          if (item.type === 'field' && item.data) {
            const baseLabel = item.data.fieldLabel || '未命名';
            const shortTitle = currentSubTitle
              .replace('（自然人）', '-人')
              .replace('（法人、非法人组织）', '-法人');
            const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel;
            fields.push({
              fieldKey: item.data.fieldKey,
              fieldLabel: labelWithCategory,
              type: item.data.type || 'text',
              isMultiple: item.data.props?.isMultiple || false,
              canRepeat: currentCanRepeat,
              markKey: currentMarkKey,
              options: item.data.props?.options || []
            });
          }

          if (item.type === 'inline-fields' && item.data?.fields) {
            for (const f of item.data.fields) {
              const baseLabel = f.fieldLabel || '未命名';
              const shortTitle = currentSubTitle
                .replace('（自然人）', '-人')
                .replace('（法人、非法人组织）', '-法人');
              const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel;
              fields.push({
                fieldKey: f.fieldKey,
                fieldLabel: labelWithCategory,
                type: f.type || 'text',
                isMultiple: f.props?.isMultiple || false,
                canRepeat: currentCanRepeat,
                markKey: currentMarkKey,
                options: f.props?.options || []
              });
            }
          }
        }
      }
    }
  }

  return fields;
}

async function login() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`登录失败: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map(o => (typeof o === 'string' ? o : o?.label))
    .filter(Boolean);
}

function analyzeOptionFields(fields, resultData) {
  const optionFields = fields.filter(f => f.type === 'options');
  const report = [];

  for (const f of optionFields) {
    const options = normalizeOptions(f.options);
    const value = resultData?.[f.fieldKey];
    let match = false;

    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        match = value.some(v => options.includes(v));
      } else {
        match = options.includes(value);
      }
    }

    report.push({
      fieldKey: f.fieldKey,
      fieldLabel: f.fieldLabel,
      options,
      value,
      match
    });
  }

  return report;
}

function filterYesNoLike(report) {
  const targets = new Set(['是', '否', '了解', '不了解', '暂不确定']);
  return report.filter(r => r.options.some(o => targets.has(o)));
}

async function run() {
  if (!fs.existsSync(INPUT_DOCX_PATH)) {
    throw new Error(`未找到文件: ${INPUT_DOCX_PATH}`);
  }

  const raw = readJson(MARK_DATA_PATH);
  const markData = raw.markData || raw;
  const fields = extractFields(markData);

  const token = await login();

  const fileBuffer = fs.readFileSync(INPUT_DOCX_PATH);
  const fd = new FormData();
  fd.append('fields', JSON.stringify(fields));
  fd.append('file', new Blob([fileBuffer]), path.basename(INPUT_DOCX_PATH));

  const res = await fetch(`${BASE_URL}/ai/parse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`AI 调用失败: ${res.status} ${text}`);
  }

  const data = JSON.parse(text);
  if (!data?.success) {
    throw new Error(`AI 返回失败: ${text}`);
  }

  const report = analyzeOptionFields(fields, data.data || {});
  const yesNoReport = filterYesNoLike(report);

  const summary = {
    totalOptionsFields: report.length,
    filledOptionsFields: report.filter(r => r.value !== undefined && r.value !== null).length,
    matchedOptionsFields: report.filter(r => r.value !== undefined && r.value !== null && r.match).length,
    yesNoTotal: yesNoReport.length,
    yesNoFilled: yesNoReport.filter(r => r.value !== undefined && r.value !== null).length,
    yesNoMatched: yesNoReport.filter(r => r.value !== undefined && r.value !== null && r.match).length
  };

  const mismatches = yesNoReport.filter(r => r.value !== undefined && r.value !== null && !r.match);

  const output = {
    summary,
    yesNoSample: yesNoReport.slice(0, 20),
    yesNoMismatches: mismatches.slice(0, 20)
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
