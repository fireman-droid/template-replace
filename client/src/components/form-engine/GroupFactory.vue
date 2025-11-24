<script setup>
import { computed, defineAsyncComponent } from 'vue'

// === 1. 异步引入原子组件 (Widgets) ===
// 使用 defineAsyncComponent 是最佳实践，既能实现懒加载，又能完美解决组件间可能存在的循环引用问题
const SimpleFields = defineAsyncComponent(() => import('./widgets/SimpleFields.vue'))
const CheckboxActivation = defineAsyncComponent(() => import('./widgets/CheckboxActivation.vue'))
const DynamicList = defineAsyncComponent(() => import('./widgets/DynamicList.vue'))
const GroupList = defineAsyncComponent(() => import('./widgets/GroupList.vue'))

// === 2. 接收 Props ===
const props = defineProps({
  config: { 
    type: Object, 
    required: true 
  }, // 当前组的配置节点 (JSON片段)
  
  modelValue: { 
    type: Object, 
    required: true 
  }, // 表单数据对象 (formData)
  
  globalConfig: { 
    type: Object, 
    required: true 
  } // 全局配置 (包含 mapping, field_config, presets)
})

// === 3. 核心映射表：ui_mode -> Vue Component ===
const componentMap = {
  // --- A. 基础展示类 (都由 SimpleFields 承接) ---
  // 无论是全宽文本、单选组还是结构化表单，本质都是“排列字段”，SimpleFields 足够智能处理它们
  'simple_fields': SimpleFields,
  'textarea_full_width': SimpleFields,
  'radio_group_boolean': SimpleFields,
  'structured_form': SimpleFields, 

  // --- B. 交互逻辑类 ---
  'checkbox_activation': CheckboxActivation, // 场景：诉讼请求 (勾选后显示详情)
  'conditional_section': CheckboxActivation, // 场景：代理人 (有/无开关控制显示)
  
  // --- C. 复杂列表类 ---
  'dynamic_list': DynamicList, // 场景：原告/被告 (支持动态添加、删除行)
  'group_list': GroupList      // 场景：诉讼请求列表 (单纯的容器，用于遍历渲染子项)
}

// === 4. 计算最终组件 ===
const currentComponent = computed(() => {
  const mode = props.config.ui_mode
  // 如果 map 里找不到对应的组件，默认回退到 SimpleFields (兜底策略)
  return componentMap[mode] || SimpleFields
})
</script>

<template>
  <component 
    :is="currentComponent"
    :config="config"
    :model-value="modelValue"
    :global-config="globalConfig"
    class="group-factory-item"
  />
</template>

<style scoped lang="scss">
.group-factory-item {
  // 这里可以添加一些通用的过渡效果或间距
  position: relative;
  transition: all 0.3s ease;
}
</style>