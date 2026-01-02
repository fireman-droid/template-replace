<template>
  <div class="template-preview-container">
    <div class="preview-header">
      <div class="header-left">
        <h2 class="template-name">{{ template.name }}</h2>
        <div class="meta-row">
          <span class="time-text">创建于 {{ formatDate(template.created_at) }}</span>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" plain @click="handleDownload">
          <el-icon><Download /></el-icon> 下载源文件
        </el-button>
      </div>
    </div>
    
    <div class="preview-desc">
      <p>{{ template.description || '暂无描述' }}</p>
    </div>

    <div class="preview-body">
      <div class="preview-col">
        <div class="col-header">
          <el-icon><Document /></el-icon> Word 模版
        </div>
        <div class="col-content file-mode">
          <div v-if="template.file_path" class="file-card">
            <div class="file-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="file-info">
              <span class="filename">{{ template.file_path }}</span>
              <span class="filesize">DOCX 文档</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon><DocumentDelete /></el-icon>
            <span>未上传模版文件</span>
          </div>
        </div>
      </div>

      <div class="preview-col wide">
        <div class="col-header">
          <el-icon><Connection /></el-icon> MarkData 配置
          <span class="count-badge" v-if="template.markData">已配置</span>
        </div>
        <div class="col-content code-mode">
          <pre v-if="template.markData && Object.keys(template.markData).length">{{ JSON.stringify(template.markData, null, 2) }}</pre>
          <div v-else class="empty-state">暂无配置数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Document, Connection, Link, Download, DocumentDelete } from '@element-plus/icons-vue'
const props = defineProps({
  template: { type: Object, required: true }
})

const emit = defineEmits(['download'])

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatCategory = (val) => {
  const map = { divorce: '离婚纠纷', sales: '买卖合同', house: '房屋租赁' }
  return map[val] || val
}

const handleDownload = () => {
  emit('download', props.template.id)
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$border: rgba(255,255,255,0.1);
$primary: #3b82f6;
$text-main: #e2e8f0;
$text-sub: #94a3b8;

.template-preview-container {
  height: 70vh; // 控制整体高度，适应弹窗
  display: flex;
  flex-direction: column;
  color: $text-main;

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid $border;
    padding: 10px 0;
    .template-name {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: white;
    }
    
    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      .category-badge {
        background: rgba($primary, 0.15);
        color: $primary;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid rgba($primary, 0.3);
      }
      
      .time-text { color: $text-sub; }
    }
  }

  .preview-desc {
    padding: 16px 0;
    font-size: 13px;
    color: $text-sub;
    line-height: 1.5;
  }

  .preview-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 2fr; // Word 窄一点，MarkData 宽一点
    gap: 16px;
    min-height: 0; // 关键：允许 Flex 子项收缩
    
    .preview-col {
      background: rgba(255,255,255,0.03);
      border: 1px solid $border;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .col-header {
        padding: 12px;
        background: rgba(255,255,255,0.05);
        border-bottom: 1px solid $border;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .count-badge {
          margin-left: auto;
          font-size: 11px;
          background: rgba(0,0,0,0.3);
          padding: 1px 6px;
          border-radius: 10px;
          color: $text-sub;
        }
      }

      .col-content {
        flex: 1;
        overflow-y: auto; // 独立滚动条
        padding: 12px;
        
        // 滚动条样式
        &::-webkit-scrollbar { width: 6px; }
        &::-webkit-scrollbar-track { background: transparent; }
        &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; &:hover { background: rgba(255,255,255,0.2); } }

        &.code-mode {
          font-family: 'Consolas', monospace;
          font-size: 12px;
          color: #a5d6ff; // 代码高亮色
          white-space: pre-wrap;
          word-break: break-all;
        }

        &.file-mode {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-card {
          text-align: center;
          .file-icon { font-size: 48px; color: $primary; margin-bottom: 8px; }
          .filename { display: block; font-size: 12px; margin-bottom: 4px; word-break: break-all; }
          .filesize { font-size: 11px; color: $text-sub; }
        }

        .empty-state {
          color: $text-sub;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          opacity: 0.6;
        }
      }
    }
  }
}
</style>