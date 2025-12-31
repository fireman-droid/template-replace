<template>
  <div class="simple-fields">
    <h4 v-if="config.title" class="widget-title">{{ config.title }}</h4>

    <el-form-item>
      <el-row :gutter="24" style="width: 100%">
        <template v-for="fieldKey in config.fields" :key="fieldKey">
          <el-col v-if="isSeparator(fieldKey)" :span="24" class="separator-col">
            <div class="section-divider">
              <span class="label">{{ getSeparatorLabel(fieldKey) }}</span>
              <div class="line"></div>
            </div>
          </el-col>

          <el-col v-else :span="getColSpan(fieldKey)">
            <el-form-item :label="getFieldLabel(fieldKey)">
              <component
                :is="getFieldComponent(fieldKey)"
                v-model="formData[fieldKey]"
                v-bind="getFieldProps(fieldKey)"
                style="width: 100%"
              >
                <template v-if="hasOptions(fieldKey)">
                  <component
                    :is="getOptionComponent(fieldKey)"
                    v-for="opt in getFieldOptions(fieldKey)"
                    :key="opt.value"
                    :label="opt.value"
                  >
                    {{ opt.label }}
                    <div
                      v-if="opt.hasInput"
                      style="display: inline-block; margin-left: 10px"
                      @click.stop
                    >
                      <el-input
                        v-model="formData[opt.inputKey]"
                        :placeholder="opt.placeholder || '请输入'"
                        size="small"
                        style="width: 160px"
                      />
                    </div>
                  </component>
                </template>
              </component>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form-item>
  </div>
</template>

<script setup>
import { getComponentType } from "../fieldRegistry";

const props = defineProps({
  config: { type: Object, required: true },
  modelValue: { type: Object, required: true },
  globalConfig: { type: Object, required: true },
});

const formData = props.modelValue;

// === 宽度计算 (保持不变) ===
const getColSpan = (key) => {
  const def = getFieldDef(key);
  if (def.span) return def.span;
  const type = def.type || "input";
  if (type === "textarea" || hasOptions(key) || key.includes("addr")) return 24;
  return 12;
};

// === 辅助函数 (保持不变) ===
const isSeparator = (key) => typeof key === "string" && key.startsWith("//_");
const getSeparatorLabel = (key) => {
  const map = {
    "//_unit_types": "单位类型",
    "//_ownership": "所有制性质",
    "//_natural_person_title": "基本信息",
    "//_legal_entity_title": "基本信息",
  };
  return map[key] || props.globalConfig.mapping[key] || key.replace("//_", "");
};
const getFieldDef = (key) => {
  let def = props.globalConfig.types[key];
  if (typeof def === "string") def = props.globalConfig.presets[def];
  return def || {};
};
const getFieldLabel = (key) =>
  props.globalConfig.mapping[key] || getFieldDef(key).label || key;
const getFieldType = (key) => getFieldDef(key).type || "input";
const getFieldComponent = (key) => {
  const type = getFieldType(key);
  if (type === "checkbox_input") return "el-checkbox";
  if (type === "checkbox" && !getFieldOptions(key).length) return "el-checkbox";
  return getComponentType(type);
};
const getFieldProps = (key) => getFieldDef(key).props || {};
const getFieldOptions = (key) => getFieldDef(key).options || [];
const hasOptions = (key) => {
  const type = getFieldType(key);
  return (
    ["radio", "checkbox"].includes(type) && getFieldOptions(key).length > 0
  );
};
const getOptionComponent = (key) =>
  getFieldType(key) === "radio" ? "el-radio" : "el-checkbox";
</script>

<style scoped lang="scss">
.simple-fields {
  padding:0 5%;
}

/* 样式保持不变 */
.widget-title {
  font-size: 16px;
  color: #fff;
  margin: 0 0 24px 0;
  font-weight: 600;
  padding-left: 10px;
  border-left: 4px solid #3b82f6;
}
:deep(.el-form-item) {
  margin-bottom: 24px !important;
}
.separator-col {
  margin-top: 32px;
  margin-bottom: 24px;
}
.section-divider {
  display: flex;
  align-items: center;
  width: 100%;
  .label {
    font-size: 14px;
    font-weight: 700;
    color: #06b6d4;
    margin-right: 12px;
    background: rgba(6, 182, 212, 0.15);
    padding: 4px 10px;
    border-radius: 4px;
  }
  .line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }
}
/* 修复 checkbox 组换行问题，让长选项也能正常显示 */
:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
:deep(.el-checkbox) {
  height: auto;
  padding: 5px 0;
  margin-right: 20px;
}
</style>
