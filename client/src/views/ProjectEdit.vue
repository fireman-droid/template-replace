<template>
  <div class="editor-container">
    <header class="toolbar">
      <div class="left">
        <button class="icon-btn" @click="router.push('/')"><el-icon><HomeFilled /></el-icon></button>
        <span class="separator">/</span>
        <span class="project-name">{{ isNew ? '新建案卷草稿' : '案卷编辑' }}</span>
      </div>
      
      <div class="center">
        <el-dropdown trigger="click" @command="handleTemplateChange">
          <div class="template-switcher">
            <span class="label">当前模版：</span>
            <span class="value">{{ currentTemplateName }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="divorce">离婚纠纷协议</el-dropdown-item>
              <el-dropdown-item command="sales">买卖合同纠纷</el-dropdown-item>
              <el-dropdown-item command="house">房屋租赁/纠纷</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="right">
        <button class="btn-ghost">保存草稿</button>
        <button class="btn-primary">生成文书 <el-icon><Cpu /></el-icon></button>
      </div>
    </header>

    <div class="workspace">
      <div class="form-panel">
        <div class="panel-header">
          <h3>要素录入</h3>
          <div class="ai-trigger" @click="showAiDialog = true">
            <el-icon class="ai-icon"><MagicStick /></el-icon>
            <span>AI 识别配置</span>
            <div class="status-dot"></div>
          </div>
        </div>
        
        <el-form label-position="top" class="cyber-form">
          <template v-if="currentType === 'divorce'">
            <div class="form-group">
              <h4>基础信息</h4>
              <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="男方姓名"><el-input placeholder="请输入" /></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="女方姓名"><el-input placeholder="请输入" /></el-form-item></el-col>
              </el-row>
              <el-form-item label="结婚登记日期"><el-date-picker type="date" placeholder="选择日期" style="width: 100%" /></el-form-item>
            </div>
            <div class="form-group">
              <h4>财产分割</h4>
              <el-form-item label="房产处理方案">
                <el-input type="textarea" rows="4" placeholder="例如：位于...的房产归女方所有，剩余贷款由..." />
              </el-form-item>
            </div>
          </template>

          <template v-if="currentType === 'sales'">
            <div class="form-group">
              <h4>合同主体</h4>
              <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="买方(甲方)"><el-input placeholder="公司/个人名称" /></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="卖方(乙方)"><el-input placeholder="公司/个人名称" /></el-form-item></el-col>
              </el-row>
            </div>
            <div class="form-group">
              <h4>交易标的</h4>
              <el-form-item label="标的物名称"><el-input placeholder="例如：精密机床" /></el-form-item>
              <el-form-item label="合同总金额 (元)"><el-input placeholder="0.00" /></el-form-item>
              <el-form-item label="违约责任"><el-input type="textarea" rows="4" placeholder="描述违约条款..." /></el-form-item>
            </div>
          </template>

          <template v-if="currentType === 'house'">
            <div class="form-group">
              <h4>房产信息</h4>
              <el-form-item label="房屋地址"><el-input placeholder="请输入详细地址" /></el-form-item>
              <el-row :gutter="20">
                <el-col :span="12"><el-form-item label="出租方"><el-input /></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="承租方"><el-input /></el-form-item></el-col>
              </el-row>
            </div>
            <div class="form-group">
              <h4>纠纷要点</h4>
              <el-form-item label="纠纷类型">
                <el-radio-group v-model="houseDisputeType">
                  <el-radio label="欠租">欠租</el-radio>
                  <el-radio label="设施损坏">设施损坏</el-radio>
                  <el-radio label="提前退租">提前退租</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="诉求描述"><el-input type="textarea" rows="4" placeholder="请输入具体诉求..." /></el-form-item>
            </div>
          </template>
        </el-form>
      </div>

      <div class="preview-panel">
        <div class="preview-placeholder">
          <div class="scan-line"></div>
          <el-icon class="icon-large"><DocumentChecked /></el-icon>
          <p>实时预览已就绪</p>
          <div class="loading-lines">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
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
          <button class="btn-cyber primary" @click="startAnalysis">
            <el-icon><Cpu /></el-icon> 开始深度分析
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  HomeFilled, ArrowDown, Cpu, DocumentChecked, 
  MagicStick, UploadFilled, Connection, Opportunity, Rank 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const currentType = ref('divorce')
const isNew = ref(false)
const showAiDialog = ref(false)
const selectedModel = ref('gpt4')
const houseDisputeType = ref('')

const models = [
  { id: 'gpt4', name: 'GPT-4o (通用)', icon: 'Connection' },
  { id: 'claude', name: 'Claude 3.5 (长文本)', icon: 'Opportunity' },
  { id: 'deepseek', name: 'DeepSeek (法律)', icon: 'Rank' }
]

onMounted(() => {
  if (route.query.type) currentType.value = route.query.type
  if (route.query.isNew) isNew.value = true
})

const templateMap = {
  divorce: '离婚纠纷协议',
  sales: '买卖合同纠纷',
  house: '房屋租赁/纠纷'
}

const currentTemplateName = computed(() => templateMap[currentType.value] || '未选择')

const handleTemplateChange = (type) => {
  currentType.value = type
}

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
$panel-bg: #0f172a;
$primary: #3b82f6;
$accent: #06b6d4;
$border: rgba(255,255,255,0.1);
$text-white: #ffffff;
$text-gray: #94a3b8;

.editor-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-deep;
  color: $text-white;
  overflow: hidden;
}

