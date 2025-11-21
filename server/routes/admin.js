/**
 * 管理员路由
 * 处理用户管理和模板管理相关的请求
 */
import express from 'express'
import User from '../models/User.js'
import Template from '../models/Template.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// 所有管理员路由都需要认证和管理员权限
router.use(authenticate, requireAdmin)

// ==================== 用户管理 ====================

/**
 * 获取所有用户列表
 * GET /api/admin/users
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query
    const result = await User.getAll(parseInt(page), parseInt(pageSize), keyword)
    res.json(result)
  } catch (error) {
    console.error('获取用户列表错误:', error)
    res.status(500).json({ message: '获取用户列表失败', error: error.message })
  }
})

/**
 * 更新用户角色
 * PUT /api/admin/users/:id/role
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: '无效的角色' })
    }

    await User.updateRole(id, role)
    res.json({ message: '角色更新成功' })
  } catch (error) {
    console.error('更新用户角色错误:', error)
    res.status(500).json({ message: '更新角色失败', error: error.message })
  }
})

/**
 * 删除用户
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: '不能删除自己的账号' })
    }

    await User.delete(id)
    res.json({ message: '用户删除成功' })
  } catch (error) {
    console.error('删除用户错误:', error)
    res.status(500).json({ message: '删除用户失败', error: error.message })
  }
})

// ==================== 模板管理 ====================

/**
 * 获取所有模板列表
 * GET /api/admin/templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query
    const result = await Template.getAll(parseInt(page), parseInt(pageSize), keyword)
    res.json(result)
  } catch (error) {
    console.error('获取模板列表错误:', error)
    res.status(500).json({ message: '获取模板列表失败', error: error.message })
  }
})

/**
 * 创建模板
 * POST /api/admin/templates
 */
router.post('/templates', async (req, res) => {
  try {
    const { name, description, category, fields } = req.body

    if (!name || !category) {
      return res.status(400).json({ message: '模板名称和分类为必填项' })
    }

    const template = await Template.create({
      name,
      description,
      category,
      fields: fields || []
    })

    res.status(201).json({ message: '模板创建成功', template })
  } catch (error) {
    console.error('创建模板错误:', error)
    res.status(500).json({ message: '创建模板失败', error: error.message })
  }
})

/**
 * 更新模板
 * PUT /api/admin/templates/:id
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, category, fields } = req.body

    await Template.update(id, { name, description, category, fields })
    res.json({ message: '模板更新成功' })
  } catch (error) {
    console.error('更新模板错误:', error)
    res.status(500).json({ message: '更新模板失败', error: error.message })
  }
})

/**
 * 删除模板
 * DELETE /api/admin/templates/:id
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    await Template.delete(id)
    res.json({ message: '模板删除成功' })
  } catch (error) {
    console.error('删除模板错误:', error)
    res.status(500).json({ message: '删除模板失败', error: error.message })
  }
})

/**
 * 获取模板详情
 * GET /api/admin/templates/:id
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    const template = await Template.findById(id)
    
    if (!template) {
      return res.status(404).json({ message: '模板不存在' })
    }

    res.json(template)
  } catch (error) {
    console.error('获取模板详情错误:', error)
    res.status(500).json({ message: '获取模板详情失败', error: error.message })
  }
})

export default router
