/**
 * 模版处理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useTemplateStore = defineStore('template', () => {
  // state
  const template = ref()
  // 这里可以添加模板相关的状态和方法
  
  return {
    // 导出状态和方法
  }
})