.toolbar {
  height: 60px;
  background: rgba($panel-bg, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid $border;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  z-index: 10;

  .left {
    display: flex;
    align-items: center;
    gap: 10px;
    .icon-btn { background: none; border: none; color: $text-gray; cursor: pointer; font-size: 18px; &:hover { color: white; } }
    .separator { color: #475569; }
    .project-name { font-weight: 600; font-size: 14px; }
  }

  .template-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.05);
    padding: 6px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    border: 1px solid transparent;
    transition: all 0.3s;
    .label { color: $text-gray; }
    .value { color: $primary; font-weight: 600; }
    &:hover { background: rgba(255,255,255,0.1); border-color: rgba($primary, 0.3); }
  }

  .right {
    display: flex;
    gap: 12px;
    button { padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; border: none; transition: all 0.3s; }
    .btn-ghost { background: transparent; color: $text-gray; border: 1px solid #475569; &:hover { border-color: white; color: white; } }
    .btn-primary { background: $primary; color: white; display: flex; align-items: center; gap: 6px; font-weight: 600; &:hover { background: lighten($primary, 10%); box-shadow: 0 0 15px rgba($primary, 0.4); } }
  }
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;

  // 左侧表单区 - 40%
  .form-panel {
    flex: 4; // 黄金比例 4
    padding: 30px;
    overflow-y: auto;
    border-right: 1px solid $border;
    background: $bg-deep;

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      h3 { margin: 0; font-size: 18px; color: $text-white; font-weight: 700; letter-spacing: 0.5px; }
      
      // AI 触发器按钮
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

    .form-group {
      margin-bottom: 30px;
      h4 { 
        font-size: 14px; 
        color: $primary; 
        margin-bottom: 16px; 
        border-left: 3px solid $primary; 
        padding-left: 10px; 
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }
  }

  // 右侧预览区 - 60%
  .preview-panel {
    flex: 6; // 黄金比例 6
    background: #020617;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid rgba(0,0,0,0.5);
    
    // 扫描线背景
    .preview-placeholder {
      text-align: center;
      color: #475569;
      position: relative;
      
      .scan-line {
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 2px;
        background: rgba($primary, 0.2);
        box-shadow: 0 0 20px $primary;
        animation: scan 4s infinite linear;
      }

      .icon-large { font-size: 64px; margin-bottom: 20px; opacity: 0.6; color: $text-gray; }
      .loading-lines span { display: block; height: 2px; background: #1e293b; margin: 12px auto; width: 240px; animation: loading 2s infinite; border-radius: 2px; }
      .loading-lines span:nth-child(2) { width: 180px; animation-delay: 0.2s; }
      .loading-lines span:nth-child(3) { width: 220px; animation-delay: 0.4s; }
    }
  }
}

// --- AI 弹窗样式 ---
.ai-card-content {
  padding: 10px 0; // 减少横向 Padding 防止溢出
  
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

// Dialog Footer 样式（需要全局或深度选择器）
:deep(.el-dialog__footer) {
  background-color: rgba(15, 23, 42, 0.95) !important;
  padding: 16px 30px !important;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
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

// --- 强制覆盖 Element Plus 样式 ---
:deep(.cyber-form) {
  .el-form-item__label {
    color: #ffffff !important; /* 强制 label 纯白 */
    font-weight: 600;
    font-size: 14px;
    padding-bottom: 8px;
    text-shadow: 0 0 2px rgba(0,0,0,0.5);
  }

  // 修复 Input 样式与间距
  .el-input__wrapper, .el-textarea__inner {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: none !important;
    padding: 8px 15px !important; // 强制增加水平内边距，解决 Placeholder 贴边问题
    border-radius: 4px;
  }

  .el-input__inner {
    color: #ffffff !important; /* 强制输入文字纯白 */
    &::placeholder { color: rgba(255, 255, 255, 0.3); }
  }
  
  .el-textarea__inner {
    color: #ffffff !important;
    padding: 10px 15px !important;
    &::placeholder { color: rgba(255, 255, 255, 0.3); }
  }
  
  // 聚焦状态
  .el-input__wrapper.is-focus, .el-textarea__inner:focus {
    border-color: $primary !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 0 0 1px $primary !important;
  }
  
  // 修复 Radio 样式
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
}

// AI 弹窗样式穿透
// 使用 append-to-body 后，样式需要写在全局或深度选择器中
:global(.ai-config-dialog) {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(6, 182, 212, 0.3) !important; // 荧光青边框
  border-radius: 16px !important;
  box-shadow: 0 0 50px rgba(0,0,0,0.8) !important;
  
  .el-dialog__header {
    margin-right: 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding: 20px !important;
    .el-dialog__title { color: #ffffff !important; font-weight: 700; }
  }
  .el-dialog__body { padding: 20px 30px !important; color: #fff; }
  .el-dialog__footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 16px 30px !important }
}

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16,185,129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129, 0); } }
@keyframes scan { 0% { top: -50%; } 100% { top: 150%; } }
@keyframes loading { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
</style>