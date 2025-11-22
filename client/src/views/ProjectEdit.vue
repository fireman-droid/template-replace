<template>
  <div class="editor-container">
    <header class="toolbar">
      <div class="left">
        <button class="icon-btn" @click="router.push('/')"><el-icon><HomeFilled /></el-icon></button>
        <span class="separator">/</span>
        <div class="project-name-wrapper">
          <input 
            v-if="isEditingName" 
            v-model="caseName" 
            @blur="handleNameBlur"
            @keyup.enter="handleNameEnter"
            class="name-input"
            placeholder="请输入案卷名称"
            ref="nameInput"
          />
          <span 
            v-else 
            class="project-name" 
            @click="startEditName"
            :title="caseName || '点击编辑案卷名称'"
          >
            {{ caseName || (isNew ? '新建案卷草稿' : '案卷编辑') }}
            <el-icon class="edit-icon"><Edit /></el-icon>
          </span>
          <span v-if="isSavingName" class="saving-indicator">
            <el-icon class="is-loading"><Loading /></el-icon>
            保存中...
          </span>
        </div>
      </div>
      <div class="right">
        <button class="btn-ghost">保存草稿</button>
        <button class="btn-primary">生成文书 <el-icon><Cpu /></el-icon></button>
      </div>
    </header>

    <div class="workspace">
      <div class="left-pane">
        <ProjectForm :current-type="currentType" />
      </div>

      <div class="right-pane">
        <ProjectPreview />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Cpu, Edit, Loading } from '@element-plus/icons-vue'
import ProjectForm from '@/components/project/ProjectForm.vue'
import ProjectPreview from '@/components/project/ProjectPreview.vue'
import { createCase, getCaseDetail, updateCase } from '@/api'
import { ElMessage } from 'element-plus'


const route = useRoute()
const router = useRouter()

const isNew = ref(false)
const caseId = ref(null)
const caseName = ref('')
const originalCaseName = ref('') // 保存原始名称，用于对比
const isEditingName = ref(false)
const nameInput = ref(null)
const isSavingName = ref(false)

onMounted(async () => {
  // 优先检查是否有 id 参数（已存在的案卷）
  if (route.query.id) {
    caseId.value = route.query.id
    await handleGetCaseDetail(route.query.id)
  } 
  // 只有在没有 id 且有 isNew 标记时才创建新案卷
  else if (route.query.isNew === 'true') {
    isNew.value = true
    await handleCreateNewCase({
      title: '新建案卷草稿',
      template_id: route.query.type,
      status: 'draft'
    })
  }
})

// 创建案卷
const handleCreateNewCase = async (data) => {
  try {
    const res = await createCase(data)
    caseId.value = res.case.id
    caseName.value = res.case.title
    originalCaseName.value = res.case.title // 保存原始名称
    
    // 创建成功后，立即更新 URL，将 isNew 参数替换为 id 参数
    // 这样刷新页面时就不会重复创建
    router.replace({
      path: route.path,
      query: {
        id: res.case.id,
        type: route.query.type
      }
    })
    
    isNew.value = false
    ElMessage.success('创建案卷成功!')
  } catch (error) {
    console.error('创建案卷失败:', error)
    ElMessage.error('创建案卷失败，请重试')
  }
}

// 获取案卷内容
const handleGetCaseDetail = async (id) => {
  const res = await getCaseDetail(id)
  caseName.value = res.title
  originalCaseName.value = res.title // 保存原始名称
}

// 更新案卷名称
const updateCaseName = async () => {
  const newName = caseName.value.trim()
  
  // 如果名称为空，恢复原始名称
  if (!newName) {
    caseName.value = originalCaseName.value
    ElMessage.warning('案卷名称不能为空')
    return
  }
  
  // 如果名称没有变化，不发送请求
  if (newName === originalCaseName.value) {
    return
  }
  
  if (!caseId.value) {
    return
  }

  try {
    isSavingName.value = true
    await updateCase(caseId.value, {
      title: newName
    })
    originalCaseName.value = newName // 更新原始名称
    ElMessage.success('案卷名称已更新')
  } catch (error) {
    console.error('更新案卷名称失败:', error)
    ElMessage.error('更新案卷名称失败')
    // 失败时恢复原始名称
    caseName.value = originalCaseName.value
  } finally {
    isSavingName.value = false
  }
}

// 开始编辑名称
const startEditName = () => {
  isEditingName.value = true
  // 等待 DOM 更新后聚焦输入框
  setTimeout(() => {
    nameInput.value?.focus()
  }, 0)
}

// 输入框失焦处理
const handleNameBlur = () => {
  isEditingName.value = false
  updateCaseName() // 失焦时保存
}

// 按下回车键处理
const handleNameEnter = () => {
  nameInput.value?.blur() // 触发失焦事件
}
</script>

<style lang="scss" scoped>
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
          
          .edit-icon {
            opacity: 1;
          }
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
        
        &::placeholder {
          color: $text-gray;
        }
        
        &:focus {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 2px rgba($primary, 0.2);
        }
      }
      
      .saving-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: $text-gray;
        animation: fadeIn 0.3s ease-in;
        
        .el-icon {
          font-size: 14px;
        }
      }
    }
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

  .left-pane {
    flex: 4; // 40%
    overflow: hidden;
  }

  .right-pane {
    flex: 6; // 60%
    overflow: hidden;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>