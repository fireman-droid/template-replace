/**
 * 本地存储工具函数
 * 封装 localStorage 和 sessionStorage，支持过期时间和 JSON 序列化
 */

/**
 * 存储数据到 localStorage
 * @param {string} key - 键名
 * @param {any} value - 值
 * @param {number} expire - 过期时间（秒），不传则永久有效
 * 
 * @example
 * setLocal('user', { name: 'John' })
 * setLocal('token', 'abc123', 3600) // 1小时后过期
 */
export function setLocal(key, value, expire) {
  const data = {
    value,
    expire: expire ? Date.now() + expire * 1000 : null
  }
  localStorage.setItem(key, JSON.stringify(data))
}

/**
 * 从 localStorage 获取数据
 * @param {string} key - 键名
 * @returns {any} 值，如果不存在或已过期则返回 null
 * 
 * @example
 * const user = getLocal('user')
 */
export function getLocal(key) {
  const item = localStorage.getItem(key)
  if (!item) return null

  try {
    const data = JSON.parse(item)
    
    // 检查是否过期
    if (data.expire && Date.now() > data.expire) {
      localStorage.removeItem(key)
      return null
    }
    
    return data.value
  } catch (e) {
    // 如果解析失败，返回原始值（兼容旧数据）
    return item
  }
}

/**
 * 从 localStorage 删除数据
 * @param {string} key - 键名
 * 
 * @example
 * removeLocal('user')
 */
export function removeLocal(key) {
  localStorage.removeItem(key)
}

/**
 * 清空 localStorage
 * 
 * @example
 * clearLocal()
 */
export function clearLocal() {
  localStorage.clear()
}

/**
 * 存储数据到 sessionStorage
 * @param {string} key - 键名
 * @param {any} value - 值
 * 
 * @example
 * setSession('tempData', { id: 1 })
 */
export function setSession(key, value) {
  const data = { value }
  sessionStorage.setItem(key, JSON.stringify(data))
}

/**
 * 从 sessionStorage 获取数据
 * @param {string} key - 键名
 * @returns {any} 值，如果不存在则返回 null
 * 
 * @example
 * const tempData = getSession('tempData')
 */
export function getSession(key) {
  const item = sessionStorage.getItem(key)
  if (!item) return null

  try {
    const data = JSON.parse(item)
    return data.value
  } catch (e) {
    return item
  }
}

/**
 * 从 sessionStorage 删除数据
 * @param {string} key - 键名
 * 
 * @example
 * removeSession('tempData')
 */
export function removeSession(key) {
  sessionStorage.removeItem(key)
}

/**
 * 清空 sessionStorage
 * 
 * @example
 * clearSession()
 */
export function clearSession() {
  sessionStorage.clear()
}

/**
 * 获取所有 localStorage 的键
 * @returns {string[]} 键名数组
 * 
 * @example
 * const keys = getLocalKeys()
 */
export function getLocalKeys() {
  return Object.keys(localStorage)
}

/**
 * 获取所有 sessionStorage 的键
 * @returns {string[]} 键名数组
 * 
 * @example
 * const keys = getSessionKeys()
 */
export function getSessionKeys() {
  return Object.keys(sessionStorage)
}
