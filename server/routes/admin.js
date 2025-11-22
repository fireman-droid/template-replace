/**
 * 管理员路由
 * 处理用户管理和模板管理相关的请求
 */
import express from 'express'
import User from '../models/User.js'
import Template from '../models/Template.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import upload from '../config/upload.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 注意：文件上传路由需要在认证之后单独处理
// 其他路由需要认证和管理员权限

// ==================== 用户管理 ====================

/**
 * 获取所有用户列表
 * GET /api/admin/users
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
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
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
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
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
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
router.get('/templates', authenticate, requireAdmin, async (req, res) => {
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
 * 创建模板（支持文件上传）
 * POST /api/admin/templates
 */
router.post('/templates', authenticate, requireAdmin, upload.single('docx'), async (req, res) => {
  try {
    console.log('=== 接收到的请求数据 ===')
    console.log('req.body:', req.body)
    console.log('req.file:', req.file)
    
    const { name, description, fields, mapping } = req.body
    const file = req.file

    console.log('提取的字段:')
    console.log('- name:', name)
    console.log('- fields (原始):', fields, '类型:', typeof fields)
    console.log('- mapping (原始):', mapping, '类型:', typeof mapping)

    if (!name) {
      return res.status(400).json({ message: '模板名称为必填项' })
    }

    let parsedFields = {}
    let parsedMapping = {}
    let file_path = null

    // 处理 Word 文件
    if (file) {
      file_path = file.filename
      console.log('Word 文件已上传:', file_path)
    }

    // 解析 fields（从字符串解析为对象）
    if (fields) {
      try {
        parsedFields = typeof fields === 'string' ? JSON.parse(fields) : fields
        console.log('解析后的 fields:', parsedFields, 'keys:', Object.keys(parsedFields).length)
      } catch (err) {
        console.error('解析 fields 失败:', err)
        return res.status(400).json({ message: 'Fields 格式错误', error: err.message })
      }
    } else {
      console.log('fields 字段为空或未定义')
    }

    // 解析 mapping（从字符串解析为对象）
    if (mapping) {
      try {
        parsedMapping = typeof mapping === 'string' ? JSON.parse(mapping) : mapping
        console.log('解析后的 mapping:', parsedMapping, 'keys:', Object.keys(parsedMapping).length)
      } catch (err) {
        console.error('解析 mapping 失败:', err)
        return res.status(400).json({ message: 'Mapping 格式错误', error: err.message })
      }
    } else {
      console.log('mapping 字段为空或未定义')
    }

    console.log('准备创建模板，数据:', { name, description, fields: parsedFields, mapping: parsedMapping, file_path })
    
    const template = await Template.create({
      name,
      description,
      fields: parsedFields,
      mapping: parsedMapping,
      file_path
    })

    console.log('模板创建成功:', template)
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
router.put('/templates/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, fields } = req.body

    await Template.update(id, { name, description, fields })
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
router.delete('/templates/:id', authenticate, requireAdmin, async (req, res) => {
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
router.get('/templates/:id', authenticate, requireAdmin, async (req, res) => {
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

/**
 * 下载模板文件
 * GET /api/admin/templates/:id/download
 */
router.get('/templates/:id/download', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const template = await Template.findById(id)
    
    if (!template || !template.file_path) {
      return res.status(404).json({ message: '模板文件不存在' })
    }

    const filePath = path.join(__dirname, '../uploads/templates', template.file_path)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' })
    }

    res.download(filePath, `${template.name}.docx`)
  } catch (error) {
    console.error('下载模板错误:', error)
    res.status(500).json({ message: '下载模板失败', error: error.message })
  }
})

export default router
