<template>
  <div class="form-panel">
    <div class="panel-header">
      <h3>要素录入</h3>
    </div>

    <!-- AI 悬浮按钮 -->
    <div 
      class="ai-float-btn" 
      :class="{ expanded: aiButtonHover }"
      @mouseenter="aiButtonHover = true"
      @mouseleave="aiButtonHover = false"
      @click="showAiDialog = true"
    >
      <el-icon class="ai-icon"><MagicStick /></el-icon>
      <span class="ai-text">AI 智能填充</span>
      <div class="status-dot"></div>
    </div>

    <div class="renderer-container" v-if="markData">
      <DynamicForm ref="dynamicFormRef" :mark-data="markData" v-model="editorStore.formData" 
        v-model:repeatCountMap="editorStore.rowRepeatCountMap" />
    </div>

    <div v-else class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在初始化表单...</span>
    </div>

    <el-dialog
      v-model="showAiDialog"
      title="AI 智能填充"
      width="600px"
      class="ai-config-dialog"
      :modal="true"
      :append-to-body="true"
      :lock-scroll="false"
      align-center
    >
      <div class="ai-card-content">
        <div class="config-section">
          <label>上传案卷资料（可选）</label>
          <el-upload
            class="upload-zone"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            accept=".pdf,.docx,.doc,.txt"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF、Word、TXT 格式，单文件不超过 10MB
              </div>
            </template>
          </el-upload>
        </div>

        <div class="config-section">
          <label>或直接输入案情描述</label>
          <el-input
            v-model="aiText"
            type="textarea"
            :rows="6"
            placeholder="请粘贴案情描述、起诉状内容、当事人信息等..."
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cyber secondary" @click="showAiDialog = false">
            取消
          </button>
          <button
            class="btn-cyber primary"
            :disabled="aiLoading"
            @click="handleAIParse"
          >
            <el-icon v-if="aiLoading" class="is-loading"><Loading /></el-icon>
            <el-icon v-else><MagicStick /></el-icon>
            {{ aiLoading ? "解析中..." : "开始智能填充" }}
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 分析全屏动画遮罩 -->
    <transition name="fade">
      <div v-if="aiLoading" class="ai-analysis-overlay">
        <div class="analysis-content">
          <div class="ai-brain-icon">
            <div class="brain-circle"></div>
            <div class="brain-waves"></div>
            <el-icon class="icon"><Cpu /></el-icon>
          </div>
          
          <h2 class="analysis-title">AI 正在深度分析案卷...</h2>
          
          <div class="terminal-box">
            <div class="terminal-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="terminal-body" ref="terminalRef">
              <div v-for="(log, index) in analysisLogs" :key="index" class="log-line">
                <span class="prompt">></span> {{ log }}
              </div>
              <div class="cursor-line">
                <span class="blink-cursor">_</span>
              </div>
            </div>
          </div>

          <div class="progress-info">
             {{ aiStatus || '正在建立安全连接...' }}
          </div>
          <button class="btn-cancel-ai" @click="cancelAIParse">取消填充</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore, useTemplateStore } from '@/stores'
import DynamicForm from '@/components/DynamicForm.vue'
import { MagicStick, UploadFilled, Loading, Cpu } from '@element-plus/icons-vue'
import { parseWithAIStream } from '@/api/ai.js'
import { trackEvent, trackError, trackPerf } from '@/utils/tracker'

const editorStore = useEditorStore()
const templateStore = useTemplateStore()

// DynamicForm 组件引用
const dynamicFormRef = ref(null)

const markData = computed(() => {
  return templateStore.templateInfo?.markData || null
})

const props = defineProps({
  currentType: {
    type: String,
    default: 'divorce'
  }
})

const showAiDialog = ref(false)
const aiText = ref('')
const aiLoading = ref(false)
const fileList = ref([])
const aiStatus = ref('')  // AI 当前状态提示
const aiButtonHover = ref(false) // AI 按钮悬停状态
const analysisLogs = ref([]) // 动画日志列表
const terminalRef = ref(null) // 终端元素引用
const aiAbortController = ref(null) // 用于取消 AI 请求
const aiChanges = ref([]) // AI 填充变更记录 [{key, oldValue, newValue, fieldLabel}]

