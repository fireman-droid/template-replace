/**
 * 案卷路由
 * 处理案卷相关的请求
 */
import express from 'express'
import Case from '../models/Case.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 所有案卷路由都需要认证
router.use(authenticate)

/**
 * 获取当前用户的案卷列表
 * GET /api/cases
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status = '' } = req.query
    const result = await Case.getUserCases(
      req.user.id,
      parseInt(page),
      parseInt(pageSize),
      keyword,
      status
    )
    res.json(result)
  } catch (error) {
    console.error('获取案卷列表错误:', error)
    res.status(500).json({ message: '获取案卷列表失败', error: error.message })
  }
})

/**
 * 创建案卷
 * POST /api/cases
 */
router.post('/', async (req, res) => {
  try {
    const { title, template_id, status, form_data } = req.body

    if (!title) {
      return res.status(400).json({ message: '案卷标题为必填项' })
    }

    const caseData = await Case.create({
      title,
      template_id,
      user_id: req.user.id,
      status: status || 'draft',
      form_data: form_data || {}
    })

    res.status(201).json({ message: '案卷创建成功', case: caseData })
  } catch (error) {
    console.error('创建案卷错误:', error)
    res.status(500).json({ message: '创建案卷失败', error: error.message })
  }
})

/**
 * 更新案卷
 * PUT /api/cases/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, template_id, status, form_data } = req.body

    // 验证案卷是否属于当前用户
    const existingCase = await Case.findById(id)
    if (!existingCase) {
      return res.status(404).json({ message: '案卷不存在' })
    }
    if (existingCase.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权修改此案卷' })
    }

    await Case.update(id, { title, template_id, status, form_data })
    res.json({ message: '案卷更新成功' })
  } catch (error) {
    console.error('更新案卷错误:', error)
    res.status(500).json({ message: '更新案卷失败', error: error.message })
  }
})

/**
 * 删除案卷
 * DELETE /api/cases/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // 验证案卷是否属于当前用户
    const existingCase = await Case.findById(id)
    if (!existingCase) {
      return res.status(404).json({ message: '案卷不存在' })
    }
    if (existingCase.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权删除此案卷' })
    }

    await Case.delete(id)
    res.json({ message: '案卷删除成功' })
  } catch (error) {
    console.error('删除案卷错误:', error)
    res.status(500).json({ message: '删除案卷失败', error: error.message })
  }
})

/**
 * 获取案卷详情
 * GET /api/cases/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const caseData = await Case.findById(id)
    
    if (!caseData) {
      return res.status(404).json({ message: '案卷不存在' })
    }
    
    // 验证案卷是否属于当前用户
    if (caseData.user_id !== req.user.id) {
      return res.status(403).json({ message: '无权访问此案卷' })
    }

    res.json(caseData)
  } catch (error) {
    console.error('获取案卷详情错误:', error)
    res.status(500).json({ message: '获取案卷详情失败', error: error.message })
  }
})

export default router
