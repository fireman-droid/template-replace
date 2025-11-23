<template>
  <div class="form-renderer">
    <!-- <div 
      v-for="(section, index) in schema.root_sections" 
      :key="section.id" 
      class="form-section"
    >
      <div class="section-header">
        <h2 class="section-title">{{ section.title }}</h2>
        <span v-if="section.description" class="section-desc">
          <el-icon><InfoFilled /></el-icon> {{ section.description }}
        </span>
      </div>

      <div class="groups-wrapper">
        <GroupFactory
          v-for="group in section.groups"
          :key="group.id"
          :config="group"
          :model-value="modelValue"
          :global-config="globalConfig"
        />
      </div>
      
      <el-divider v-if="index < schema.root_sections.length - 1" class="cyber-divider" />
    </div> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import GroupFactory from './GroupFactory.vue'

// 接收父组件传来的大 JSON (schema) 和 表单数据 (modelValue)
const props = defineProps({
  schema: { type: Object, required: true },
  modelValue: { type: Object, required: true },
  mapping: { type: Object, default: () => ({}) } // 备用：后端传来的 Label 映射
})

// 构造全局配置对象，方便子组件（GroupFactory -> Widgets）直接查阅
// 我们在这里把 presets 和 field_config 合并处理，方便下游使用
const globalConfig = computed(() => ({
  mapping: props.mapping, // 字段中文名
  types: props.schema.field_config || {}, // 字段特殊定义
  presets: props.schema.presets || {} // 预设模版
}))
</script>

<style scoped lang="scss">
.form-section {
  margin-bottom: 40px;
  animation: fadeIn 0.5s ease-in-out;
}

.section-header {
  margin-bottom: 24px;
  display: flex;
  align-items: baseline;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
}

.section-title {
  font-size: 18px;
  color: #fff;
  font-weight: 600;
  border-left: 4px solid #3b82f6;
  padding-left: 12px;
  margin: 0;
  letter-spacing: 0.5px;
}

.section-desc {
  color: #94a3b8;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
}

.groups-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cyber-divider {
  border-color: rgba(255, 255, 255, 0.05);
  margin: 40px 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>