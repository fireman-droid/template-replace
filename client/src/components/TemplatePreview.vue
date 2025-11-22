<template>
  <div class="template-preview">
    <!-- 基本信息区域 -->
    <div class="preview-header">
      <h2 class="template-name">{{ template.name }}</h2>
      <div class="meta-info">
        <span class="meta-tag">{{ template.category }}</span>
        <span class="meta-text">创建于 {{ formatDate(template.created_at) }}</span>
      </div>
      <p class="template-desc">{{ template.description || '暂无描述' }}</p>
    </div>

    <!-- 三栏内容区域 -->
    <div class="preview-grid">
      <!-- Word 模板 -->
      <div class="preview-item">
        <div class="item-header">
          <el-icon><Document /></el-icon>
          <span>Word 模版 (.docx)</span>
        </div>
        <div class="item-content">
          <div v-if="template.file_path" class="file-info">
            <div class="file-icon">
              <el-icon size="48"><Document /></el-icon>
            </div>
            <p class="file-name">{{ template.file_path }}</p>
            <el-button size="small" type="primary" @click="handleDownload">
              <el-icon><Download /></el-icon> 下载模板
            </el-button>
          </div>
          <div v-else class="empty-state">
            <el-icon size="48"><Document /></el-icon>
            <p>未上传 Word 模板</p>
          </div>
        </div>
      </div>

      <!-- 结构表 (Schema) -->
      <div class="preview-item">
        <div class="item-header">
          <el-icon><Connection /></el-icon>
          <span>结构表 (Schema)</span>
          <span class="header-badge" v-if="template.fields && template.fields.length > 0">
            {{ template.fields.length }} 个字段
          </span>
        </div>
        <div class="item-content scrollable">
          <div v-if="template.fields && template.fields.length > 0" class="json-preview">
            <pre>{{ JSON.stringify(template.fields, null, 2) }}</pre>
          </div>
          <div v-else class="empty-state">
            <el-icon size="48"><Connection /></el-icon>
            <p>暂无字段配置</p>
            <span class="empty-hint">用于定义表单结构</span>
          </div>
        </div>
      </div>

      <!-- 映射表 (Map) -->
      <div class="preview-item">
        <div class="item-header">
          <el-icon><Link /></el-icon>
          <span>映射表 (Map)</span>
          <span class="header-badge" v-if="template.mapping && Object.keys(template.mapping).length > 0">
            {{ Object.keys(template.mapping).length }} 个映射
          </span>
        </div>
        <div class="item-content scrollable">
          <div v-if="template.mapping && Object.keys(template.mapping).length > 0" class="json-preview">
            <pre>{{ JSON.stringify(template.mapping, null, 2) }}</pre>
          </div>
          <div v-else class="empty-state">
            <el-icon size="48"><Link /></el-icon>
            <p>暂无映射配置</p>
            <span class="empty-hint">Tag ↔ Key 映射关系</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Document, Connection, Link, Download } from '@element-plus/icons-vue'

const props = defineProps({
  template: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['download'])

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const handleDownload = () => {
  emit('download', props.template.id)
}
</script>

<style lang="scss" scoped>
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.1);

.template-preview {
  .preview-header {
    padding: 20px 24px;
    border-bottom: 1px solid $border;
    background: rgba(255,255,255,0.02);
    
    .template-name {
      font-size: 20px;
      color: $text-main;
      margin: 0 0 10px;
      font-weight: 700;
    }
    
    .meta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      
      .meta-tag {
        display: inline-block;
        padding: 3px 10px;
        background: rgba($primary, 0.2);
        color: $primary;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .meta-text {
        font-size: 12px;
        color: $text-sub;
      }
    }
    
    .template-desc {
      font-size: 13px;
      color: $text-sub;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    height: 450px;
    
    .preview-item {
      border-right: 1px solid $border;
      display: flex;
      flex-direction: column;
      height: 100%;
      
      &:last-child {
        border-right: none;
      }
      
      .item-header {
        background: rgba(255,255,255,0.03);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: $text-main;
        font-weight: 600;
        border-bottom: 1px solid $border;
        flex-shrink: 0;
        
        .el-icon {
          font-size: 16px;
          color: $accent;
        }
        
        .header-badge {
          margin-left: auto;
          padding: 2px 8px;
          background: rgba($accent, 0.2);
          color: $accent;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 500;
        }
      }
      
      .item-content {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        
        &.scrollable {
          overflow-y: auto;
          
          &::-webkit-scrollbar {
            width: 6px;
          }
          
          &::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
          }
          
          &::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            
            &:hover {
              background: rgba(255,255,255,0.3);
            }
          }
        }
        
        .file-info {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding-top: 20px;
          
          .file-icon {
            width: 64px;
            height: 64px;
            background: rgba($primary, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $primary;
          }
          
          .file-name {
            font-size: 11px;
            color: $text-sub;
            margin: 0;
            word-break: break-all;
            padding: 6px 10px;
            background: rgba(255,255,255,0.03);
            border-radius: 4px;
            width: 100%;
            max-height: 60px;
            overflow-y: auto;
            line-height: 1.4;
            
            &::-webkit-scrollbar {
              width: 4px;
            }
            
            &::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.05);
            }
            
            &::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.2);
              border-radius: 2px;
            }
          }
          
          .el-button {
            width: 100%;
          }
        }
        
        .empty-state {
          text-align: center;
          color: $text-sub;
          padding: 30px 20px;
          font-size: 13px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          
          .el-icon {
            color: rgba(255,255,255,0.1);
          }
          
          p {
            margin: 0;
            font-size: 13px;
            color: $text-sub;
          }
          
          .empty-hint {
            font-size: 11px;
            color: rgba(255,255,255,0.3);
          }
        }
        
        .json-preview {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid $border;
          border-radius: 6px;
          padding: 16px;
          flex: 1;
          
          pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 11px;
            color: #a9dc76;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        }
      }
    }
  }
}
</style>
