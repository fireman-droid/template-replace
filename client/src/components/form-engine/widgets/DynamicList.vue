<template>
  <div class="dynamic-list">
    <div v-if="listData.length > 0" class="list-items">
      <transition-group name="list">
        <div 
          v-for="(item, index) in listData" 
          :key="index" 
          class="entity-card"
        >
          <div class="card-header">
            <div class="header-left">
              <el-tag size="small" effect="dark" class="index-tag">#{{ index + 1 }}</el-tag>
              <span class="role-label">{{ getRoleLabel(item.type) }}</span>
            </div>
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="removeItem(index)"
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </div>

          <div class="card-body">
            <SimpleFields 
              v-if="getFieldsForType(item.type)"
              :config="{ fields: getFieldsForType(item.type) }"
              :model-value="item"
              :global-config="globalConfig"
            />
          </div>
        </div>
      </transition-group>
    </div>

    <div v-else class="empty-state">
      <span>暂无信息，请点击下方按钮添加</span>
    </div>

    <div v-if="config.allow_add" class="add-bar">
      <el-dropdown 
        v-if="typeOptions.length > 1" 
        @command="handleAddItem"
        trigger="click"
      >
        <el-button type="primary" plain class="add-btn">
          <el-icon><Plus /></el-icon> 添加{{ shortTitle }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item 
              v-for="opt in typeOptions" 
              :key="opt.value" 
              :command="opt.value"
            >
              {{ opt.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button 
        v-else 
        type="primary" 
        plain 
        class="add-btn"
        @click="handleAddItem(typeOptions[0].value)"
      >
        <el-icon><Plus /></el-icon> 添加{{ shortTitle }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Plus, Delete, ArrowDown } from '@element-plus/icons-vue'
import SimpleFields from './SimpleFields.vue'

const props = defineProps({
  config: { type: Object, required: true },      // 包含 fields_mapping 等配置
  modelValue: { type: Object, required: true },  // 全局 formData
  globalConfig: { type: Object, required: true }
})

// === 1. 数据绑定 ===
// 我们需要把 formData[config.id] 初始化为一个数组
// 例如：formData.group_plaintiff = []
const listKey = props.config.id || 'unknown_list'

// 确保数据是数组
if (!Array.isArray(props.modelValue[listKey])) {
  props.modelValue[listKey] = []
}

const listData = props.modelValue[listKey]

// === 2. 配置解析 ===
// 解析 type_selector 下的 options (自然人/法人)
const typeOptions = computed(() => {
  return props.config.fields_mapping?.type_selector?.options || []
})

const shortTitle = computed(() => {
  return props.config.title.replace(/^\d+\.\s*/, '').replace('信息', '')
})

// === 3. 辅助方法 ===

// 根据类型值获取显示名称 (例如 'natural' -> '自然人')
const getRoleLabel = (typeValue) => {
  const opt = typeOptions.value.find(o => o.value === typeValue)
  return opt ? opt.label : '未知类型'
}

// 根据类型值获取对应的字段列表 (fields array)
const getFieldsForType = (typeValue) => {
  const opt = typeOptions.value.find(o => o.value === typeValue)
  return opt ? opt.fields : []
}

// === 4. 交互动作 ===

const handleAddItem = (typeValue) => {
  // 向数组中 push 一个新对象，带有类型标识
  listData.push({
    type: typeValue,
    _key: Date.now() // 内部唯一key，防抖动
  })
}

const removeItem = (index) => {
  listData.splice(index, 1)
}
</script>

<style scoped lang="scss">
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entity-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 16px;

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    background: rgba(255, 255, 255, 0.04);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      .role-label { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    }
    
    .delete-btn:hover { color: #ef4444; }
  }

  .card-body {
    padding: 16px;
  }
}

.add-bar {
  display: flex;
  justify-content: center;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
  
  &:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  .add-btn {
    width: 200px;
  }
}

.empty-state {
  text-align: center;
  color: #64748b;
  font-size: 13px;
  padding: 20px;
  background: rgba(0,0,0,0.1);
  border-radius: 8px;
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>