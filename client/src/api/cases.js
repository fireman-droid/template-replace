/**
 * 案卷相关 API
 */
import request from '@/utils/request'

/**
 * 获取案卷列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.status - 状态筛选
 */
export const getCaseList = (params) => {
  return request({
    url: '/cases',
    method: 'get',
    params
  })
}

/**
 * 创建案卷
 * @param {Object} data - 案卷数据
 * @param {string} data.title - 案卷标题
 * @param {number} data.template_id - 模板ID
 * @param {string} data.status - 状态
 * @param {Object} data.form_data - 表单数据
 */
export const createCase = (data) => {
  return request({
    url: '/cases',
    method: 'post',
    data
  })
}

/**
 * 更新案卷
 * @param {number} id - 案卷 ID
 * @param {Object} data - 更新的数据
 */
export const updateCase = (id, data) => {
  return request({
    url: `/cases/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除案卷
 * @param {number} id - 案卷 ID
 */
export const deleteCase = (id) => {
  return request({
    url: `/cases/${id}`,
    method: 'delete'
  })
}

/**
 * 获取案卷详情
 * @param {number} id - 案卷 ID
 */
export const getCaseDetail = (id) => {
  return request({
    url: `/cases/${id}`,
    method: 'get'
  })
}

/**
 * 获取模版列表
 */
export const getTemplate = () => {
  return request({
    url: `/cases/templates`,
    method:'get'
  })
}

/**
 * 获取word文档内容
 */
export const getCaseTemplateFile = (id) => {
  return request({
    url: `/cases/${id}/template-file`,
    method: 'get',
    responseType: 'blob'  // 重要！
  })
}
