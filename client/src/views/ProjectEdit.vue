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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, ArrowDown, Cpu } from '@element-plus/icons-vue'
import ProjectForm from '@/components/project/ProjectForm.vue'
import ProjectPreview from '@/components/project/ProjectPreview.vue'

const route = useRoute()
const router = useRouter()

const currentType = ref('divorce')
const isNew = ref(false)

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

  .left-pane {
    flex: 4; // 40%
    overflow: hidden;
  }

  .right-pane {
    flex: 6; // 60%
    overflow: hidden;
  }
}
</style>