// 取消 AI 填充
function cancelAIParse() {
  if (aiAbortController.value) {
    aiAbortController.value.abort('用户取消')
    aiAbortController.value = null
  }
}

// 文件选择回调
function handleFileChange(uploadFile) {
  fileList.value = [uploadFile]
}

// 从 markData 提取字段列表
function extractFields(markData) {
  const fields = []
  
  if (!markData?.data) return fields
  
  // 遍历所有 table
  for (const table of markData.data) {
    if (table.type !== 'table' || !table.data) continue
    
    for (const row of table.data) {
      if (row.type !== 'table-row' || !row.data) continue
      
      // 先扫描 row 中所有 col，找到 table-title 获取分类信息
      let currentCanRepeat = false
      let currentMarkKey = ''
      let currentSubTitle = ''
      
      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue
        for (const item of col.data) {
          if (item.type === 'table-title') {
            currentCanRepeat = item.data.canRepeatSubjectRow || false
            currentMarkKey = item.data.mark?.markKey || ''
            currentSubTitle = item.data.title || ''
            break
          }
        }
        if (currentSubTitle) break // 找到标题后停止搜索
      }
      
      // 再次遍历 row 中所有 col，提取 fields
      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue
        
        for (const item of col.data) {
          // 普通字段 - 在 fieldLabel 中添加简短分类前缀帮助 AI 识别
          if (item.type === 'field' && item.data) {
            const baseLabel = item.data.fieldLabel || '未命名'
            // 缩短分类前缀以减少 token
            const shortTitle = currentSubTitle
              .replace('（自然人）', '-人')
              .replace('（法人、非法人组织）', '-法人')
            const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel
            fields.push({
              fieldKey: item.data.fieldKey,
              fieldLabel: labelWithCategory,
              type: item.data.type || 'text',
              isMultiple: item.data.props?.isMultiple || false,
              canRepeat: currentCanRepeat,
              markKey: currentMarkKey
            })
          }
          // inline-fields
          if (item.type === 'inline-fields' && item.data?.fields) {
            for (const f of item.data.fields) {
              const baseLabel = f.fieldLabel || '未命名'
              const shortTitle = currentSubTitle
                .replace('（自然人）', '-人')
                .replace('（法人、非法人组织）', '-法人')
              const labelWithCategory = shortTitle ? `[${shortTitle}]${baseLabel}` : baseLabel
              fields.push({
                fieldKey: f.fieldKey,
                fieldLabel: labelWithCategory,
                type: f.type || 'text',
                isMultiple: f.props?.isMultiple || false,
                canRepeat: currentCanRepeat,
                markKey: currentMarkKey
              })
            }
          }
        }
      }
    }
  }
  
  return fields
}

