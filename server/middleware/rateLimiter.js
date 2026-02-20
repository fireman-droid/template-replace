/**
 * 简易内存限流中间件
 * 按用户 ID（已登录）或 IP（未登录）限制请求频率
 * 适用于高成本接口（如 AI 调用），避免滥用与费用风险
 */

const store = new Map()

// 定时清理过期记录，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store) {
    if (now - record.windowStart > record.windowMs * 2) {
      store.delete(key)
    }
  }
}, 60 * 1000)

/**
 * 创建限流中间件
 * @param {Object} options
 * @param {number} options.windowMs  - 时间窗口（毫秒），默认 60 秒
 * @param {number} options.maxRequests - 窗口内允许的最大请求数，默认 10
 * @param {string} [options.message]  - 被限流时返回的提示
 */
export function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 10,
  message = '请求过于频繁，请稍后再试'
} = {}) {
  return (req, res, next) => {
    // 优先用已认证用户 ID，否则用 IP
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`
    const now = Date.now()

    let record = store.get(key)
    if (!record || now - record.windowStart > windowMs) {
      // 新窗口
      record = { windowStart: now, count: 1, windowMs }
      store.set(key, record)
      return next()
    }

    record.count++
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000)
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({ message, retryAfter })
    }

    next()
  }
}
