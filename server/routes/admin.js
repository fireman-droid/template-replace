/**
 * 管理员路由
 * 处理用户管理、模板管理和系统日志相关的请求
 */
import express from 'express'
import User from '../models/User.js'
import Template from '../models/Template.js'
import SystemLog from '../models/SystemLog.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { logAction, ActionTypes, ResourceTypes } from '../utils/logger.js'
import upload from '../config/upload.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../config/db.js'

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
    
    // 记录操作日志
    await logAction(req, ActionTypes.ROLE_CHANGE, ResourceTypes.USER, parseInt(id), {
      message: `将用户角色修改为 ${role}`,
      newRole: role
    })
    
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

    // 先获取用户信息用于日志记录
    const userToDelete = await User.findById(id)
    
    await User.delete(id)
    
    // 记录操作日志
    await logAction(req, ActionTypes.DELETE, ResourceTypes.USER, parseInt(id), {
      message: `删除用户: ${userToDelete?.email || id}`
    })
    
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
    
    const { name, description, markData } = req.body
    const file = req.file

    console.log('提取的字段:')
    console.log('- name:', name)
    console.log('- markData (原始):', markData, '类型:', typeof markData)

    if (!name) {
      return res.status(400).json({ message: '模板名称为必填项' })
    }

    let parsedMarkData = {}
    let file_path = null

    // 处理 Word 文件
    if (file) {
      file_path = file.filename
      console.log('Word 文件已上传:', file_path)
    }

    // 解析 markData（从字符串解析为对象）
    if (markData) {
      try {
        parsedMarkData = typeof markData === 'string' ? JSON.parse(markData) : markData
        console.log('解析后的 markData:', parsedMarkData, 'keys:', Object.keys(parsedMarkData).length)
      } catch (err) {
        console.error('解析 markData 失败:', err)
        return res.status(400).json({ message: 'MarkData 格式错误', error: err.message })
      }
    } else {
      console.log('markData 字段为空或未定义')
    }

    console.log('准备创建模板，数据:', { name, description, markData: parsedMarkData, file_path })
    
    const template = await Template.create({
      name,
      description,
      markData: parsedMarkData,
      file_path
    })

    // 记录操作日志
    await logAction(req, ActionTypes.CREATE, ResourceTypes.TEMPLATE, template.id, {
      message: `创建模板: ${name}`,
      templateName: name
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
router.put('/templates/:id', authenticate, requireAdmin, upload.single('docx'), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, markData } = req.body

    const updateData = { name, description }
    
    // 如果有新的 markData
    if (markData) {
      updateData.markData = typeof markData === 'string' ? JSON.parse(markData) : markData
    }
    
    // 如果上传了新文件
    if (req.file) {
      updateData.file_path = req.file.filename
    }

    await Template.update(id, updateData)
    
    // 记录操作日志
    await logAction(req, ActionTypes.UPDATE, ResourceTypes.TEMPLATE, parseInt(id), {
      message: `更新模板: ${name || id}`,
      templateName: name
    })
    
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
    
    // 先获取模板信息用于日志记录
    const templateToDelete = await Template.findById(id)
    
    await Template.delete(id)
    
    // 记录操作日志
    await logAction(req, ActionTypes.DELETE, ResourceTypes.TEMPLATE, parseInt(id), {
      message: `删除模板: ${templateToDelete?.name || id}`
    })
    
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

// ==================== 系统日志 ====================

/**
 * 获取系统日志列表
 * GET /api/admin/logs
 */
router.get('/logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, action = '', resourceType = '', keyword = '' } = req.query
    
    const filters = {}
    if (action) filters.action = action
    if (resourceType) filters.resourceType = resourceType
    if (keyword) filters.keyword = keyword
    
    const result = await SystemLog.getAll(parseInt(page), parseInt(pageSize), filters)
    res.json(result)
  } catch (error) {
    console.error('获取系统日志错误:', error)
    res.status(500).json({ message: '获取系统日志失败', error: error.message })
  }
})

/**
 * 获取操作类型统计
 * GET /api/admin/logs/stats
 */
router.get('/logs/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await SystemLog.getActionStats()
    res.json(stats)
  } catch (error) {
    console.error('获取日志统计错误:', error)
    res.status(500).json({ message: '获取日志统计失败', error: error.message })
  }
})

// ==================== 仪表盘统计 ====================

/**
 * 获取仪表盘统计数据
 * GET /api/admin/dashboard/stats
 */
router.get('/dashboard/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // 1. 总量统计
    const [userCount, templateCount, caseCount, logCount] = await Promise.all([
      prisma.user.count(),
      prisma.template.count(),
      prisma.case.count(),
      prisma.systemLog.count()
    ])

    // 2. 近 7 天每日案卷创建趋势
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const caseTrend = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM cases
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // 3. 近 7 天每日操作日志趋势
    const logTrend = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM system_logs
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // 4. 模板使用排行（按关联案卷数量）
    const templateRank = await prisma.$queryRaw`
      SELECT t.name, COUNT(c.id) as case_count
      FROM templates t
      LEFT JOIN cases c ON c.template_id = t.id
      GROUP BY t.id, t.name
      ORDER BY case_count DESC
      LIMIT 10
    `

    // 5. 操作类型分布
    const actionStats = await SystemLog.getActionStats()

    // 6. 近 7 天新增用户数
    const newUserCount = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    })

    // 补齐 7 天日期（没有数据的天填 0）
    const fillDays = (rawData) => {
      const map = {}
      rawData.forEach(r => {
        const key = new Date(r.date).toISOString().slice(0, 10)
        map[key] = Number(r.count)
      })
      const result = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        result.push({ date: key, count: map[key] || 0 })
      }
      return result
    }

    res.json({
      summary: { userCount, templateCount, caseCount, logCount, newUserCount },
      caseTrend: fillDays(caseTrend),
      logTrend: fillDays(logTrend),
      templateRank: templateRank.map(r => ({ name: r.name, count: Number(r.case_count) })),
      actionStats: actionStats.map(r => ({ name: r.action, count: Number(r.count) }))
    })
  } catch (error) {
    console.error('获取仪表盘统计错误:', error)
    res.status(500).json({ message: '获取统计数据失败', error: error.message })
  }
})

// ==================== 聊天管理 ====================

/**
 * 获取聊天会话列表
 * GET /api/admin/chat/sessions
 */
router.get('/chat/sessions', authenticate, requireAdmin, async (req, res) => {
  try {
    // 获取所有会话，按最后更新时间倒序
    const sessions = await prisma.chatSession.findMany({
      where: { status: 'open' },
      orderBy: { updatedAt: 'desc' }
    });

    // 为每个会话获取最后一条消息和未读计数
    const result = await Promise.all(sessions.map(async (session) => {
      // 获取关联用户信息
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true, email: true }
      });

      // 获取最后一条消息
      const lastMsg = await prisma.chatMessage.findFirst({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' }
      });

      // 获取未读数 (senderType = 'user' AND isRead = false)
      const unreadCount = await prisma.chatMessage.count({
        where: {
          sessionId: session.id,
          senderType: 'user',
          isRead: false
        }
      });

      return {
        sessionId: session.id,
        userId: session.userId,
        username: user?.username || `用户 ${session.userId}`,
        lastMessage: lastMsg?.content || '',
        lastTime: lastMsg?.createdAt || session.updatedAt,
        unread: unreadCount,
        messages: [] // 前端需要这个字段初始化
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({ message: '获取会话列表失败', error: error.message });
  }
})

export default router
