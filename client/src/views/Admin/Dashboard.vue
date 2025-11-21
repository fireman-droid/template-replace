<template>
  <div class="empty-state">
    <el-icon class="empty-icon" :size="60"><DataBoard /></el-icon>
    <p>仪表盘功能开发中...</p>
  </div>
</template>
<script setup>
import { DataBoard } from '@element-plus/icons-vue'
</script>
<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; }
.empty-icon { opacity: 0.5; margin-bottom: 16px; }
</style>