// AI 解析
async function handleAIParse() {
  if (!aiText.value.trim() && fileList.value.length === 0) {
    ElMessage.warning('请上传文件或输入案情描述')
    return
  }

  aiLoading.value = true
  aiChanges.value = []
  showAiDialog.value = false
  const abortCtrl = new AbortController()
  aiAbortController.value = abortCtrl
  const aiStartTime = performance.now()
  trackEvent('action', 'ai_parse_start', { hasFile: fileList.value.length > 0, hasText: !!aiText.value.trim() })
  try {
    const fields = extractFields(markData.value)
    // console.log(fields)
    const fieldMap = {}
    fields.forEach(f => { fieldMap[f.fieldKey] = f })
    // console.log(fieldMap)
    const formData = new FormData()
    // console.log(formData)
    formData.append('fields', JSON.stringify(fields))
    if (aiText.value.trim()) {
      formData.append('text', aiText.value)
    }
    console.log(formData)
    if (fileList.value.length > 0 && fileList.value[0].raw) {
      formData.append('file', fileList.value[0].raw)
    }
    // 使用流式api（支持取消和超时）
    await parseWithAIStream(formData, async (event) => {
      if (event.type === 'progress') {
        // 更新状态提示
        aiStatus.value = event.message
        // 添加到日志动画
        analysisLogs.value.push(event.message)
        // 自动滚动到底部
        nextTick(() => {
          if (terminalRef.value) {
            terminalRef.value.scrollTop = terminalRef.value.scrollHeight
          }
        })
      }
      if (event.type === 'field') {
        const { key, value } = event

        // 尝试获取字段定义
        let field = fieldMap[key]
        let baseKey = key
        
        // 如果找不到字段定义，尝试解析 _N 后缀（处理多人员）
        if (!field) {
          const match = key.match(/^(.+)_(\d+)$/)
          if (match) {
            baseKey = match[1]
            const personIndex = parseInt(match[2], 10) // _1 表示第2个人（index 1）
            
            if (fieldMap[baseKey]) {
              field = fieldMap[baseKey]
              
              // 自动增加人员数量
              if (field.markKey) {
                const requiredCount = personIndex + 1
                const currentCount = editorStore.rowRepeatCountMap[field.markKey] || 1
                if (requiredCount > currentCount) {
                  editorStore.rowRepeatCountMap[field.markKey] = requiredCount
                  await nextTick() // 等待 DOM 更新（虽然这里主要是数据层）
                }
              }
            }
          }
        }

        // 如果找不到字段定义，跳过该字段
        if (!field) {
          return
        }

        // 展开字段所在的折叠面板（使用 baseKey 找到分类）
        if (dynamicFormRef.value) {
          dynamicFormRef.value.expandCategoryByFieldKey(baseKey)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // 滚动到当前字段 (使用 key, 因为 DOM 中会生成带后缀的 key)
        // 注意：如果刚刚增加了人员，DOM 可能还没完全渲染好，稍微等待
        await nextTick()
        const fieldEl = document.querySelector(`[data-field-key="${key}"]`)
        if (fieldEl) {
          fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        // 处理日期格式
        let finalValue = value
        // 处理数字类型
        if (field?.type === 'number' && typeof value === 'string') {
          finalValue = Number(value) || 0
        }
        // 处理日期
        if (field?.type === 'date' && typeof value === 'string') {
          const match = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
          if (match) {
            const [, year, month, day] = match
            finalValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          }
        }
        // 记录变更（旧值 -> 新值）
        const oldValue = editorStore.formData[key] ?? ''

        // 填充字段
        if (field?.isMultiple && typeof finalValue === 'string') {
          editorStore.formData[key] = [finalValue]
        } else {
          editorStore.formData[key] = finalValue
        }

        // 追踪变更
        aiChanges.value.push({
          key,
          oldValue: oldValue || '',
          newValue: finalValue,
          fieldLabel: field?.fieldLabel || key
        })
      }
      if (event.type === 'complete') {
        // 打印总的识别结果
        console.log('🎉 ========== AI 识别完成 ==========')
        console.log(`📊 识别统计:`)
        console.log(`  - 识别字段数: ${aiChanges.value.length}`)
        console.log(`  - 请求ID: ${event.requestId}`)

        // 打印表单填充结果
        console.log('\n📝 表单填充结果:')
        console.table(aiChanges.value.map(change => ({
          '字段': change.fieldLabel,
          'Key': change.key,
          '旧值': change.oldValue || '(空)',
          '新值': change.newValue
        })))

        console.log('\n✅ formData 最终状态:')
        console.log(JSON.parse(JSON.stringify(editorStore.formData)))
        console.log('=====================================\n')

        ElMessage.success(event.message)
        aiStatus.value = ''
      }
      if (event.type === 'error') {
        ElMessage.error(event.message)
        aiStatus.value = ''
      }
    }, { signal: abortCtrl.signal })
    trackPerf('ai_parse_complete', Math.round(performance.now() - aiStartTime), { fieldCount: aiChanges.value.length })
  } catch (error) {
    trackError('ai_parse_failed', error)
    ElMessage.error('AI 解析失败: ' + (error.response?.data?.message || error.message))
  } finally {
    aiLoading.value = false
    aiAbortController.value = null
  }
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$border: rgba(255, 255, 255, 0.1);
$text-white: #ffffff;
$text-gray: #94a3b8;

.form-panel {
  height: 100%;
  padding: 30px;
  overflow-y: auto;
  background: $bg-deep;
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #06b6d4);
    border-radius: 4px;

    &:hover {
      background: linear-gradient(180deg, #60a5fa, #22d3ee);
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-shrink: 0; // 防止头部被压缩

    h3 {
      margin: 0;
      font-size: 18px;
      color: $text-white;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .ai-trigger {
      display: none; // 隐藏旧的触发器
    }
  }

  // AI 悬浮按钮（固定定位）
  .ai-float-btn {
    position: fixed;
    right: -110px; // 默认隐藏在右边
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(
      135deg,
      rgba($accent, 0.15),
      rgba($primary, 0.1)
    );
    border: 1px solid rgba($accent, 0.4);
    padding: 12px 18px;
    border-radius: 30px 0 0 30px;
    font-size: 14px;
    color: $accent;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: -4px 0 20px rgba($accent, 0.2);
    backdrop-filter: blur(10px);

    .ai-icon {
      font-size: 18px;
    }

    .ai-text {
      white-space: nowrap;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }

    // 悬停时展开
    &.expanded,
    &:hover {
      right: 0;
      background: linear-gradient(
        135deg,
        rgba($accent, 0.25),
        rgba($primary, 0.2)
      );
      box-shadow: -4px 0 30px rgba($accent, 0.4);
    }
  }

  // 渲染容器
  .renderer-container {
    flex: 1;
  }

  // 加载状态样式
  .loading-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: $text-gray;
    gap: 16px;

    .el-icon {
      font-size: 32px;
      color: $primary;
    }
  }
}

// 强制覆盖 Element Plus 样式 (保持你原有的样式)
:deep(.cyber-form) {
  .el-form-item__label {
    color: #ffffff !important;
    font-weight: 600;
    font-size: 14px;
    padding-bottom: 8px;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }

  .el-input__wrapper,
  .el-textarea__inner {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: none !important;
    padding: 8px 15px !important;
    border-radius: 4px;
  }

  .el-input__inner {
    color: #ffffff !important;
    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .el-textarea__inner {
    color: #ffffff !important;
    padding: 10px 15px !important;
    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .el-input__wrapper.is-focus,
  .el-textarea__inner:focus {
    border-color: $primary !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 0 0 1px $primary !important;
  }

  .el-radio {
    color: #e2e8f0;
    margin-right: 20px;
    .el-radio__label {
      color: #e2e8f0;
    }
    .el-radio__inner {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.4);
    }
    &.is-checked {
      .el-radio__inner {
        background: $primary;
        border-color: $primary;
      }
      .el-radio__label {
        color: $primary;
      }
    }
  }

  // 新增 Checkbox 样式覆盖
  .el-checkbox {
    color: #e2e8f0;
    .el-checkbox__label {
      color: #e2e8f0;
    }
    .el-checkbox__inner {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.4);
    }
    &.is-checked {
      .el-checkbox__inner {
        background: $primary;
        border-color: $primary;
      }
      .el-checkbox__label {
        color: $primary;
      }
    }
  }
}

// AI 弹窗样式 (保持不变)
.ai-card-content {
  padding: 10px 0;
  .config-section {
    margin-bottom: 24px;
    label {
      display: block;
      color: $text-white;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
    }
  }
  .model-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    .model-option {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 15px 5px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      .el-icon {
        font-size: 24px;
        color: $text-gray;
        margin-bottom: 8px;
        display: block;
        margin: 0 auto 8px;
      }
      span {
        font-size: 12px;
        color: $text-gray;
        display: block;
      }
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      &.active {
        background: rgba($primary, 0.15);
        border-color: $primary;
        .el-icon,
        span {
          color: $primary;
        }
        box-shadow: 0 0 15px rgba($primary, 0.15);
      }
    }
  }
}

.upload-zone {
  :deep(.el-upload-dragger) {
    background: rgba(255, 255, 255, 0.02) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    transition: all 0.3s;
    &:hover {
      border-color: $primary !important;
      background: rgba($primary, 0.05) !important;
    }
    .el-icon--upload {
      color: $text-gray;
    }
    .el-upload__text {
      color: $text-gray;
      em {
        color: $primary;
      }
    }
  }
}

.btn-cyber {
  padding: 10px 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  &.secondary {
    background: transparent;
    border: 1px solid #475569;
    color: #cbd5e1;
    &:hover {
      color: white;
      border-color: white;
    }
  }
  &.primary {
    background: $primary;
    color: white;
    &:hover {
      background: color-mix(in srgb, $primary 90%, white 10%);
      box-shadow: 0 0 15px rgba($primary, 0.3);
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}
// 全屏 AI 分析遮罩
.ai-analysis-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 14, 23, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .analysis-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 600px;
    max-width: 90%;
  }

  // 大脑图标动画
  .ai-brain-icon {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;

    .icon {
      font-size: 48px;
      color: $primary;
      z-index: 2;
    }

    .brain-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid rgba($primary, 0.3);
      border-radius: 50%;
      animation: spin 4s linear infinite;
      &::before {
        content: "";
        position: absolute;
        top: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 10px;
        background: $primary;
        border-radius: 50%;
        box-shadow: 0 0 10px $primary;
      }
    }

    .brain-waves {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px solid rgba($primary, 0.5);
      animation: ripple 2s infinite;
    }
  }

  .analysis-title {
    font-size: 24px;
    color: $text-white;
    margin-bottom: 30px;
    font-weight: 300;
    letter-spacing: 2px;
    text-align: center;
    background: linear-gradient(90deg, #fff, $primary, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 3s linear infinite;
  }

  // 终端打字机效果
  .terminal-box {
    width: 100%;
    height: 200px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba($primary, 0.3);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 0 20px rgba($primary, 0.1);

    .terminal-header {
      height: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba($primary, 0.2);
      display: flex;
      align-items: center;
      padding: 0 10px;
      gap: 6px;

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        &.red { background: #ff5f56; }
        &.yellow { background: #ffbd2e; }
        &.green { background: #27c93f; }
      }
    }

    .terminal-body {
      padding: 15px;
      height: calc(100% - 30px);
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: $text-gray;
      text-align: left;
      
      /* 自定义滚动条 */
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba($primary, 0.3);
        border-radius: 3px;
      }

      .log-line {
        margin-bottom: 6px;
        line-height: 1.4;
        animation: fadeIn 0.3s ease-out;
        word-break: break-all;
        
        .prompt {
          color: $primary;
          margin-right: 8px;
        }
      }

      .cursor-line {
        .blink-cursor {
          color: $primary;
          animation: blink 1s step-end infinite;
        }
      }
    }
  }

  .progress-info {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }

  .btn-cancel-ai {
    margin-top: 16px;
    padding: 8px 24px;
    border-radius: 6px;
    border: 1px solid rgba(239, 68, 68, 0.5);
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    &:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
    }
  }
}

// 动画关键帧
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ripple {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes shine {
  to { background-position: 200% center; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

// Vue 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>

<style lang="scss">
.ai-config-dialog {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(6, 182, 212, 0.3) !important;
  border-radius: 16px !important;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8) !important;

  .el-dialog__header {
    margin-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 20px !important;
    .el-dialog__title {
      color: #ffffff !important;
      font-weight: 700;
    }
  }
  .el-dialog__body {
    padding: 20px 30px !important;
    color: #fff;
  }
  .el-dialog__footer {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding: 16px 30px !important;
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}
</style>
