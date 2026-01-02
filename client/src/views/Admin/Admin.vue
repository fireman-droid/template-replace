<template>
  <div class="admin-container">
    <div class="cyber-grid"></div>
    
    <aside class="sidebar glass-panel">
      <div class="logo-area">
        <el-icon class="logo-icon"><ScaleToOriginal /></el-icon>
        <span class="title">FastReplace <span class="tag">ADMIN</span></span>
      </div>
      
      <ul class="nav-menu">
        <li :class="{ active: isActive('AdminDashboard') }" @click="navigateTo('AdminDashboard')">
          <el-icon><DataBoard /></el-icon> 仪表盘
        </li>
        <li :class="{ active: isActive('AdminUsers') }" @click="navigateTo('AdminUsers')">
          <el-icon><User /></el-icon> 用户管理
        </li>
        <li :class="{ active: isActive('AdminTemplates') }" @click="navigateTo('AdminTemplates')">
          <el-icon><Files /></el-icon> 模版核心
        </li>
        <li :class="{ active: isActive('AdminLogs') }" @click="navigateTo('AdminLogs')">
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
          <span class="path">管理控制台</span> / <span class="current">{{ currentTitle }}</span>
        </div>
        <div class="admin-info">
          <!-- <el-tag type="danger" effect="dark" size="small">ROOT 权限</el-tag> -->
          <el-avatar :size="32" class="avatar-root">A</el-avatar>
        </div>
      </header>

      <div class="content-body">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ScaleToOriginal, DataBoard, User, Files, Monitor, Back } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const currentTitle = computed(() => route.meta.title || '控制台')

const isActive = (name) => route.name === name

const navigateTo = (name) => {
  router.push({ name })
}

const handleExit = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$panel-bg: rgba(15, 23, 42, 0.6);
$primary: #3b82f6;
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

// 侧边栏样式
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

// 主内容区
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

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateX(10px); }
</style>