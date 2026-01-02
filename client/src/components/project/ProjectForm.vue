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
      <DynamicForm 
        :mark-data="markData"
        v-model="editorStore.formData"
      />
    </div>
    
    <div v-else class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon> 
      <span>正在初始化表单...</span>
    </div>

    <el-dialog
      v-model="showAiDialog"
      title="AI 智能识别引擎"
      width="520px"
      class="ai-config-dialog"
      :modal="true"
      :append-to-body="true"
      :lock-scroll="false"
      align-center
    >
      <div class="ai-card-content">
        <div class="config-section">
          <label>选择基础大模型</label>
          <div class="model-selector">
            <div 
              v-for="model in models" 
              :key="model.id"
              class="model-option"
              :class="{ active: selectedModel === model.id }"
              @click="selectedModel = model.id"
            >
              <el-icon><component :is="model.icon" /></el-icon>
              <span>{{ model.name }}</span>
            </div>
          </div>
        </div>

        <div class="config-section">
          <label>上传案卷资料</label>
          <el-upload
            class="upload-zone"
            drag
            action="#"
            multiple
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF, DOCX, JPG 格式，单文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cyber secondary" @click="showAiDialog = false">取消</button>
          <button class="btn-cyber primary" @click="startAnalysis">
            <el-icon><Cpu /></el-icon> 开始深度分析
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
// 引入 Store
import { useEditorStore, useTemplateStore } from '@/stores'
// 引入动态表单
import DynamicForm from '@/components/DynamicForm.vue'
import { MagicStick, UploadFilled, Cpu, Loading } from '@element-plus/icons-vue'

const editorStore = useEditorStore()
const templateStore = useTemplateStore()

// 获取 markData
const markData = computed(() => {
  return templateStore.templateInfo?.markData || null
})

// 接收父组件传来的模版类型
const props = defineProps({
  currentType: {
    type: String,
    default: 'divorce'
  }
})

const showAiDialog = ref(false)
const selectedModel = ref('gpt4')

const models = [
  { id: 'gpt4', name: 'GPT-4o (通用)', icon: 'Connection' },
  { id: 'claude', name: 'Claude 3.5 (长文本)', icon: 'Opportunity' },
  { id: 'deepseek', name: 'DeepSeek (法律)', icon: 'Rank' }
]

const startAnalysis = () => {
  showAiDialog.value = false
  ElMessage.success({
    message: `正在使用 ${models.find(m => m.id === selectedModel.value).name} 分析案卷...`,
    type: 'success',
    duration: 3000
  })
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$border: rgba(255,255,255,0.1);
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

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-shrink: 0; // 防止头部被压缩
    
    h3 { margin: 0; font-size: 18px; color: $text-white; font-weight: 700; letter-spacing: 0.5px; }
    
    .ai-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(90deg, rgba($accent, 0.1), rgba($primary, 0.1));
      border: 1px solid rgba($accent, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      color: $accent;
      cursor: pointer;
      transition: all 0.3s;
      
      .ai-icon { font-size: 14px; }
      .status-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite; }
      
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
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
  }

  .el-input__wrapper, .el-textarea__inner {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: none !important;
    padding: 8px 15px !important;
    border-radius: 4px;
  }

  .el-input__inner {
    color: #ffffff !important;
    &::placeholder { color: rgba(255, 255, 255, 0.3); }
  }
  
  .el-textarea__inner {
    color: #ffffff !important;
    padding: 10px 15px !important;
    &::placeholder { color: rgba(255, 255, 255, 0.3); }
  }
  
  .el-input__wrapper.is-focus, .el-textarea__inner:focus {
    border-color: $primary !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 0 0 1px $primary !important;
  }
  
  .el-radio {
    color: #e2e8f0;
    margin-right: 20px;
    .el-radio__label { color: #e2e8f0; }
    .el-radio__inner { background: transparent; border-color: rgba(255,255,255,0.4); }
    &.is-checked {
      .el-radio__inner { background: $primary; border-color: $primary; }
      .el-radio__label { color: $primary; }
    }
  }
  
  // 新增 Checkbox 样式覆盖
  .el-checkbox {
    color: #e2e8f0;
    .el-checkbox__label { color: #e2e8f0; }
    .el-checkbox__inner { background: transparent; border-color: rgba(255,255,255,0.4); }
    &.is-checked {
      .el-checkbox__inner { background: $primary; border-color: $primary; }
      .el-checkbox__label { color: $primary; }
    }
  }
}

// AI 弹窗样式 (保持不变)
.ai-card-content {
  padding: 10px 0;
  .config-section {
    margin-bottom: 24px;
    label { display: block; color: $text-white; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
  }
  .model-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    .model-option {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 15px 5px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      .el-icon { font-size: 24px; color: $text-gray; margin-bottom: 8px; display: block; margin: 0 auto 8px; }
      span { font-size: 12px; color: $text-gray; display: block; }
      &:hover { background: rgba(255,255,255,0.1); }
      &.active {
        background: rgba($primary, 0.15);
        border-color: $primary;
        .el-icon, span { color: $primary; }
        box-shadow: 0 0 15px rgba($primary, 0.15);
      }
    }
  }
}

.upload-zone {
  :deep(.el-upload-dragger) {
    background: rgba(255,255,255,0.02) !important;
    border-color: rgba(255,255,255,0.1) !important;
    transition: all 0.3s;
    &:hover { border-color: $primary !important; background: rgba($primary, 0.05) !important; }
    .el-icon--upload { color: $text-gray; }
    .el-upload__text { color: $text-gray; em { color: $primary; } }
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
  &.secondary { background: transparent; border: 1px solid #475569; color: #cbd5e1; &:hover { color: white; border-color: white; } }
  &.primary { background: $primary; color: white; &:hover { background: lighten($primary, 5%); box-shadow: 0 0 15px rgba($primary, 0.3); } }
}

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16,185,129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129, 0); } }
</style>

<style lang="scss">
.ai-config-dialog {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(6, 182, 212, 0.3) !important;
  border-radius: 16px !important;
  box-shadow: 0 0 50px rgba(0,0,0,0.8) !important;
  
  .el-dialog__header {
    margin-right: 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 20px !important;
    .el-dialog__title { color: #ffffff !important; font-weight: 700; }
  }
  .el-dialog__body { padding: 20px 30px !important; color: #fff; }
  .el-dialog__footer { 
    border-top: 1px solid rgba(255,255,255,0.05); 
    padding: 16px 30px !important;
    .dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }
  }
}
</style>