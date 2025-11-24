<template>
  <div class="simple-fields">
    <h4 v-if="config.title" class="widget-title">{{ config.title }}</h4>
    
    <el-row :gutter="20">
      <el-col 
        v-for="fieldKey in config.fields" 
        :key="fieldKey" 
        :span="isFullWidth(fieldKey) ? 24 : 12"
      >
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
              </component>
            </template>
          </component>

        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { getComponentType } from '../fieldRegistry' // 引入映射工具

const props = defineProps({
  config: { type: Object, required: true },      // 当前组配置 (JSON中的 group)
  modelValue: { type: Object, required: true },  // 表单数据 (formData)
  globalConfig: { type: Object, required: true } // 全局配置 (含 types, presets, mapping)
})

// 直接使用引用，实现双向绑定
const formData = props.modelValue

// === 辅助函数：从全局配置中提取信息 ===

// 1. 获取字段定义 (合并 field_config 和 presets 的逻辑)
const getFieldDef = (key) => {
  // A. 先看 field_config 里有没有定义
  let def = props.globalConfig.types[key]
  
  // B. 如果定义是字符串 (如 "std_date")，说明引用了 preset，去 presets 里找
  if (typeof def === 'string') {
    def = props.globalConfig.presets[def]
  }
  
  // C. 如果没定义，给个空对象 (后续会回退到默认 input)
  return def || {}
}

// 2. 获取显示名称 (优先用 Mapping，没有则用 Key)
const getFieldLabel = (key) => {
  // 优先顺序：mapping.json -> field_config.label -> 字段名本身
  return props.globalConfig.mapping[key] || getFieldDef(key).label || key
}

// 3. 获取组件类型字符串 (如 'date', 'input')
const getFieldType = (key) => {
  return getFieldDef(key).type || 'input'
}

// 4. 获取 Element 组件名 (如 'el-date-picker')
const getFieldComponent = (key) => {
  const type = getFieldType(key)
  
  // 特殊处理：checkbox_input (带输入的勾选框)，暂时先当普通 checkbox 渲染
  if (type === 'checkbox_input') return 'el-checkbox'
  
  // 特殊处理：如果是 checkbox 且没有 options，说明是单个布尔值开关 (如“是否”)
  // 这种情况下我们用 el-checkbox 即可，不需要 el-checkbox-group
  if (type === 'checkbox' && !getFieldOptions(key).length) {
    return 'el-checkbox'
  }
  
  return getComponentType(type)
}

// 5. 获取组件属性 (placeholder, rows 等)
const getFieldProps = (key) => {
  return getFieldDef(key).props || {}
}

// 6. 获取选项 (用于 radio/checkbox group)
const getFieldOptions = (key) => {
  return getFieldDef(key).options || []
}

// 7. 判断是否有子选项
const hasOptions = (key) => {
  const type = getFieldType(key)
  return ['radio', 'checkbox'].includes(type) && getFieldOptions(key).length > 0
}

// 8. 获取子选项组件名
const getOptionComponent = (key) => {
  return getFieldType(key) === 'radio' ? 'el-radio' : 'el-checkbox'
}

// 9. 判断是否占满一行
const isFullWidth = (key) => {
  // 如果是 textarea，或者是当前组显式设置为全宽
  const type = getFieldType(key)
  return type === 'textarea' || props.config.ui_mode === 'textarea_full_width'
}
</script>

<style scoped>
.simple-fields {
  /* 保持清爽，不需要太多样式 */
}

.widget-title {
  font-size: 14px;
  color: #3b82f6; /* 科技蓝 */
  margin: 0 0 15px 0;
  font-weight: 600;
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  line-height: 1;
}
</style>