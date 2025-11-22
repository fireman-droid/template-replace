/**
 * 案卷状态管理
 * 管理案卷的创建、编辑、查询等操作
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getCaseList, 
  getCaseDetail, 
  createCase, 
  updateCase, 
  deleteCase 
} from '@/api'

export const useCaseStore = defineStore('case', () => {
  // ==================== State ====================
  
  // 案卷列表
  const cases = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 当前编辑的案卷
  const currentCase = ref(null)
  
  // 加载状态
  const loading = ref(false)
  
  // ==================== Getters ====================
  
  // 是否有当前案卷
  const hasCurrentCase = computed(() => !!currentCase.value)
  
  // 当前案卷是否为草稿
  const isDraft = computed(() => currentCase.value?.status === 'draft')
  
  // 当前案卷的模板信息
  const currentTemplate = computed(() => currentCase.value?.template || null)
  
  // 是否有模板
  const hasTemplate = computed(() => !!currentTemplate.value)
  
  // ==================== Actions ====================
  
  /**
   * 获取案卷列表
   */
  async function fetchCases(params = {}) {
    try {
      loading.value = true
      const result = await getCaseList({
        page: currentPage.value,
        pageSize: pageSize.value,
        ...params
      })
      
      cases.value = result.list
      total.value = result.total
      
      return result
    } catch (error) {
      console.error('获取案卷列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取案卷详情
   */
  async function fetchCaseDetail(id) {
    try {
      loading.value = true
      const data = await getCaseDetail(id)
      currentCase.value = data
      return data
    } catch (error) {
      console.error('获取案卷详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 创建案卷
   */
  async function create(data) {
    try {
      loading.value = true
      const result = await createCase(data)
      
      // 更新当前案卷
      currentCase.value = result.case
      
      // 添加到列表（如果列表已加载）
      if (cases.value.length > 0) {
        cases.value.unshift(result.case)
        total.value++
      }
      
      return result
    } catch (error) {
      console.error('创建案卷失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新案卷
   */
  async function update(id, data) {
    try {
      loading.value = true
      await updateCase(id, data)
      
      // 更新当前案卷
      if (currentCase.value?.id === id) {
        currentCase.value = { ...currentCase.value, ...data }
      }
      
      // 更新列表中的案卷
      const index = cases.value.findIndex(c => c.id === id)
      if (index !== -1) {
        cases.value[index] = { ...cases.value[index], ...data }
      }
    } catch (error) {
      console.error('更新案卷失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除案卷
   */
  async function remove(id) {
    try {
      loading.value = true
      await deleteCase(id)
      
      // 从列表中移除
      const index = cases.value.findIndex(c => c.id === id)
      if (index !== -1) {
        cases.value.splice(index, 1)
        total.value--
      }
      
      // 如果删除的是当前案卷，清空
      if (currentCase.value?.id === id) {
        currentCase.value = null
      }
    } catch (error) {
      console.error('删除案卷失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新当前案卷的表单数据
   */
  function updateFormData(formData) {
    if (currentCase.value) {
      currentCase.value.form_data = formData
    }
  }
  
  /**
   * 清空当前案卷
   */
  function clearCurrentCase() {
    currentCase.value = null
  }
  
  /**
   * 设置分页
   */
  function setPage(page) {
    currentPage.value = page
  }
  
  return {
    // State
    cases,
    total,
    currentPage,
    pageSize,
    currentCase,
    loading,
    
    // Getters
    hasCurrentCase,
    isDraft,
    currentTemplate,
    hasTemplate,
    
    // Actions
    fetchCases,
    fetchCaseDetail,
    create,
    update,
    remove,
    updateFormData,
    clearCurrentCase,
    setPage
  }
})
