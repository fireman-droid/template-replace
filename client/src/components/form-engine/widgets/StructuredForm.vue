<template>
  <div class="structured-form">
    <SimpleFields 
      :config="config" 
      :model-value="modelValue" 
      :global-config="globalConfig"
    />
  </div>
</template>

<script setup>
import SimpleFields from './SimpleFields.vue'

// 接收标准 Props (与 GroupFactory 传递的一致)
const props = defineProps({
  config: { 
    type: Object, 
    required: true 
  },
  modelValue: { 
    type: Object, 
    required: true 
  },
  globalConfig: { 
    type: Object, 
    required: true 
  }
})
</script>

<style scoped lang="scss">
.structured-form {
  // 如果需要，可以在这里添加特定的样式
  // 例如给“事实与理由”部分加一个特殊的背景或边框
  //目前保持为空，与 SimpleFields 样式一致
}
</style>