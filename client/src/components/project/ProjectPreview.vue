<template>
  <div class="preview-panel">
    <div class="preview-placeholder" v-show="loading">
      <div class="scan-line"></div>
      <el-icon class="icon-large"><DocumentChecked /></el-icon>
      <p>文档正在生成中...</p>
      <div class="loading-lines">
        <span></span><span></span><span></span>
      </div>
    </div>
    <div class="template" ref="docxRefA" v-show="!loading && activeContainer === 'A'"></div>
    <div class="template" ref="docxRefB" v-show="!loading && activeContainer === 'B'"></div>
  </div>
</template>

<script setup>
import { DocumentChecked } from '@element-plus/icons-vue'
import { watch, ref, onMounted } from 'vue'
import { useTemplateStore, useEditorStore } from '@/stores'
import { renderAsync } from 'docx-preview'
import { debounce } from '@/utils/debounce'
// 引入测试数据
import userData from '@/utils/userData.json'
const props = defineProps({
  caseId: Number
})

const templateStore = useTemplateStore()
const editorStore = useEditorStore()

// 双缓冲 Refs
const docxRefA = ref(null)
const docxRefB = ref(null)
const activeContainer = ref('A') // 当前显示的容器是 A 还是 B

// Loading 状态
const loading = ref(true)

// 核心渲染函数
const renderPreview = async () => {
  // 确保有两个容器引用
  if (!docxRefA.value || !docxRefB.value || !templateStore.templateFile) return
  
  // ⚠️ 核心修改：不再在这里设置 loading.value = true
  // 这样输入时就不会弹出遮罩了
  
  // 决定我们要渲染到哪个容器（永远渲染到当前【没在显示】的那个容器，以防白屏）
  const targetContainer = activeContainer.value === 'A' ? 'B' : 'A'
  const targetRef = targetContainer === 'A' ? docxRefA : docxRefB
  
  try {
    // 1. 拿数据
    const formData = editorStore.formData
    
    // 2. 生成 Blob
    // const blobToRender = await templateStore.generateFilledBlob(formData)
    const blobToRender = await templateStore.generateFilledBlob(userData)

    // 3. 渲染
    if (blobToRender) {
      targetRef.value.innerHTML = '' // 清空后台容器
      await renderAsync(blobToRender, targetRef.value, undefined, {
        className: 'docx-content',
        inWrapper: true,
        ignoreWidth: false
      })
      // 🔥 4. 渲染完成，瞬间切换显示，实现无感更新
      activeContainer.value = targetContainer
    }
  } catch (error) {
    console.error('预览渲染失败', error)
  } finally {
    // 无论如何，渲染结束时关闭 Loading（主要用于处理首次加载的情况）
    loading.value = false
  }
}

// 防抖渲染 (延迟 800ms)
const debouncedRender = debounce(renderPreview, 800)

// === 监听器 ===

// 1. 监听数据变化 (实时更新)
watch(
  () => editorStore.formData, 
  () => { debouncedRender() }, 
  { deep: true }
)

// 2. 监听模版文件 (文件加载)
watch(
  () => templateStore.templateFile,
  (newFile) => {
    if (newFile) {
      // 切换文件了，可以显示一下 Loading，提升感知
      loading.value = true 
      renderPreview()
    }
  }
)

// 3. 初始化
onMounted(() => {
  if (templateStore.templateFile) {
    renderPreview()
  }
})
</script>

<style lang="scss" scoped>
$bg-dark: #1e1e20;
$primary: #3b82f6;
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
  
  // --- 加载遮罩 ---
  .preview-placeholder {
    position: absolute;
    inset: 0;
    z-index: 20; // 确保遮罩在文档之上
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

    p { font-size: 14px; letter-spacing: 1px; margin-bottom: 20px; }
    .loading-lines span { 
      display: block; height: 2px; background: #334155; margin: 8px auto; border-radius: 2px;
      &:nth-child(1) { width: 200px; animation: loading 1.5s infinite 0s; }
      &:nth-child(2) { width: 160px; animation: loading 1.5s infinite 0.2s; }
      &:nth-child(3) { width: 180px; animation: loading 1.5s infinite 0.4s; }
    }
  }

  // --- 文档容器 ---
  .template {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 40px 0;
    background: #252528;
    :deep(.docx-content-wrapper){ background-color: transparent !important; padding: 0 !important; }
    :deep(.docx-content){
      background-color: white !important;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      margin: 0 auto !important;
    }

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
  0% { top: -20%; opacity: 0; } 20% { opacity: 1; } 100% { top: 120%; opacity: 0; } 
}
@keyframes loading { 
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); } 50% { opacity: 1; transform: scaleX(1); } 
}
@keyframes breathe {
  0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); }
}
</style>