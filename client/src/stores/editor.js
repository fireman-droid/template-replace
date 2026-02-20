/**
 * 案卷编辑器状态管理 (Case Editor Store)
 * 核心职责：管理案卷数据和编辑器业务逻辑
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getCaseDetail, updateCase, createCase } from '@/api'
import { ElMessage } from 'element-plus'
import { useTemplateStore } from '@/stores/template'

// ==================== 草稿持久化工具 ====================
const DRAFT_PREFIX = 'fastreplace_draft_'

function getDraftKey(caseId) {
  return `${DRAFT_PREFIX}${caseId}`
}

function saveDraft(caseId, data, repeatMap) {
  if (!caseId) return
  try {
    sessionStorage.setItem(getDraftKey(caseId), JSON.stringify({
      formData: data,
      rowRepeatCountMap: repeatMap,
      savedAt: Date.now()
    }))
  } catch (e) { /* sessionStorage 满或不可用，静默忽略 */ }
}

function loadDraft(caseId) {
  if (!caseId) return null
  try {
    const raw = sessionStorage.getItem(getDraftKey(caseId))
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

function clearDraft(caseId) {
  if (!caseId) return
  sessionStorage.removeItem(getDraftKey(caseId))
}

export const useEditorStore = defineStore('editor', () => {
  // ==================== State (状态) ====================
  
  // 案卷元数据 (ID, 标题, 状态等)
  const currentCase = ref(null)
  
  // 表单数据 (用户填写的内容)
  const formData = ref({})
  
  // 多人员重复计数 (markKey: 人员数量)
  const rowRepeatCountMap = ref({})
  
  // 加载状态
  const loading = ref(false)
  
  // 是否有未保存的草稿
  const hasDraft = ref(false)

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
      
      // 3. 设置表单数据（从 form_data 中提取 __rowRepeatCountMap）
      const rawFormData = res.form_data || {}
      const { __rowRepeatCountMap, ...pureFormData } = rawFormData
      formData.value = pureFormData
      
      // 4. 设置多人员重复计数（从 form_data 中提取）
      rowRepeatCountMap.value = __rowRepeatCountMap || {}
      
      // 4.5 检查是否有未保存的草稿（刷新恢复）
      const draft = loadDraft(id)
      if (draft && draft.savedAt) {
        const serverTime = new Date(res.updated_at).getTime()
        if (draft.savedAt > serverTime) {
          // 草稿比服务端数据新，恢复草稿
          formData.value = draft.formData || formData.value
          rowRepeatCountMap.value = draft.rowRepeatCountMap || rowRepeatCountMap.value
          hasDraft.value = true
          ElMessage.success('已恢复上次未保存的编辑内容')
        } else {
          clearDraft(id)
        }
      }
      
      // 5. 设置模板信息到 template store
      templateStore.setTemplateInfo(res.template)
      
      // 6. 启动自动保存草稿监听
      setupDraftWatcher()
      
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
      // 将 rowRepeatCountMap 合并到 formData 中保存（后端只存储 form_data）
      const mergedFormData = {
        ...formData.value,
        __rowRepeatCountMap: rowRepeatCountMap.value
      }
      
      const payload = {
        title: currentCase.value.title,
        form_data: mergedFormData
      }
      
      await updateCase(currentCase.value.id, payload)
      
      // 保存成功，清除草稿
      clearDraft(currentCase.value.id)
      hasDraft.value = false
      
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
    // 离开编辑器时清除草稿（正常退出不保留，只有意外刷新才会触发恢复）
    if (currentCase.value?.id) {
      clearDraft(currentCase.value.id)
    }
    currentCase.value = null
    formData.value = {}
    rowRepeatCountMap.value = {}
    loading.value = false
    hasDraft.value = false
    if (draftWatchStop) {
      draftWatchStop()
      draftWatchStop = null
    }
  }

  // ==================== 草稿自动保存 ====================
  let draftWatchStop = null
  let draftTimer = null
  
  function setupDraftWatcher() {
    // 停止上一个 watcher（如果有）
    if (draftWatchStop) draftWatchStop()
    
    draftWatchStop = watch(
      [formData, rowRepeatCountMap],
      () => {
        // 防抖：500ms 内只保存一次
        if (draftTimer) clearTimeout(draftTimer)
        draftTimer = setTimeout(() => {
          if (currentCase.value?.id) {
            saveDraft(currentCase.value.id, formData.value, rowRepeatCountMap.value)
          }
        }, 500)
      },
      { deep: true }
    )
  }

  return {
    // State
    currentCase,
    formData,
    rowRepeatCountMap,
    loading,
    hasDraft,
    
    // Getters
    isLoaded,
    
    // Actions
    enterEditor,
    saveEditor,
    resetEditor,
    create
  }
})
