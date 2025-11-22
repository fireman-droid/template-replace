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
import { ElMessage } from 'element-plus'
import { renderAsync } from 'docx-preview' // 引入库

const props = defineProps({
  caseId: Number
})

const templateStore = useTemplateStore()
const docxRef = ref(null)
const loading = ref(true)

const renderDocx = async () => {
  if (!docxRef.value) return
  loading.value = true
  try {
    docxRef.value.innerHTML = ''
    await renderAsync(templateStore.templateFile, docxRef.value, undefined, {
      className: 'docx-content', // 给生成的文档内容加类名，方便写 CSS
      inWrapper: true,           // 启用包装器模式
      ignoreWidth: false,        // 是否忽略文档宽度
      experimental: true         // 开启实验性功能（渲染效果更好）
    })
    console.log('文档渲染成功')  // ← 添加成功日志
  } catch (error) {
    console.error('预览失败', error)
    ElMessage.error('无法加载模版文件')
  } finally {
    loading.value=false
  }
}

// 监听 caseId 变化，加载和解析模板
watch(() => props.caseId, async (newCaseId) => {
  if (!newCaseId) return
  
  try {
    console.log('开始加载模板，caseId:', newCaseId)
    
    // 1. 先加载模板文件
    await templateStore.loadFile(newCaseId)
    console.log('模板文件加载成功')
    
    // // 2. 再解析 XML（如果需要的话）
    // await templateStore.parseXml()
    // console.log('模板解析成功')
    await renderDocx()
  } catch (error) {
    console.error('加载模板失败:', error)
    ElMessage.error('加载模板失败: ' + error.message)
    loading.value = false
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