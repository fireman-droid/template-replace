/**
 * 组件映射表：将 JSON 中的 type 字符串映射为 Element Plus 组件名
 */
export const componentMap = {
  'input': 'el-input',
  'textarea': 'el-input', // Element 的 textarea 也是 el-input，通过 type="textarea" 区分
  'number': 'el-input-number',
  'date': 'el-date-picker',
  'select': 'el-select',
  'radio': 'el-radio-group',
  'checkbox': 'el-checkbox-group',
  'switch': 'el-switch',
  
  // 自定义预设类型映射
  'checkbox_input': 'el-checkbox' // 后续我们会特殊处理这个，带输入的 checkbox
}

/**
 * 获取组件名称的工具函数
 * @param {string} type - JSON 中的 type (如 'date')
 */
export function getComponentType(type) {
  return componentMap[type] || 'el-input' // 默认回退到输入框
}