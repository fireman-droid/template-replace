/**
 * 前端埋点与错误上报工具
 * 记录关键用户行为和错误信息，便于调试与可观测性
 *
 * 当前实现：console + 内存队列（可对接后端日志接口或第三方 Sentry）
 */

const EVENT_QUEUE_MAX = 200
const eventQueue = []

/**
 * 记录事件
 * @param {'action'|'error'|'perf'} category - 事件分类
 * @param {string} name - 事件名称
 * @param {Object} [payload] - 附加数据
 */
export function trackEvent(category, name, payload = {}) {
  const entry = {
    category,
    name,
    payload,
    timestamp: Date.now(),
    url: location.pathname
  }

  // 内存队列（环形）
  if (eventQueue.length >= EVENT_QUEUE_MAX) eventQueue.shift()
  eventQueue.push(entry)

  // 开发环境输出到控制台
  if (import.meta.env.DEV) {
    const tag = { action: '🟢', error: '🔴', perf: '🟡' }[category] || '⚪'
    console.log(`${tag} [${category}] ${name}`, payload)
  }
}

/**
 * 记录错误（简写）
 */
export function trackError(name, error, extra = {}) {
  trackEvent('error', name, {
    message: error?.message || String(error),
    stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    ...extra
  })
}

/**
 * 记录性能指标（简写）
 */
export function trackPerf(name, durationMs, extra = {}) {
  trackEvent('perf', name, { durationMs, ...extra })
}

/**
 * 获取近期事件队列（供调试面板或上报使用）
 */
export function getEventQueue() {
  return [...eventQueue]
}

/**
 * 安装全局错误监听（在 main.js 中调用一次）
 * @param {import('vue').App} app - Vue app 实例
 */
export function installErrorHandler(app) {
  // Vue 组件错误
  app.config.errorHandler = (err, instance, info) => {
    trackError('vue_error', err, { info, component: instance?.$options?.name })
  }

  // 未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (e) => {
    trackError('unhandled_rejection', e.reason)
  })

  // 全局 JS 错误
  window.addEventListener('error', (e) => {
    trackError('global_error', e.error || e.message, {
      filename: e.filename,
      lineno: e.lineno
    })
  })
}
