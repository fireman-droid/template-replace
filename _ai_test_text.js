const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@test.com';
const PASSWORD = 'admin123';

const SAMPLE_TEXT = `
1. 是否了解调解作为非诉讼纠纷解决方式，能及时、高效、低成本、不伤和气地解决纠纷
→ 了解

2. 是否了解先行调解解决纠纷的好处
1) 立案后选择先行调解的，可以很快启动调解程序。如不同意调解，法院将依程序开庭审理案件，但可能需要经过较长一段时间的排期等待，且审理、执行周期相对较长。
→ 了解
2) 选择先行调解，调解成功且自动履行的免交诉讼费用，申请司法确认的不交纳诉讼费用，要求出具调解书的减半交纳诉讼费用。
→ 了解
3) 首次调解不成功，但仍有继续调解意愿的，可以选择更换调解组织和调解员再进行调解。调解无法达成一致意见的，法院将依程序排期开庭。
→ 了解
4) 依照法律规定，调解具有保密性要求，调解过程不公开，调解协议未经当事人同意不得公开。
→ 了解
5) 调解达成的协议具有法律效力，可以依照法律规定申请司法确认，具有强制执行效力。
→ 了解

3. 是否考虑先行调解
→ 是
`.trim();

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((o) => (typeof o === 'string' ? o : o?.label))
    .filter(Boolean);
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

      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue;
        for (const item of col.data) {
          if (item.type === 'field' && item.data) {
            const baseLabel = item.data.fieldLabel || '未命名';
            const shortTitle = currentSubTitle
              .replace('（自然人）', '-人')
              .replace('（法人、非法人组织）', '-法人');
            const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel;
            const optionLabels = normalizeOptions(item.data.props?.options || []);
            fields.push({
              fieldKey: item.data.fieldKey,
              fieldLabel: labelWithCategory,
              type: item.data.type || 'text',
              isMultiple: item.data.props?.isMultiple || false,
              canRepeat: currentCanRepeat,
              markKey: currentMarkKey,
              options: optionLabels
            });
          }
          if (item.type === 'inline-fields' && item.data?.fields) {
            for (const f of item.data.fields) {
              const baseLabel = f.fieldLabel || '未命名';
              const shortTitle = currentSubTitle
                .replace('（自然人）', '-人')
                .replace('（法人、非法人组织）', '-法人');
              const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel;
              const optionLabels = normalizeOptions(f.props?.options || []);
              fields.push({
                fieldKey: f.fieldKey,
                fieldLabel: labelWithCategory,
                type: f.type || 'text',
                isMultiple: f.props?.isMultiple || false,
                canRepeat: currentCanRepeat,
                markKey: currentMarkKey,
                options: optionLabels
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
  if (!res.ok) throw new Error(`登录失败: ${res.status}`);
  const data = await res.json();
  return data.token;
}

async function getDivorceTemplate(token) {
  const res = await fetch(`${BASE_URL}/admin/templates?page=1&pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`获取模板列表失败: ${res.status}`);
  const data = await res.json();
  const list = data.list || [];
  const found = list.find((t) => String(t.name || '').includes('离婚')) || list[0];
  if (!found?.id) throw new Error('未找到模板');

  const detail = await fetch(`${BASE_URL}/admin/templates/${found.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!detail.ok) throw new Error(`获取模板详情失败: ${detail.status}`);
  const tpl = await detail.json();
  const markData = tpl.markData || tpl.mark_data || {};
  return { id: found.id, name: found.name, markData };
}

function pickQuestionFields(fields, aiData) {
  const targets = [
    '是否了解调解作为非诉讼纠纷解决方式',
    '1.立案后选择先行调解的',
    '2.选择先行调解',
    '3.首次调解不成功',
    '4.依照法律规定，调解具有保密性要求',
    '5.调解达成的协议具有法律效力',
    '是否考虑先行调解'
  ];

  const rows = [];
  for (const t of targets) {
    const field = fields.find((f) => f.fieldLabel.includes(t));
    rows.push({
      target: t,
      fieldKey: field?.fieldKey || '-',
      fieldLabel: field?.fieldLabel || '-',
      options: field?.options || [],
      value: field ? aiData?.[field.fieldKey] : undefined
    });
  }
  return rows;
}

async function run() {
  const token = await login();
  const tpl = await getDivorceTemplate(token);
  const fields = extractFields(tpl.markData);

  const fd = new FormData();
  fd.append('fields', JSON.stringify(fields));
  fd.append('text', SAMPLE_TEXT);

  const res = await fetch(`${BASE_URL}/ai/parse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`AI 调用失败: ${res.status} ${body}`);
  const data = JSON.parse(body);
  if (!data?.success) throw new Error(`AI 返回失败: ${body}`);

  const picked = pickQuestionFields(fields, data.data || {});
  const output = {
    template: { id: tpl.id, name: tpl.name },
    sampleTextPreview: SAMPLE_TEXT.split('\n').slice(0, 6).join('\n'),
    results: picked
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
