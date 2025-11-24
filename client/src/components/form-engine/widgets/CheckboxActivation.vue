<template>
  <div class="checkbox-activation" :class="{ active: isActive }">
    <div class="trigger-header">
      <el-checkbox v-model="isActive">
        <span class="trigger-title">{{ config.title }}</span>
      </el-checkbox>
    </div>

    <div 
      v-if="isActive && config.detail_fields && config.detail_fields.length > 0" 
      class="detail-body"
    >
      <SimpleFields 
        :config="{ fields: config.detail_fields }"
        :model-value="modelValue"
        :global-config="globalConfig"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SimpleFields from './SimpleFields.vue'

const props = defineProps({
  config: { type: Object, required: true },     // 包含 trigger_field_true, detail_fields 等
  modelValue: { type: Object, required: true }, // 表单数据 formData
  globalConfig: { type: Object, required: true }
})

const formData = props.modelValue

// 计算属性：智能处理勾选逻辑
const isActive = computed({
  get: () => {
    // 读取 formData 中对应字段的值
    return formData[props.config.trigger_field_true] === true
  },
  set: (val) => {
    // 1. 设置主字段 (例如 contract_has_issue = true)
    formData[props.config.trigger_field_true] = val
    
    // 2. 互斥逻辑：如果有 "false" 字段 (例如 contract_no_issue)，则设为相反值
    if (props.config.trigger_field_false) {
      formData[props.config.trigger_field_false] = !val
    }

    // 3. (可选) 如果取消勾选，可以在这里清空 detail_fields 里的数据
    // if (!val && props.config.detail_fields) {
    //   props.config.detail_fields.forEach(key => delete formData[key])
    // }
  }
})
</script>

<style scoped lang="scss">
.checkbox-activation {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 12px;
  transition: all 0.3s ease;

  // 悬停效果
  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  // 激活状态（勾选后）高亮显示
  &.active {
    background: rgba(59, 130, 246, 0.05); // 微微泛蓝
    border-color: rgba(59, 130, 246, 0.3);
  }
}

.trigger-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;

  .trigger-title {
    color: #e2e8f0;
    font-weight: 500; // 稍微加粗
    font-size: 14px;
    margin-left: 4px;
  }
}

.detail-body {
  padding: 16px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1); // 分隔线
  background: rgba(0, 0, 0, 0.1); //稍微深一点的背景，体现层级
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  
  // 动画过渡（可选）
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>