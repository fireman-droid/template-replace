/**
 * 案卷路由
 * 处理案卷相关的请求
 */
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Case from '../models/Case.js'
import Template from '../models/Template.js'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// 所有案卷路由都需要认证
router.use(authenticate)

/**
 * 获取可用的起草模板列表
 * GET /api/cases/templates
 */
router.get('/templates', async (req, res) => {
  try {
    console.log('[GET /api/cases/templates] 开始获取模板列表')
    
    // 从数据库获取启用的模板
    const templates = await Template.getEnabled()
    
    console.log('[GET /api/cases/templates] 查询到模板数量:', templates.length)
    
    res.json({
      templates,
      total: templates.length
    })
  } catch (error) {
    console.error('[GET /api/cases/templates] 错误:', error)
    console.error('[GET /api/cases/templates] 错误堆栈:', error.stack)
    res.status(500).json({ message: '获取模板列表失败', error: error.message, stack: error.stack })
  }
})

/**
 * 获取当前用户的案卷列表
 * GET /api/cases
 */
router.get('/', async (req, res) => {
  try {
    console.log('[GET /api/cases] 开始获取案卷列表')
    console.log('[GET /api/cases] 查询参数:', req.query)
    console.log('[GET /api/cases] 当前用户 ID:', req.user.id)
    
    const { page = 1, pageSize = 10, keyword = '', status = '' } = req.query
    const result = await Case.getUserCases(
      req.user.id,
      parseInt(page),
      parseInt(pageSize),
      keyword,
      status
    )
    
    console.log('[GET /api/cases] 查询结果:', { total: result.total, count: result.list.length })
    res.json(result)
  } catch (error) {
    console.error('[GET /api/cases] 错误:', error)
    console.error('[GET /api/cases] 错误堆栈:', error.stack)
    res.status(500).json({ message: '获取案卷列表失败', error: error.message, stack: error.stack })
  }
})

/**
 * 创建案卷
 * POST /api/cases
 */
router.post('/', async (req, res) => {
  try {
    console.log('[POST /api/cases] 开始创建案卷')
    console.log('[POST /api/cases] 请求体:', req.body)
    console.log('[POST /api/cases] 当前用户 ID:', req.user.id)
    
    const { title, template_id, status, form_data } = req.body

    if (!title) {
      console.log('[POST /api/cases] 验证失败: 缺少标题')
      return res.status(400).json({ message: '案卷标题为必填项' })
    }

    const caseData = await Case.create({
      title,
      template_id,
      user_id: req.user.id,
      status: status || 'draft',
      form_data: form_data || {}
    })

    console.log('[POST /api/cases] 案卷创建成功:', caseData)
    res.status(201).json({ message: '案卷创建成功', case: caseData })
  } catch (error) {
    console.error('[POST /api/cases] 错误:', error)
    console.error('[POST /api/cases] 错误堆栈:', error.stack)
    res.status(500).json({ message: '创建案卷失败', error: error.message, stack: error.stack })
  }
})

/**
 * 更新案卷
 * PUT /api/cases/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[PUT /api/cases/${id}] 开始更新案卷`)
    console.log(`[PUT /api/cases/${id}] 请求体:`, req.body)
    console.log(`[PUT /api/cases/${id}] 当前用户 ID:`, req.user.id)
    
    const { title, template_id, status, form_data } = req.body

    // 验证案卷是否属于当前用户
    const existingCase = await Case.findById(id)
    console.log(`[PUT /api/cases/${id}] 查询到的案卷:`, existingCase)
    
    if (!existingCase) {
      console.log(`[PUT /api/cases/${id}] 案卷不存在`)
      return res.status(404).json({ message: '案卷不存在' })
    }
    if (existingCase.user_id !== req.user.id) {
      console.log(`[PUT /api/cases/${id}] 权限验证失败`)
      return res.status(403).json({ message: '无权修改此案卷' })
    }

    await Case.update(id, { title, template_id, status, form_data })
    console.log(`[PUT /api/cases/${id}] 案卷更新成功`)
    res.json({ message: '案卷更新成功' })
  } catch (error) {
    console.error(`[PUT /api/cases/${req.params.id}] 错误:`, error)
    console.error(`[PUT /api/cases/${req.params.id}] 错误堆栈:`, error.stack)
    res.status(500).json({ message: '更新案卷失败', error: error.message, stack: error.stack })
  }
})

/**
 * 删除案卷
 * DELETE /api/cases/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[DELETE /api/cases/${id}] 开始删除案卷`)
    console.log(`[DELETE /api/cases/${id}] 当前用户 ID:`, req.user.id)

    // 验证案卷是否属于当前用户
    const existingCase = await Case.findById(id)
    console.log(`[DELETE /api/cases/${id}] 查询到的案卷:`, existingCase)
    
    if (!existingCase) {
      console.log(`[DELETE /api/cases/${id}] 案卷不存在`)
      return res.status(404).json({ message: '案卷不存在' })
    }
    if (existingCase.user_id !== req.user.id) {
      console.log(`[DELETE /api/cases/${id}] 权限验证失败`)
      return res.status(403).json({ message: '无权删除此案卷' })
    }

    await Case.delete(id)
    console.log(`[DELETE /api/cases/${id}] 案卷删除成功`)
    res.json({ message: '案卷删除成功' })
  } catch (error) {
    console.error(`[DELETE /api/cases/${req.params.id}] 错误:`, error)
    console.error(`[DELETE /api/cases/${req.params.id}] 错误堆栈:`, error.stack)
    res.status(500).json({ message: '删除案卷失败', error: error.message, stack: error.stack })
  }
})

/**
 * 获取案卷的模板文件内容
 * GET /api/cases/:id/template-file
 */
