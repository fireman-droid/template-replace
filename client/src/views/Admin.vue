<template>
  <div class="admin-container">
    <div class="cyber-grid"></div>
    
    <aside class="sidebar glass-panel">
      <div class="logo-area">
        <el-icon class="logo-icon"><ScaleToOriginal /></el-icon>
        <span class="title">FastReplace <span class="tag">ADMIN</span></span>
      </div>
      
      <ul class="nav-menu">
        <li 
          :class="{ active: currentTab === 'dashboard' }" 
          @click="currentTab = 'dashboard'"
        >
          <el-icon><DataBoard /></el-icon> 仪表盘
        </li>
        <li 
          :class="{ active: currentTab === 'users' }" 
          @click="currentTab = 'users'"
        >
          <el-icon><User /></el-icon> 用户管理
        </li>
        <li 
          :class="{ active: currentTab === 'templates' }" 
          @click="currentTab = 'templates'"
        >
          <el-icon><Files /></el-icon> 模版核心
        </li>
        <li 
          :class="{ active: currentTab === 'logs' }" 
          @click="currentTab = 'logs'"
        >
          <el-icon><Monitor /></el-icon> 系统日志
        </li>
      </ul>

      <div class="bottom-action">
        <button class="btn-logout" @click="handleExit">
          <el-icon><Back /></el-icon> 返回前台
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar glass-panel">
        <div class="breadcrumb">
          <span class="path">管理控制台</span> / <span class="current">{{ tabName }}</span>
        </div>
        <div class="admin-info">
          <el-tag type="danger" effect="dark" size="small">ROOT 权限</el-tag>
          <el-avatar :size="32" class="avatar-root">A</el-avatar>
        </div>
      </header>

      <div class="content-body">
        <transition name="fade-slide" mode="out-in">
          <div v-if="currentTab === 'users'" class="panel-box" key="users">
            <div class="panel-header">
              <h3>用户列表</h3>
              <div class="actions">
                <div class="search-pill">
                  <el-icon><Search /></el-icon>
                  <input placeholder="搜索用户名/邮箱..." />
                </div>
                <button class="btn-cyber small"><el-icon><Plus /></el-icon> 新增用户</button>
              </div>
            </div>
            
            <el-table :data="userList" class="cyber-table" style="width: 100%">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="username" label="用户名">
                <template #default="scope">
                  <span class="user-cell"><el-icon><UserFilled /></el-icon> {{ scope.row.username }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="role" label="角色">
                <template #default="scope">
                  <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'primary'" size="small">
                    {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <span class="status-dot" :class="scope.row.status"></span> {{ scope.row.status === 'active' ? '正常' : '冻结' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200">
                <template #default>
                  <button class="text-btn primary">编辑</button>
                  <button class="text-btn danger">禁用</button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else-if="currentTab === 'templates'" class="panel-box" key="templates">
            <div class="panel-header">
              <h3>模版核心库</h3>
              <button class="btn-cyber primary" @click="showUploadDialog = true">
                <el-icon><Upload /></el-icon> 部署新模版
              </button>
            </div>

            <div class="template-grid">
              <div class="tpl-card" v-for="tpl in templateList" :key="tpl.id">
                <div class="tpl-icon"><el-icon><DocumentChecked /></el-icon></div>
                <div class="tpl-info">
                  <h4>{{ tpl.name }}</h4>
                  <p>版本: v{{ tpl.version }} | 映射字段: {{ tpl.fields }}个</p>
                </div>
                <div class="tpl-actions">
                  <button class="icon-btn"><el-icon><Edit /></el-icon></button>
                  <button class="icon-btn danger"><el-icon><Delete /></el-icon></button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state" key="empty">
            <el-icon class="empty-icon"><DataBoard /></el-icon>
            <p>仪表盘功能开发中...</p>
          </div>
        </transition>
      </div>
    </main>

    <el-dialog
      v-model="showUploadDialog"
      title="部署新法律模版"
      width="650px"
      class="admin-dialog"
      :modal="true"
      :append-to-body="true"
      :lock-scroll="false"
    >
      <el-form label-position="top" class="cyber-form">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="模版名称">
              <el-input placeholder="例如：股权转让协议书(标准版)" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="案由分类">
              <el-select placeholder="选择分类">
                <el-option label="民事纠纷" value="civil" />
                <el-option label="商事合同" value="business" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="upload-grid">
          <div class="upload-item">
            <div class="upload-label"><el-icon><Document /></el-icon> Word 模版 (.docx)</div>
            <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1">
              <div class="drop-area">
                <el-icon><Plus /></el-icon>
                <span>点击上传</span>
              </div>
            </el-upload>
          </div>

          <div class="upload-item">
            <div class="upload-label code-label"><el-icon><Connection /></el-icon> 结构表 (Schema JSON)</div>
            <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1" accept=".json">
              <div class="drop-area code-area">
                <el-icon><JsonCode /></el-icon>
                <span>定义表单结构</span>
              </div>
            </el-upload>
          </div>

          <div class="upload-item">
            <div class="upload-label code-label"><el-icon><Link /></el-icon> 映射表 (Map JSON)</div>
            <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1" accept=".json">
              <div class="drop-area code-area">
                <el-icon><JsonCode /></el-icon>
                <span>Tag ↔ Key 映射</span>
              </div>
            </el-upload>
          </div>
        </div>

        <div class="tips-box">
          <p><el-icon><InfoFilled /></el-icon> 提示：结构表用于生成前端表单，映射表用于将表单数据填充回 Word 内容控件。</p>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cyber secondary" @click="showUploadDialog = false">取消</button>
          <button class="btn-cyber primary">立即部署</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ScaleToOriginal, DataBoard, User, Files, Monitor, Back, 
  Search, Plus, UserFilled, Upload, DocumentChecked, Edit, Delete,
  Document, Connection, Link, InfoFilled
} from '@element-plus/icons-vue'
// 自定义图标占位 (Element Plus 没有 JsonCode，用类似图标代替)
const JsonCode = 'span' // 实际可以使用 svg 或其他图标

const router = useRouter()
const currentTab = ref('templates')
const showUploadDialog = ref(false)

const tabName = computed(() => {
  const map = { dashboard: '系统概览', users: '用户权限', templates: '模版核心', logs: '操作日志' }
  return map[currentTab.value]
})

// 模拟数据
const userList = ref([
  { id: 1001, username: 'admin', role: 'admin', status: 'active' },
  { id: 1002, username: 'test_lawyer', role: 'user', status: 'active' },
  { id: 1003, username: 'guest_01', role: 'user', status: 'locked' },
])

const templateList = ref([
  { id: 1, name: '离婚纠纷协议书', version: '2.1', fields: 45 },
  { id: 2, name: '房屋买卖合同', version: '1.0', fields: 82 },
  { id: 3, name: '民间借贷起诉状', version: '3.5', fields: 24 },
])

const handleExit = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$panel-bg: rgba(15, 23, 42, 0.6);
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.1);

.admin-container {
  min-height: 100vh;
  background: $bg-deep;
  color: $text-main;
  display: flex;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.cyber-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba($primary, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba($primary, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

// --- 侧边栏 ---
.sidebar {
  width: 260px;
  background: $panel-bg;
  backdrop-filter: blur(20px);
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  z-index: 10;

  .logo-area {
    height: 70px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    border-bottom: 1px solid $border;
    
    .logo-icon { font-size: 24px; color: $primary; }
    .title { font-weight: 700; font-size: 18px; }
    .tag { font-size: 10px; background: $primary; padding: 2px 4px; border-radius: 4px; margin-left: 4px; }
  }

  .nav-menu {
    flex: 1;
    list-style: none;
    padding: 20px 0;
    margin: 0;

    li {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: $text-sub;
      cursor: pointer;
      transition: all 0.3s;
      border-left: 3px solid transparent;

      &:hover { background: rgba(255,255,255,0.05); color: white; }
      &.active { background: rgba($primary, 0.1); color: $primary; border-left-color: $primary; }
      .el-icon { font-size: 18px; }
    }
  }

  .bottom-action {
    padding: 20px;
    border-top: 1px solid $border;
    .btn-logout {
      width: 100%;
      background: transparent;
      border: 1px solid $border;
      color: $text-sub;
      padding: 10px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
      &:hover { border-color: white; color: white; }
    }
  }
}

// --- 主内容区 ---
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;

  .top-bar {
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    border-bottom: 1px solid $border;
    
    .breadcrumb { color: $text-sub; .current { color: white; font-weight: 600; } }
    .admin-info { display: flex; align-items: center; gap: 12px; .avatar-root { background: $primary; font-weight: bold; } }
  }

  .content-body {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
  }
}

// --- 面板样式 ---
.panel-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid $border;
  border-radius: 12px;
  padding: 24px;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    h3 { margin: 0; font-size: 20px; border-left: 4px solid $accent; padding-left: 12px; }
    
    .actions {
      display: flex;
      gap: 12px;
      .search-pill {
        background: rgba(0,0,0,0.2);
        border: 1px solid $border;
        border-radius: 20px;
        padding: 6px 12px;
        display: flex;
        align-items: center;
        input { background: transparent; border: none; outline: none; color: white; margin-left: 8px; }
      }
    }
  }
}

// 表格样式
.cyber-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255,255,255,0.05);
  --el-table-border-color: rgba(255,255,255,0.1);
  --el-table-text-color: #e2e8f0;
  --el-table-header-text-color: #94a3b8;
  --el-table-row-hover-bg-color: rgba(59, 130, 246, 0.1);
  
  background: transparent !important;
  
  :deep(.el-table__inner-wrapper::before) { display: none; }
  
  .user-cell { display: flex; align-items: center; gap: 8px; }
  .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; &.active { background: #10b981; box-shadow: 0 0 5px #10b981; } &.locked { background: #ef4444; } }
  
  .text-btn { background: none; border: none; cursor: pointer; margin-right: 10px; font-size: 13px; &:hover { text-decoration: underline; } &.primary { color: $primary; } &.danger { color: #ef4444; } }
}

// 模版网格
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  .tpl-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid $border;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s;
    
    &:hover { border-color: $primary; background: rgba(59, 130, 246, 0.05); }
    
    .tpl-icon { width: 48px; height: 48px; background: rgba($primary, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: $primary; font-size: 24px; }
    .tpl-info { flex: 1; h4 { margin: 0 0 6px; color: $text-main; } p { margin: 0; font-size: 12px; color: $text-sub; } }
    .tpl-actions { display: flex; gap: 8px; .icon-btn { background: rgba(255,255,255,0.05); border: none; width: 32px; height: 32px; border-radius: 4px; color: $text-sub; cursor: pointer; &:hover { background: white; color: black; } &.danger:hover { background: #ef4444; color: white; } } }
  }
}

// 上传弹窗
.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin: 20px 0;
  
  .upload-item {
    .upload-label { font-size: 13px; color: $text-main; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; &.code-label { color: $accent; } }
    
    .drop-area {
      height: 120px;
      border: 1px dashed $border;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: $text-sub;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 12px;
      
      .el-icon { font-size: 24px; margin-bottom: 8px; }
      
      &:hover { border-color: $primary; color: $primary; background: rgba($primary, 0.05); }
      &.code-area:hover { border-color: $accent; color: $accent; background: rgba($accent, 0.05); }
    }
  }
}

.tips-box {
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.2);
  padding: 10px;
  border-radius: 6px;
  p { margin: 0; font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 6px; }
}

// 按钮通用
.btn-cyber {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  
  &.primary { background: $primary; color: white; &:hover { background: lighten($primary, 5%); } }
  &.secondary { background: transparent; border: 1px solid $text-sub; color: $text-sub; &:hover { border-color: white; color: white; } }
  &.small { font-size: 12px; padding: 6px 12px; }
}

// 弹窗穿透
:global(.admin-dialog) {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 12px !important;
  
  .el-dialog__header { border-bottom: 1px solid rgba(255,255,255,0.05); margin-right: 0; }
  .el-dialog__title { color: white !important; }
  .el-dialog__body { padding: 24px !important; }
  .el-dialog__footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 16px 24px !important; .dialog-footer { display: flex; justify-content: flex-end; gap: 12px; } }
  
  // Form 样式强制覆盖
  .el-form-item__label { color: #e2e8f0 !important; }
  .el-input__wrapper, .el-select__wrapper {
    background-color: rgba(255,255,255,0.05) !important;
    box-shadow: none !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    .el-input__inner { color: white !important; }
  }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateX(10px); }
</style>