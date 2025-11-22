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
router.post('/templates', authenticate, requireAdmin, upload.fields([
  { name: 'docx', maxCount: 1 },
  { name: 'schema', maxCount: 1 },
  { name: 'mapping', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, category } = req.body
    const files = req.files

    if (!name || !category) {
      return res.status(400).json({ message: '模板名称和分类为必填项' })
    }

    let fields = []
    let mapping = {}
    let file_path = null

    // 处理 Word 文件
    if (files.docx && files.docx[0]) {
      file_path = files.docx[0].filename
    }

    // 处理 Schema JSON
    if (files.schema && files.schema[0]) {
      try {
        const schemaContent = fs.readFileSync(files.schema[0].path, 'utf-8').trim()
        if (schemaContent) {
          fields = JSON.parse(schemaContent)
        }
        // 删除临时 JSON 文件
        fs.unlinkSync(files.schema[0].path)
      } catch (err) {
        console.error('解析 Schema JSON 失败:', err)
        return res.status(400).json({ message: 'Schema JSON 格式错误' })
      }
    }

    // 处理 Mapping JSON
    if (files.mapping && files.mapping[0]) {
      try {
        const mappingContent = fs.readFileSync(files.mapping[0].path, 'utf-8').trim()
        if (mappingContent) {
          mapping = JSON.parse(mappingContent)
        }
        // 删除临时 JSON 文件
        fs.unlinkSync(files.mapping[0].path)
      } catch (err) {
        console.error('解析 Mapping JSON 失败:', err)
        return res.status(400).json({ message: 'Mapping JSON 格式错误' })
      }
    }

    const template = await Template.create({
      name,
      description,
      category,
      fields,
      mapping,
      file_path
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
router.put('/templates/:id', authenticate, requireAdmin, async (req, res) => {
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
