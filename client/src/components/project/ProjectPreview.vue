<template>
  <div class="preview-panel">
    <div class="preview-placeholder" v-show="loading">
      <div class="scan-line"></div>
      <el-icon class="icon-large"><DocumentChecked /></el-icon>
      <p>实时预览正在准备</p>
      <div class="loading-lines">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="template" ref="docxRef" v-show="!loading"></div>
  </div>
</template>


<script setup>
import { DocumentChecked } from '@element-plus/icons-vue'
import { watch, ref } from 'vue'
import { useTemplateStore } from '@/stores'
import { renderAsync } from 'docx-preview' // 引入库
import testData from "@/utils/test.json"; // 引入测试数据
import { debounce } from '@/utils/debounce' // 引入你项目里的防抖工具
const currentFormData = ref(testData)

const props = defineProps({
  caseId: Number
})

const templateStore = useTemplateStore()
const docxRef = ref(null)
const loading = ref(true)

// 核心渲染函数
const renderPreview = async (data) => {
  if (!docxRef.value) return
  
  // 如果没有数据，渲染原文件；如果有数据，渲染填充后的文件
  const hasData = data && Object.keys(data).length > 0
  
  try {
    let blobToRender = null
    
    if (hasData) {
      // 实时生成填充后的 Blob - 如果 data 是 ref，传递 .value
      const actualData = data?.value !== undefined ? data.value : data;
      blobToRender = await templateStore.generateFilledBlob(actualData)
    } else {
      // 使用原始文件
      blobToRender = templateStore.templateFile
    }

    if (blobToRender) {
      docxRef.value.innerHTML = '' // 清空旧内容
      await renderAsync(blobToRender, docxRef.value, undefined, {
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

// 创建防抖版本的渲染函数，延迟 500ms 执行，避免打字时卡顿
const debouncedRender = debounce((newData) => {
  loading.value = true
  renderPreview(newData)
}, 800)

// 监听表单数据变化
watch(() => props.formData, (newData) => {
  if(newData) {
    debouncedRender(newData)
  }
}, { deep: true }) // 开启深度监听

// 监听 caseId 加载模版（初始化）
watch(() => props.caseId, async (newId) => {
  if (newId) {
    loading.value = true
    await templateStore.loadFile(newId)
    // 初始渲染一次（使用当前已有的 formData）
    renderPreview(currentFormData.value)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
$bg-dark: #1e1e20; // 深色阅读背景
$primary: #3b82f6; // 科技蓝
$text-gray: #94a3b8;
$scrollbar-track: #2b2b2e;
$scrollbar-thumb: #4c4c50;

.preview-panel {
  height: 100%;
  width: 100%;
  background: $bg-dark;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  
  // --- 加载遮罩样式 ---
  .preview-placeholder {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgba($bg-dark, 0.95);
    backdrop-filter: blur(10px);
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

    p {
      font-size: 14px;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }

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

  // --- 文档容器样式 ---
  .template {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 40px 0; // 上下留白
    background: #252528; // 比面板稍浅一点，衬托纸张
    :deep(.docx-content-wrapper){
      background-color: wheat;
    }
    :deep(.docx-content){
      width: auto !important;
      background-color: wheat;
    }
    // 自定义滚动条
    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-track { background: $scrollbar-track; }
    &::-webkit-scrollbar-thumb { 
      background: $scrollbar-thumb; 
      border-radius: 4px;
      &:hover { background: lighten($scrollbar-thumb, 10%); }
    }
  }
}

// 动画定义
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