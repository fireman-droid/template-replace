/**
 * 节流函数
 * 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 * 
 * @param {Function} func - 需要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在开始时执行
 * @param {boolean} options.trailing - 是否在结束时执行
 * @returns {Function} 节流后的函数
 * 
 * @example
 * // 基本用法
 * const throttledScroll = throttle(() => {
 *   console.log('滚动事件')
 * }, 1000)
 * 
 * // 配置选项
 * const throttledResize = throttle(() => {
 *   console.log('窗口大小改变')
 * }, 500, { leading: true, trailing: false })
 */
export function throttle(func, wait = 300, options = {}) {
  let timeout
  let previous = 0
  const { leading = true, trailing = true } = options

  return function executedFunction(...args) {
    const context = this
    const now = Date.now()

    // 如果不需要首次执行，则将 previous 设置为当前时间
    if (!previous && !leading) previous = now

    // 计算剩余时间
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      // 时间到了，执行函数
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(context, args)
    } else if (!timeout && trailing) {
      // 设置定时器，在剩余时间后执行
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0
        timeout = null
        func.apply(context, args)
      }, remaining)
    }
  }
}

export default throttle
