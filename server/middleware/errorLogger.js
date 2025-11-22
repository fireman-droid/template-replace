/**
 * 错误日志中间件
 * 统一记录所有请求和错误信息
 */

/**
 * 请求日志中间件
 */
export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`\n[${timestamp}] ${req.method} ${req.originalUrl}`)
  console.log(`[请求头] User-Agent: ${req.get('user-agent')}`)
  
  if (req.user) {
    console.log(`[用户] ID: ${req.user.id}, Email: ${req.user.email}, Role: ${req.user.role}`)
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log(`[查询参数]`, req.query)
  }
  
  if (Object.keys(req.body).length > 0) {
    // 隐藏敏感信息
    const sanitizedBody = { ...req.body }
    if (sanitizedBody.password) sanitizedBody.password = '***'
    console.log(`[请求体]`, sanitizedBody)
  }
  
  next()
}

/**
 * 错误处理中间件
 */
export const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString()
  console.error(`\n[${timestamp}] ❌ 错误发生`)
  console.error(`[路由] ${req.method} ${req.originalUrl}`)
  console.error(`[错误信息]`, err.message)
  console.error(`[错误堆栈]`, err.stack)
  
  // 根据环境返回不同的错误信息
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    ...(isDevelopment && { 
      error: err.message,
      stack: err.stack 
    })
  })
}

/**
 * 404 处理中间件
 */
export const notFoundHandler = (req, res) => {
  const timestamp = new Date().toISOString()
  console.log(`\n[${timestamp}] ⚠️  404 Not Found`)
  console.log(`[路由] ${req.method} ${req.originalUrl}`)
  
  res.status(404).json({
    message: '请求的资源不存在',
    path: req.originalUrl
  })
}
