<template>
  <div class="form-renderer">
    <div
      v-for="(section, index) in schema.root_sections"
      :key="section.id"
      class="form-section"
    >
      <div class="section-header" @click="toggleSection(section.id)">
        <div class="header-left">
          <el-icon
            class="collapse-icon"
            :class="{ 'is-collapsed': collapsedSections.has(section.id) }"
          >
            <ArrowRight />
          </el-icon>

          <h2 class="section-title">{{ section.title }}</h2>

          <span v-if="section.description" class="section-desc">
            <el-icon><InfoFilled /></el-icon> {{ section.description }}
          </span>
        </div>
      </div>

      <transition name="expand">
        <div class="groups-wrapper" v-show="!collapsedSections.has(section.id)">
          <GroupFactory
            v-for="group in section.groups"
            :key="group.id"
            :config="group"
            :model-value="modelValue"
            :global-config="globalConfig"
          />
        </div>
      </transition>

      <el-divider
        v-if="index < schema.root_sections.length - 1"
        class="cyber-divider"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { InfoFilled } from "@element-plus/icons-vue";
import GroupFactory from "./GroupFactory.vue";

// 接收父组件传来的大 JSON (schema) 和 表单数据 (modelValue)
const props = defineProps({
  schema: { type: Object, required: true },
  modelValue: { type: Object, required: true },
  mapping: { type: Object, default: () => ({}) }, // 备用：后端传来的 Label 映射
});

// 构造全局配置对象，方便子组件（GroupFactory -> Widgets）直接查阅
// 我们在这里把 presets 和 field_config 合并处理，方便下游使用
const globalConfig = computed(() => ({
  mapping: props.mapping, // 字段中文名
  types: props.schema.field_config || {}, // 字段特殊定义
  presets: props.schema.presets || {}, // 预设模版
}));

// 记录被折叠的章节 ID (Set 结构更方便，存在的 ID 即为折叠状态)
const collapsedSections = ref(new Set());
const toggleSection = (sectionId) => {
  if (collapsedSections.value.has(sectionId)) {
    collapsedSections.value.delete(sectionId);
  } else {
    collapsedSections.value.add(sectionId);
  }
};
</script>

<style scoped lang="scss">
.form-section {
  margin-bottom: 40px;
  animation: fadeIn 0.5s ease-in-out;
}

.section-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center; // 垂直居中
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
  cursor: pointer; // 1. 变成小手，提示可点击
  user-select: none; // 防止双击选中文字
  transition: background-color 0.5s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

// 2. 箭头图标样式及旋转逻辑
.collapse-icon {
  font-size: 14px;
  color: #94a3b8;
  transition: transform 0.3s ease;
  transform: rotate(90deg); // 默认向下（展开状态）

  &.is-collapsed {
    transform: rotate(0deg); // 折叠时向右
  }
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

// 3. 简单的展开/收起动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px; // 给一个足够大的高度
  opacity: 1;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
