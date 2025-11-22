/**
 * 管理员相关 API
 */
import request from '@/utils/request'

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.keyword - 搜索关键词
 */
export const getUserList = (params) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

/**
 * 更新用户角色
 * @param {number} id - 用户 ID
 * @param {string} role - 新角色（admin/user）
 */
export const updateUserRole = (id, role) => {
  return request({
    url: `/admin/users/${id}/role`,
    method: 'put',
    data: { role }
  })
}

/**
 * 删除用户
 * @param {number} id - 用户 ID
 */
export const deleteUser = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  })
}

// ==================== 模板管理 ====================

/**
 * 获取模板列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.keyword - 搜索关键词
 */
export const getTemplateList = (params) => {
  return request({
    url: '/admin/templates',
    method: 'get',
    params
  })
}

/**
 * 创建模板（支持文件上传）
 * @param {FormData} formData - 包含文件和表单数据的 FormData 对象
 */
export const createTemplate = (formData) => {
  return request({
    url: '/admin/templates',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 更新模板
 * @param {number} id - 模板 ID
 * @param {Object} data - 更新的数据
 */
export const updateTemplate = (id, data) => {
  return request({
    url: `/admin/templates/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除模板
 * @param {number} id - 模板 ID
 */
export const deleteTemplate = (id) => {
  return request({
    url: `/admin/templates/${id}`,
    method: 'delete'
  })
}

/**
 * 获取模板详情
 * @param {number} id - 模板 ID
 */
export const getTemplateDetail = (id) => {
  return request({
    url: `/admin/templates/${id}`,
    method: 'get'
  })
}

/**
 * 下载模板文件
 * @param {number} id - 模板 ID
 */
export const downloadTemplate = (id) => {
  return `/api/admin/templates/${id}/download`
}