router.get('/:id/template-file', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[GET /api/cases/${id}/template-file] 开始获取模板文件`)
    console.log(`[GET /api/cases/${id}/template-file] 当前用户 ID:`, req.user.id)
    
    // 1. 获取案卷信息
    const caseData = await Case.findById(id)
    
    if (!caseData) {
      console.log(`[GET /api/cases/${id}/template-file] 案卷不存在`)
      return res.status(404).json({ message: '案卷不存在' })
    }
    
    // 2. 验证权限
    if (caseData.user_id !== req.user.id) {
      console.log(`[GET /api/cases/${id}/template-file] 权限验证失败`)
      return res.status(403).json({ message: '无权访问此案卷' })
    }
    
    // 3. 检查是否有关联模板
    if (!caseData.template_id) {
      console.log(`[GET /api/cases/${id}/template-file] 案卷没有关联模板`)
      return res.status(404).json({ message: '该案卷没有关联模板' })
    }
    
    // 4. 获取模板信息
    const templateData = await Template.findById(caseData.template_id)
    
    if (!templateData || !templateData.file_path) {
      console.log(`[GET /api/cases/${id}/template-file] 模板文件不存在`)
      return res.status(404).json({ message: '模板文件不存在' })
    }
    
    // 5. 构建文件路径
    const filePath = path.join(__dirname, '../uploads/templates', templateData.file_path)
    console.log(`[GET /api/cases/${id}/template-file] 文件路径:`, filePath)
    
    // 6. 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`[GET /api/cases/${id}/template-file] 文件不存在于服务器`)
      return res.status(404).json({ message: '文件不存在于服务器' })
    }
    
    // 7. 读取文件
    const fileBuffer = fs.readFileSync(filePath)
    console.log(`[GET /api/cases/${id}/template-file] 文件读取成功，大小:`, fileBuffer.length, 'bytes')
    
    // 8. 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(templateData.name)}.docx"`)
    res.setHeader('Content-Length', fileBuffer.length)
    
    // 9. 返回文件内容
    console.log(`[GET /api/cases/${id}/template-file] 成功返回文件内容`)
    res.send(fileBuffer)
  } catch (error) {
    console.error(`[GET /api/cases/${req.params.id}/template-file] 错误:`, error)
    console.error(`[GET /api/cases/${req.params.id}/template-file] 错误堆栈:`, error.stack)
    res.status(500).json({ message: '获取模板文件失败', error: error.message, stack: error.stack })
  }
})

/**
 * 获取案卷详情（包含模板信息）
 * GET /api/cases/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[GET /api/cases/${id}] 开始获取案卷详情`)
    console.log(`[GET /api/cases/${id}] 当前用户 ID:`, req.user.id)
    
    const caseData = await Case.findById(id)
    console.log(`[GET /api/cases/${id}] 查询结果:`, caseData)
    
    if (!caseData) {
      console.log(`[GET /api/cases/${id}] 案卷不存在`)
      return res.status(404).json({ message: '案卷不存在' })
    }
    
    // 验证案卷是否属于当前用户
    console.log(`[GET /api/cases/${id}] 案卷所属用户 ID:`, caseData.user_id)
    if (caseData.user_id !== req.user.id) {
      console.log(`[GET /api/cases/${id}] 权限验证失败`)
      return res.status(403).json({ message: '无权访问此案卷' })
    }

    // 如果案卷有关联的模板，获取模板详细信息
    let templateData = null
    if (caseData.template_id) {
      console.log(`[GET /api/cases/${id}] 获取关联模板信息, template_id:`, caseData.template_id)
      templateData = await Template.findById(caseData.template_id)
      console.log(`[GET /api/cases/${id}] 模板信息:`, templateData)
    }

    // 组合返回数据
    const response = {
      ...caseData,
      template: templateData ? {
        id: templateData.id,
        name: templateData.name,
        description: templateData.description,
        markData: templateData.markData,
        file_path: templateData.file_path
      } : null
    }

    console.log(`[GET /api/cases/${id}] 成功返回案卷详情（含模板信息）`)
    res.json(response)
  } catch (error) {
    console.error(`[GET /api/cases/${req.params.id}] 错误:`, error)
    console.error(`[GET /api/cases/${req.params.id}] 错误堆栈:`, error.stack)
    res.status(500).json({ message: '获取案卷详情失败', error: error.message, stack: error.stack })
  }
})

export default router
