<template>
  <div class="form-panel">
    <div class="panel-header">
      <h3>要素录入</h3>
      <div class="ai-trigger" @click="showAiDialog = true">
        <el-icon class="ai-icon"><MagicStick /></el-icon>
        <span>AI 识别配置</span>
        <div class="status-dot"></div>
      </div>
    </div>

    <div class="renderer-container" v-if="markData">
      <DynamicForm :mark-data="markData" v-model="editorStore.formData" />
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
          <label>选择 AI 模型</label>
          <div class="model-selector">
            <div
              v-for="model in models"
              :key="model.id"
              class="model-option"
              :class="{ active: selectedModel === model.id }"
              @click="selectedModel = model.id"
            >
              <span>{{ model.name }}</span>
            </div>
          </div>
        </div>

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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useEditorStore, useTemplateStore } from '@/stores'
import DynamicForm from '@/components/DynamicForm.vue'
import { MagicStick, UploadFilled, Loading } from '@element-plus/icons-vue'
import { parseWithAI } from '@/api/ai.js'

const editorStore = useEditorStore()
const templateStore = useTemplateStore()

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
const selectedModel = ref('kimi')
const aiText = ref('')
const aiLoading = ref(false)
const fileList = ref([])

const models = [
  { id: 'kimi', name: 'Kimi', icon: 'ChatDotRound' },
  { id: 'qwen', name: '通义千问', icon: 'Service' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'Cpu' }
]

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
      
      for (const col of row.data) {
        if (col.type !== 'table-col' || !col.data) continue
        
        for (const item of col.data) {
          // 普通字段
          if (item.type === 'field' && item.data) {
            fields.push({
              fieldKey: item.data.fieldKey,
              fieldLabel: item.data.fieldLabel || '未命名',
              type: item.data.type || 'text',
              isMultiple: item.data.props?.isMultiple || false
            })
          }
          // inline-fields
          if (item.type === 'inline-fields' && item.data?.fields) {
            for (const f of item.data.fields) {
              fields.push({
                fieldKey: f.fieldKey,
                fieldLabel: f.fieldLabel || '未命名',
                type: f.type || 'text',
                isMultiple: f.props?.isMultiple || false
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
  try {
    const fields = extractFields(markData.value)
    
    const formData = new FormData()
    formData.append('fields', JSON.stringify(fields))
    formData.append('model', selectedModel.value)
    
    if (aiText.value.trim()) {
      formData.append('text', aiText.value)
    }
    if (fileList.value.length > 0 && fileList.value[0].raw) {
      formData.append('file', fileList.value[0].raw)
    }

    const res = await parseWithAI(formData)
    console.log('前端收到响应:', res)
    console.log('res.data:', res.data)
    console.log('当前 editorStore.formData:', editorStore.formData)

    if (res.success) {
      // 获取字段信息用于类型转换
      const fields = extractFields(markData.value)
      const fieldMap = {}
      fields.forEach(f => { fieldMap[f.fieldKey] = f })
      
      // 直接填充所有数据
      Object.entries(res.data).forEach(([fieldKey, value]) => {
        console.log(`填充字段 ${fieldKey}:`, value)
        if (value) {
          const field = fieldMap[fieldKey]
          // 如果是多选字段且值是字符串，转换为数组
          if (field?.isMultiple && typeof value === 'string') {
            editorStore.formData[fieldKey] = [value]
          } else {
            editorStore.formData[fieldKey] = value
          }
        }
      })
      console.log('填充后 editorStore.formData:', editorStore.formData)
      showAiDialog.value = false
      aiText.value = ''
      fileList.value = []
      ElMessage.success('AI 填充完成')
    } else {
      ElMessage.error(res.message || 'AI 解析失败')
    }
  } catch (error) {
    ElMessage.error('AI 解析失败: ' + (error.response?.data?.message || error.message))
  } finally {
    aiLoading.value = false
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
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(
        90deg,
        rgba($accent, 0.1),
        rgba($primary, 0.1)
      );
      border: 1px solid rgba($accent, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      color: $accent;
      cursor: pointer;
      transition: all 0.3s;

      .ai-icon {
        font-size: 14px;
      }
      .status-dot {
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px #10b981;
        animation: pulse 2s infinite;
      }

      &:hover {
        background: rgba($accent, 0.2);
        box-shadow: 0 0 15px rgba($accent, 0.2);
        transform: translateY(-1px);
      }
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
      background: lighten($primary, 5%);
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
