<template>
  <div id="app">
    <router-view />
    <ChatWidget />
  </div>
</template>

<script setup>
import ChatWidget from "@/components/chatWidget.vue";
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
  -webkit-user-select: none;
}

/* 允许输入框和文本域选中 */
input,
textarea,
[contenteditable="true"] {
  user-select: text;
  -webkit-user-select: text;
}

/* 全局滚动条样式 - 科技蓝 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #06b6d4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa, #22d3ee);
}

/* ========== Element Plus MessageBox 深色科技风覆盖 ========== */
.el-overlay {
  background-color: rgba(0, 0, 0, 0.7) !important;
  backdrop-filter: blur(4px);
}

.el-message-box {
  background: #0f172a !important;
  border: 1px solid rgba(6, 182, 212, 0.4) !important;
  border-radius: 4px !important;
  box-shadow:
    0 0 20px rgba(6, 182, 212, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.6) !important;
  padding: 20px !important;
}

.el-message-box__header {
  padding-bottom: 12px !important;
}

.el-message-box__title {
  color: #06b6d4 !important;
  font-weight: 600 !important;
  letter-spacing: 1px;
}

.el-message-box__headerbtn .el-message-box__close {
  color: #94a3b8 !important;
}
.el-message-box__headerbtn:hover .el-message-box__close {
  color: #06b6d4 !important;
}

.el-message-box__content {
  color: #e2e8f0 !important;
  font-size: 14px !important;
}

.el-message-box__status.el-icon {
  color: #f59e0b !important;
}

.el-message-box__btns {
  padding-top: 16px !important;
}

.el-message-box__btns .el-button--default {
  background: transparent !important;
  border: 1px solid rgba(148, 163, 184, 0.3) !important;
  color: #94a3b8 !important;
  border-radius: 2px !important;
}
.el-message-box__btns .el-button--default:hover {
  border-color: #06b6d4 !important;
  color: #06b6d4 !important;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
}

.el-message-box__btns .el-button--primary {
  background: rgba(239, 68, 68, 0.15) !important;
  border: 1px solid rgba(239, 68, 68, 0.5) !important;
  color: #ef4444 !important;
  border-radius: 2px !important;
}
.el-message-box__btns .el-button--primary:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}
</style>
