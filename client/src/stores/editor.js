/**
 * 案卷编辑器状态管理 (Case Editor Store)
 * 核心职责：管理案卷数据和编辑器业务逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCaseDetail, updateCase, createCase } from '@/api'
import { ElMessage } from 'element-plus'
import { useTemplateStore } from '@/stores/template'

export const useEditorStore = defineStore('editor', () => {
  // ==================== State (状态) ====================
  
  // 案卷元数据 (ID, 标题, 状态等)
  const currentCase = ref(null)
  
  // 表单数据 (用户填写的内容)
  const formData = ref({})
  
  // 加载状态
  const loading = ref(false)

  // ==================== Getters (计算属性) ====================
  
  // 编辑器是否已加载案卷
  const isLoaded = computed(() => !!currentCase.value)

  // ==================== Actions (业务逻辑) ====================

  /**
   * 进入编辑器 - 加载案卷数据
   * @param {number} id - 案卷 ID
   */
  async function enterEditor(id) {
    loading.value = true
    const templateStore = useTemplateStore()
    
    // 先清空旧数据
    resetEditor()
    
    try {
      // 1. 获取案卷详情
      const res = await getCaseDetail(id)
      
      // 2. 设置案卷基础信息
      currentCase.value = {
        id: res.id,
        title: res.title,
        status: res.status,
        template_id: res.template_id,
        updated_at: res.updated_at
      }
      
      // 3. 设置表单数据
      formData.value = res.form_data || {}
      
      // 4. 设置模板信息到 template store
      templateStore.setTemplateInfo(res.template)
      
      return res
    } catch (error) {
      console.error('加载案卷失败:', error)
      ElMessage.error('加载案卷失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存案卷
   * @param {boolean} silent - 是否静默保存（不显示提示）
   */
  async function saveEditor(silent = false) {
    if (!currentCase.value?.id) return
    
    try {
      const payload = {
        title: currentCase.value.title,
        form_data: formData.value
      }
      
      await updateCase(currentCase.value.id, payload)
      
      // 更新本地时间戳
      currentCase.value.updated_at = new Date().toISOString()
      
      if (!silent) {
        ElMessage.success('保存成功')
      }
    } catch (error) {
      console.error('保存失败:', error)
      if (!silent) {
        ElMessage.error('保存失败')
      }
    }
  }

  /**
   * 创建新案卷
   * @param {Object} data - 案卷数据
   */
  async function create(data) {
    try {
      loading.value = true
      const res = await createCase(data)
      return res
    } catch (error) {
      console.error('创建失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空编辑器数据
   */
  function resetEditor() {
    currentCase.value = null
    formData.value = {}
    loading.value = false
  }

  return {
    // State
    currentCase,
    formData,
    loading,
    
    // Getters
    isLoaded,
    
    // Actions
    enterEditor,
    saveEditor,
    resetEditor,
    create
  }
})
