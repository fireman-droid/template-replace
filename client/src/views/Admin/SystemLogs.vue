<template>
  <div class="empty-state">
    <el-icon class="empty-icon" :size="60"><Monitor /></el-icon>
    <p>日志系统接入中...</p>
  </div>
</template>
<script setup>
import { Monitor } from '@element-plus/icons-vue'
</script>
<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; }
.empty-icon { opacity: 0.5; margin-bottom: 16px; }
</style>