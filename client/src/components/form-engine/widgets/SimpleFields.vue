<template>
  <div class="simple-fields">
    <h4 v-if="config.title" class="widget-title">{{ config.title }}</h4>
    
    <el-form-item>
      <el-row :gutter="24" style="width: 100%">
        <template v-for="fieldKey in config.fields" :key="fieldKey">
          
          <el-col 
            v-if="isSeparator(fieldKey)" 
            :span="24" 
            class="separator-col"
          >
            <div class="section-divider">
              <span class="label">{{ getSeparatorLabel(fieldKey) }}</span>
              <div class="line"></div>
            </div>
          </el-col>

          <el-col 
            v-else 
            :span="getColSpan(fieldKey)"
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

        </template>
      </el-row>
    </el-form-item>
  </div>
</template>

<script setup>
import { getComponentType } from '../fieldRegistry'

const props = defineProps({
  config: { type: Object, required: true },
  modelValue: { type: Object, required: true },
  globalConfig: { type: Object, required: true }
})

const formData = props.modelValue

// === 核心：智能宽度计算 ===
const getColSpan = (key) => {
  // 1. 获取字段定义
  const def = getFieldDef(key)
  
  // 2. 【最高优先级】JSON 显式配置
  // 如果你在 field_config 里写了 "span": 24，那就听你的
  if (def.span) {
    return def.span
  }

  // 3. 【智能判断】根据字段类型自动调整
  const type = def.type || 'input'
  
  // A. 文本域 (textarea)：内容多，占一行
  if (type === 'textarea') return 24
  
  // B. 多选/单选组 (checkbox/radio)：选项多，占一行
  // hasOptions 检查它是否有 options 数组
  if (hasOptions(key)) return 24
  
  // C. 地址类字段：通常很长，占一行
  if (key.includes('addr') || key.includes('address')) return 24

  // 4. 【默认兜底】其他普通输入框、日期等，一行两个
  return 12 
}

// === 其他辅助函数 (保持不变) ===
const isSeparator = (key) => typeof key === 'string' && key.startsWith('//_')

const getSeparatorLabel = (key) => {
  const map = {
    '//_unit_types': '单位类型',
    '//_ownership': '所有制性质',
    '//_natural_person_title': '基本信息',
    '//_legal_entity_title': '基本信息',
    '//_legal_type': '单位类型'
  }
  return map[key] || props.globalConfig.mapping[key] || key.replace('//_', '')
}

const getFieldDef = (key) => {
  let def = props.globalConfig.types[key]
  if (typeof def === 'string') def = props.globalConfig.presets[def]
  return def || {}
}

const getFieldLabel = (key) => props.globalConfig.mapping[key] || getFieldDef(key).label || key
const getFieldType = (key) => getFieldDef(key).type || 'input'

const getFieldComponent = (key) => {
  const type = getFieldType(key)
  if (type === 'checkbox_input') return 'el-checkbox'
  // 单个 checkbox (如"是否") 不视为组，保持默认宽度，除非显式设置 span
  if (type === 'checkbox' && !getFieldOptions(key).length) return 'el-checkbox'
  return getComponentType(type)
}

const getFieldProps = (key) => getFieldDef(key).props || {}
const getFieldOptions = (key) => getFieldDef(key).options || []

const hasOptions = (key) => {
  const type = getFieldType(key)
  return ['radio', 'checkbox'].includes(type) && getFieldOptions(key).length > 0
}

const getOptionComponent = (key) => getFieldType(key) === 'radio' ? 'el-radio' : 'el-checkbox'
</script>

<style scoped lang="scss">
.simple-fields{
  padding:0 5%;
}

.widget-title {
  font-size: 16px;
  color: #ffffff;
  margin: 0 0 24px 0; /* 增加标题下边距 */
  font-weight: 600;
  padding-left: 10px;
  border-left: 4px solid #3b82f6;
}

// 1. 增加每个表单项的垂直间距
:deep(.el-form-item) {
  margin-bottom: 24px !important; /* 强制增加下边距 */
}

// 2. 增加分隔符的上下间距，让它更像一个独立的段落
.separator-col {
  margin-top: 32px;    /* 上边距加大 */
  margin-bottom: 24px; /* 下边距保持一致 */
}

.section-divider {
  display: flex;
  align-items: center;
  width: 100%;
  
  .label {
    font-size: 14px;
    font-weight: 700;
    color: #06b6d4;
    white-space: nowrap;
    margin-right: 12px;
    background: rgba(6, 182, 212, 0.15);
    padding: 4px 10px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
  
  .line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.3), rgba(255, 255, 255, 0.05)); // 渐变线，更高级
  }
}
</style>