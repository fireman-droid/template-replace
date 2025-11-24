<template>
  <div class="group-list">
    <div v-if="config.title" class="list-header">
      <h4 class="title">{{ config.title }}</h4>
      <span v-if="config.description" class="desc">{{ config.description }}</span>
    </div>

    <div class="list-body">
      <div 
        v-for="(item, index) in config.items" 
        :key="index" 
        class="list-item-wrapper"
      >
        <GroupFactory 
          :config="item"
          :model-value="modelValue"
          :global-config="globalConfig"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

// 异步引入父级工厂，实现递归渲染
// 注意路径是返回上一级找到 GroupFactory.vue
const GroupFactory = defineAsyncComponent(() => import('../GroupFactory.vue'))

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
.group-list {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
}

.list-header {
  margin-bottom: 20px;
  
  .title {
    margin: 0;
    font-size: 16px;
    color: #e2e8f0;
    border-left: 3px solid #06b6d4; // 使用青色区分于大章节的蓝色
    padding-left: 10px;
    font-weight: 600;
  }
  
  .desc {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
    margin-left: 13px; // 对齐文字
  }
}

.list-body {
  display: flex;
  flex-direction: column;
  gap: 16px; // 列表项之间的间距
}

.list-item-wrapper {
  // 这是一个容器，包裹着具体的 CheckboxActivation 或 SimpleFields
  // 我们在这里不做过多样式干扰，主要负责间距
}
</style>