<template>
  <div class="editor-container" v-loading="editorStore.loading">
    <header class="toolbar">
      <div class="left">
        <button class="icon-btn" @click="router.push('/')"><el-icon><HomeFilled /></el-icon></button>
        <span class="separator">/</span>
        
        <div class="project-name-wrapper">
          <input 
            v-if="isEditingName && editorStore.currentCase" 
            v-model="editorStore.currentCase.title" 
            @blur="saveTitle"
            @keyup.enter="saveTitle"
            class="name-input"
            placeholder="请输入案卷名称"
            ref="nameInputRef"
          />
          <span 
            v-else 
            class="project-name" 
            @click="startEditName"
            :title="editorStore.currentCase?.title || '加载中...'"
          >
            {{ editorStore.currentCase?.title || (isNew ? '新建案卷草稿' : '加载中...') }}
            <el-icon class="edit-icon"><Edit /></el-icon>
          </span>
          
          </div>
        
        <el-tag size="small" type="info" class="status-tag">
          {{ isNew ? '新建草稿' : '编辑中' }}
        </el-tag>
      </div>

      <div class="right">
        <button class="btn-ghost" @click="showPreview = true">
          <el-icon><View /></el-icon> 预览
        </button>
        <button class="btn-ghost" @click="editorStore.saveEditor()">保存草稿</button>
        <button class="btn-primary" @click="handleGenerate">
          生成文书 <el-icon><Cpu /></el-icon>
        </button>
      </div>
    </header>

    <div class="workspace">
      <div class="main-pane">
        <ProjectForm />
      </div>
    </div>

    <!-- 预览抽屉 -->
    <el-drawer
      v-model="showPreview"
      title="模版预览"
      direction="rtl"
      size="50%"
      :with-header="true"
      class="preview-drawer"
    >
      <ProjectPreview 
        v-if="editorStore.currentCase"
        :visible="showPreview"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Cpu, Edit, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getCaseDetail } from '@/api/cases'

// 引入 Store
import { useEditorStore, useTemplateStore } from '@/stores'

// 引入组件
import ProjectForm from '@/components/project/ProjectForm.vue'
import ProjectPreview from '@/components/project/ProjectPreview.vue'

const route = useRoute()
const router = useRouter()

// 初始化 Store
const editorStore = useEditorStore()
const templateStore = useTemplateStore()

// 本地 UI 状态
const isNew = ref(false)
const isEditingName = ref(false)
const nameInputRef = ref(null)
const showPreview = ref(false)

// === 1. 初始化逻辑 ===
onMounted(async () => {
  // 情况 A: 编辑已有案卷 (URL带id)
  if (route.query.id) {
    const id = Number(route.query.id)
    await initEditor(id)
  } 
  // 情况 B: 新建案卷 (URL带isNew=true)
  else if (route.query.isNew === 'true' && route.query.type) {
    isNew.value = true
    await handleCreateNewCase()
  }
})

// === 2. 页面销毁清理 ===
onUnmounted(() => {
  editorStore.resetEditor()
  templateStore.clear()
})

// === 3. 核心业务方法 ===

// 初始化编辑器数据
const initEditor = async (id) => {
  // 1. 让 Editor Store 加载数据 (JSON配置 + 表单数据)
  await editorStore.enterEditor(id)
  // 2. 让 Template Store 加载预览用的 Word 文件
  await templateStore.loadFile(id)
}

// 处理新建案卷
const handleCreateNewCase = async () => {
  try {
    // 调用 Store 创建
    const res = await editorStore.create({
      title: '新建案卷草稿',
      template_id: route.query.type,
      status: 'draft'
    })
    
    // 替换路由，去掉 isNew 参数
    router.replace({
      path: route.path,
      query: { id: res.case.id }
    })
    
    // 初始化编辑器
    await initEditor(res.case.id)
    
    isNew.value = false
    ElMessage.success('创建案卷成功!')
  } catch (error) {
  }
}

// === 4. 交互逻辑 ===

// 开始编辑标题
const startEditName = () => {
  if (!editorStore.currentCase) return
  isEditingName.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

// 保存标题
const saveTitle = () => {
  isEditingName.value = false
  // 标题为空兜底
  if (!editorStore.currentCase.title || !editorStore.currentCase.title.trim()) {
    editorStore.currentCase.title = '未命名案卷'
  }
  // 静默保存
  editorStore.saveEditor(true)
}

// 生成/下载文书
const handleGenerate = async () => {
  // 使用表单真实数据
  const data = editorStore.formData
  // 使用行重复计数
  const rowRepeatCountMap = editorStore.rowRepeatCountMap || {}
  // 使用案卷标题作为文件名
  const filename = `${editorStore.currentCase?.title || '文书'}.docx`
  templateStore.download(data, rowRepeatCountMap, filename)
}
</script>

<style lang="scss" scoped>
/* 样式保持您原有的代码不变 */
$bg-deep: #050b14;
$panel-bg: #0f172a;
$primary: #3b82f6;
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
    
    .project-name-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .project-name {
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 6px;
        
        .edit-icon {
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
          color: $primary;
          .edit-icon { opacity: 1; }
        }
      }
      
      .name-input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid $primary;
        color: $text-white;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 600;
        outline: none;
        min-width: 200px;
        
        &::placeholder { color: $text-gray; }
        &:focus {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 2px rgba($primary, 0.2);
        }
      }
    }
    .status-tag { margin-left: 8px; background: rgba(255, 255, 255, 0.1); border: none; color: $text-gray; }
  }

  .right {
    display: flex;
    gap: 12px;
    button { padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; border: none; transition: all 0.3s; font-weight: 500; display: flex; align-items: center; gap: 6px; }
    .btn-ghost { background: transparent; color: $text-gray; border: 1px solid #475569; &:hover { border-color: white; color: white; } }
    .btn-primary { 
      background: linear-gradient(135deg, $primary 0%, #06b6d4 100%);
      color: white; 
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
      
      &:hover { 
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); 
        transform: translateY(-1px);
        border-color: rgba(6, 182, 212, 0.5);
      }
      
      &:active {
        transform: translateY(0);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: 0.5s;
      }

      &:hover::before {
        left: 100%;
      }
    }
  }
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;

  .main-pane {
    flex: 1;
    overflow: hidden;
  }
}
</style>

<style lang="scss">
// 抽屉样式
.preview-drawer {
  .el-drawer__header {
    background: #0f172a;
    color: #fff;
    margin-bottom: 0;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .el-drawer__body {
    background: #050b14;
    padding: 0;
  }
}
</style>