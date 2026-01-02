<template>
  <div class="preview-panel">
    <div class="preview-placeholder" v-if="loading">
      <div class="scan-line"></div>
      <el-icon class="icon-large"><DocumentChecked /></el-icon>
      <p>文档正在生成中...</p>
      <div class="loading-lines">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="template" ref="docxRef" v-show="!loading"></div>
  </div>
</template>

<script setup>
import { DocumentChecked } from '@element-plus/icons-vue'
import { ref, watch, nextTick } from 'vue'
import { useTemplateStore, useEditorStore } from '@/stores'
import { renderAsync } from 'docx-preview'

const props = defineProps({
  visible: Boolean // 抽屉是否可见
})

const templateStore = useTemplateStore()
const editorStore = useEditorStore()

const docxRef = ref(null)
const loading = ref(false)

// 渲染预览
const renderPreview = async () => {
  if (!docxRef.value || !templateStore.templateFile) return
  
  loading.value = true
  
  try {
    const formData = editorStore.formData
    const blob = await templateStore.generateFilledBlob(formData)
    
    if (blob && docxRef.value) {
      docxRef.value.innerHTML = ''
      await renderAsync(blob, docxRef.value, undefined, {
        className: 'docx-content',
        inWrapper: true,
        ignoreWidth: false
      })
    }
  } catch (error) {
    console.error('预览渲染失败', error)
  } finally {
    loading.value = false
  }
}

// 只在抽屉打开时渲染
watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      await nextTick() // 等待 DOM 更新
      renderPreview()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
$bg-dark: #1e1e20;
$primary: #3b82f6;
$text-gray: #94a3b8;

.preview-panel {
  height: 100%;
  width: 100%;
  background: $bg-dark;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  .preview-placeholder {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba($bg-dark, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: $text-gray;
    
    .scan-line {
      position: absolute;
      top: -50%;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, $primary, transparent);
      box-shadow: 0 0 20px $primary;
      animation: scan 2.5s infinite linear;
      opacity: 0.6;
    }

    .icon-large { 
      font-size: 64px; 
      margin-bottom: 20px; 
      color: #475569;
      animation: breathe 2s infinite ease-in-out;
    }

    p { font-size: 14px; letter-spacing: 1px; margin-bottom: 20px; }
    
    .loading-lines span { 
      display: block; 
      height: 2px; 
      background: #334155; 
      margin: 8px auto; 
      border-radius: 2px;
      &:nth-child(1) { width: 200px; animation: loading 1.5s infinite 0s; }
      &:nth-child(2) { width: 160px; animation: loading 1.5s infinite 0.2s; }
      &:nth-child(3) { width: 180px; animation: loading 1.5s infinite 0.4s; }
    }
  }

  .template {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 40px 0;
    background: #252528;
    
    :deep(.docx-content-wrapper) { 
      background-color: transparent !important; 
      padding: 0 !important; 
    }
    
    :deep(.docx-content) {
      background-color: white !important;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      margin: 0 auto !important;
    }

    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-track { background: #2b2b2e; }
    &::-webkit-scrollbar-thumb { 
      background: linear-gradient(180deg, #3b82f6, #06b6d4);
      border-radius: 4px;
      &:hover { background: linear-gradient(180deg, #60a5fa, #22d3ee); }
    }
  }
}

@keyframes scan { 
  0% { top: -20%; opacity: 0; } 
  20% { opacity: 1; } 
  100% { top: 120%; opacity: 0; } 
}

@keyframes loading { 
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); } 
  50% { opacity: 1; transform: scaleX(1); } 
}

@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scale(1); } 
  50% { opacity: 1; transform: scale(1.05); }
}
</style>
