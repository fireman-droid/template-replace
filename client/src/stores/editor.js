/**
 * 案卷编辑器状态管理 (Case Editor Store)
 * 核心职责：管理 ProjectEdit 页面的所有数据流（数据、配置、保存）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCaseDetail, updateCase, createCase } from '@/api'
import { ElMessage } from 'element-plus'

export const useEditorStore = defineStore('editor', () => {
  // ==================== State (状态) ====================
  
  // 1. 案卷元数据 (ID, 标题, 状态等)
  const currentCase = ref(null)
  
  // 2. 表单数据 (这是用户正在填的内容，对应 v-model)
  const formData = ref({})
  
  // 3. 界面配置 (这是根据模版 ID 加载出来的超级 JSON)
  const templateConfig = ref(null)
  
  // 4. 字段映射 (备用的中文 Label 字典)
  const templateMapping = ref(null)
  
  // 5. 全局加载状态
  const loading = ref(false)

  // ==================== Getters (计算属性) ====================
  
  // 编辑器是否准备就绪 (配置加载完成)
  // ProjectEdit 用这个来判断是否显示 Loading 还是 FormRenderer
  const isLoaded = computed(() => !!templateConfig.value)

  // ==================== Actions (业务逻辑) ====================

  /**
   * [初始化] 进入编辑器
   * 负责调用 API，并将返回的“大杂烩”拆解到各个 state 中
   * @param {number} id - 案卷 ID
   */
  async function enterEditor(id) {
    loading.value = true
    // 先清空旧数据，防止闪烁
    resetEditor()
    
    try {
      // 1. 获取详情
      const res = await getCaseDetail(id)
      
      // 2. 拆解基础信息
      currentCase.value = {
        id: res.id,
        title: res.title,
        status: res.status,
        template_id: res.template_id,
        updated_at: res.updated_at
      }

      // 3. 拆解表单数据 (新建案卷可能是 null，兜底为 {})
      formData.value = res.form_data || {}

      // 4. 拆解模版配置 (核心步骤)
      if (res.template && res.template.fields) {
        templateConfig.value = res.template.fields // 超级 JSON
        templateMapping.value = res.template.mapping || {} // 中文映射
      } else {
        console.warn('⚠️ 未找到关联的模版配置')
        // 这里可以根据需求决定是否抛错，或者给个默认空配置
      }
      
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
   * [保存] 提交编辑器内容
   * 前端组件直接调用这个方法即可，不需要传参
   * @param {boolean} silent - 是否静默保存 (自动保存时不弹窗)
   */
  async function saveEditor(silent = false) {
    if (!currentCase.value?.id) return

    try {
      // 组装要更新的数据
      const payload = {
        title: currentCase.value.title, // 标题可能被修改
        form_data: formData.value       // 表单内容可能被修改
      }

      await updateCase(currentCase.value.id, payload)
      
      // 更新本地的时间戳
      currentCase.value.updated_at = new Date().toISOString()
      
      if (!silent) {
        ElMessage.success('保存成功')
      }
    } catch (error) {
      console.error('保存失败:', error)
      if (!silent) ElMessage.error('保存失败')
    }
  }

  /**
   * [创建] 新建案卷
   * 通常在 SelectTemplate 页面或 ProjectEdit 初始化新案卷时调用
   */
  async function create(data) {
    try {
      loading.value = true
      const res = await createCase(data)
      return res // 返回结果供组件跳转路由
    } catch (error) {
      console.error('创建失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * [清理] 离开编辑器
   * 防止下一次进入时短暂显示上一个案卷的数据
   */
  function resetEditor() {
    currentCase.value = null
    formData.value = {}
    templateConfig.value = null
    templateMapping.value = null
    loading.value = false
  }

  return {
    // State
    currentCase,
    formData,
    templateConfig,
    templateMapping,
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