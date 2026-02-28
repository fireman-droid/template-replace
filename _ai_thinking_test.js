/**
 * AI 思考过程测试脚本（Kimi API）
 *
 * 功能：调用 Kimi AI 智能填充接口，捕获并打印思考过程（thinking）
 *
 * 使用方法：
 * 1. 确保后端服务运行在 http://localhost:5000
 * 2. 确保 .env 文件中配置了 KIMI_API_KEY
 * 3. 运行: node _ai_thinking_test.js
 *
 * 输出：
 * - 实时打印思考过程
 * - 保存完整思考内容到 _thinking_output.txt
 *
 * 注意：
 * - Kimi 使用 kimi-k2-turbo-preview 模型
 * - 支持 reasoning_content 字段（思考过程）
 * - 如需测试 Claude，修改第 227 行为 'claude'
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置
// ============================================================================

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@test.com';
const PASSWORD = 'admin123';

// 模板数据文件路径
const MARK_DATA_PATH = path.join(__dirname, '_tpl_1.json');

// 测试案情文本（可以修改为你想测试的内容）
const TEST_CASE_TEXT = `
原告张三，男，1985年3月15日出生，汉族，住北京市朝阳区建国路88号。
被告李四，女，1987年6月20日出生，汉族，住北京市海淀区中关村大街1号。

案情：
2023年1月1日，原告张三与被告李四签订借款合同，约定借款金额为人民币50万元，
借款期限为一年，年利率为6%，到期日为2024年1月1日。
借款到期后，被告李四未按约定归还借款本金及利息，经原告多次催讨无果。
现原告诉至法院，请求判令被告归还借款本金50万元及利息3万元。
`;

// 输出文件路径
const OUTPUT_FILE = path.join(__dirname, '_thinking_output.txt');

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 读取 JSON 文件（处理 BOM）
 */
function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

/**
 * 从 markData 提取字段列表
 */
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

            const optionLabels = (item.data.props?.options || [])
              .map(opt => (typeof opt === 'string' ? opt : opt?.label))
              .filter(Boolean);

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

              const optionLabels = (f.props?.options || [])
                .map(opt => (typeof opt === 'string' ? opt : opt?.label))
                .filter(Boolean);

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

/**
 * 登录获取 token
 */
async function login() {
  console.log('🔐 正在登录...');
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
  console.log('✅ 登录成功\n');
  return data.token;
}

/**
 * 解析 SSE 流式响应
 */
async function parseSSEStream(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      try {
        const data = JSON.parse(line.slice(6));
        onEvent(data);
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  // 处理剩余数据
  if (buffer.trim().startsWith('data: ')) {
    try {
      const data = JSON.parse(buffer.trim().slice(6));
      onEvent(data);
    } catch (e) {
      // 忽略
    }
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function run() {
  console.log('========================================');
  console.log('  AI 思考过程测试脚本');
  console.log('========================================\n');

  // 1. 读取模板数据
  console.log('📄 读取模板数据...');
  const raw = readJson(MARK_DATA_PATH);
  const markData = raw.markData || raw;
  const fields = extractFields(markData);
  console.log(`✅ 提取到 ${fields.length} 个字段\n`);

  // 2. 登录
  const token = await login();

  // 3. 准备请求数据
  const formData = new FormData();
  formData.append('fields', JSON.stringify(fields));
  formData.append('text', TEST_CASE_TEXT);
  formData.append('model', 'kimi');  // 使用 Kimi 模型（支持思考过程）

  // 4. 调用流式 AI 接口
  console.log('🤖 调用 Kimi AI 流式接口...');
  console.log('📝 测试案情:');
  console.log(TEST_CASE_TEXT.trim());
  console.log('\n========================================');
  console.log('  开始接收思考过程');
  console.log('========================================\n');

  const thinkingLines = [];
  const progressLines = [];
  const fields_filled = [];
  let requestId = null;

  const res = await fetch(`${BASE_URL}/ai/parse-stream`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI 调用失败: ${res.status} ${text}`);
  }

  // 5. 解析流式响应
  await parseSSEStream(res, (event) => {
    if (event.requestId) requestId = event.requestId;

    // 进度消息
    if (event.type === 'progress') {
      console.log(`📊 [进度] ${event.message}`);
      progressLines.push(event.message);
    }

    // 思考过程（重点）
    if (event.type === 'thinking') {
      const content = event.content || '';
      process.stdout.write(content);  // 实时输出，不换行
      thinkingLines.push(content);
    }

    // 字段填充
    if (event.type === 'field') {
      console.log(`\n✅ [字段] ${event.key} = ${event.value}`);
      fields_filled.push({ key: event.key, value: event.value });
    }

    // 完成
    if (event.type === 'complete') {
      console.log(`\n\n✅ [完成] ${event.message}`);
      console.log(`📊 总计填充 ${event.total} 个字段`);
      if (event.rejected > 0) {
        console.log(`⚠️  拒绝 ${event.rejected} 个字段（不在白名单中）`);
      }
    }

    // 错误
    if (event.type === 'error') {
      console.error(`\n❌ [错误] ${event.message}`);
    }
  });

  // 6. 保存思考内容到文件
  console.log('\n========================================');
  console.log('  保存思考内容');
  console.log('========================================\n');

  const fullThinking = thinkingLines.join('');

  const output = [
    '========================================',
    '  AI 思考过程完整记录',
    '========================================',
    '',
    `请求ID: ${requestId || 'N/A'}`,
    `时间: ${new Date().toLocaleString('zh-CN')}`,
    `模型: Kimi (kimi-k2-turbo-preview)`,
    '',
    '========================================',
    '  进度消息',
    '========================================',
    '',
    ...progressLines.map(line => `> ${line}`),
    '',
    '========================================',
    '  思考过程',
    '========================================',
    '',
    fullThinking,
    '',
    '========================================',
    '  填充字段',
    '========================================',
    '',
    ...fields_filled.map(f => `${f.key}: ${f.value}`),
    '',
    '========================================',
    '  统计信息',
    '========================================',
    '',
    `思考内容长度: ${fullThinking.length} 字符`,
    `填充字段数量: ${fields_filled.length}`,
    ''
  ].join('\n');

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`💾 思考内容已保存到: ${OUTPUT_FILE}`);
  console.log(`📊 思考内容长度: ${fullThinking.length} 字符`);
  console.log(`📝 填充字段数量: ${fields_filled.length}`);

  console.log('\n✅ 测试完成！');
}

// ============================================================================
// 执行
// ============================================================================

run().catch(err => {
  console.error('\n❌ 测试失败:');
  console.error(err.message || err);
  process.exit(1);
});
