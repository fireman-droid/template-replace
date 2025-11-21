<template>
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
</template>

<script setup>
import { DocumentChecked } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
$primary: #3b82f6;
$text-gray: #94a3b8;

.preview-panel {
  height: 100%;
  background: #020617;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(0,0,0,0.5);
  overflow: hidden;
  
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

@keyframes scan { 0% { top: -50%; } 100% { top: 150%; } }
@keyframes loading { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
</style>