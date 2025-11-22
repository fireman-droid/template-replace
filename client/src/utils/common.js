/**
 * 通用工具函数
 */

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 * 
 * @example
 * const obj = { a: 1, b: { c: 2 } }
 * const copied = deepClone(obj)
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 生成唯一 ID
 * @param {string} prefix - 前缀，默认为空
 * @returns {string} 唯一 ID
 * 
 * @example
 * generateId() // 'a1b2c3d4'
 * generateId('user_') // 'user_a1b2c3d4'
 */
export function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * 延迟执行
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} Promise 对象
 * 
 * @example
 * await sleep(1000) // 延迟 1 秒
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取 URL 参数
 * @param {string} name - 参数名
 * @param {string} url - URL 地址，默认为当前页面 URL
 * @returns {string|null} 参数值
 * 
 * @example
 * getUrlParam('id') // '123'
 * getUrlParam('name', 'https://example.com?name=John') // 'John'
 */
export function getUrlParam(name, url = window.location.href) {
  const params = new URL(url).searchParams
  return params.get(name)
}

/**
 * 获取所有 URL 参数
 * @param {string} url - URL 地址，默认为当前页面 URL
 * @returns {Object} 参数对象
 * 
 * @example
 * getUrlParams() // { id: '123', name: 'John' }
 */
export function getUrlParams(url = window.location.href) {
  const params = new URL(url).searchParams
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

/**
 * 对象转 URL 参数
 * @param {Object} obj - 参数对象
 * @returns {string} URL 参数字符串
 * 
 * @example
 * objectToQuery({ id: 123, name: 'John' }) // 'id=123&name=John'
 */
export function objectToQuery(obj) {
  if (!obj || typeof obj !== 'object') return ''
  return Object.keys(obj)
    .filter(key => obj[key] !== undefined && obj[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&')
}

/**
 * 数组去重
 * @param {Array} arr - 数组
 * @param {string} key - 对象数组时的唯一键
 * @returns {Array} 去重后的数组
 * 
 * @example
 * unique([1, 2, 2, 3]) // [1, 2, 3]
 * unique([{id: 1}, {id: 2}, {id: 1}], 'id') // [{id: 1}, {id: 2}]
 */
export function unique(arr, key) {
  if (!Array.isArray(arr)) return []
  
  if (key) {
    const seen = new Set()
    return arr.filter(item => {
      const val = item[key]
      if (seen.has(val)) return false
      seen.add(val)
      return true
    })
  }
  
  return [...new Set(arr)]
}

/**
 * 数组分组
 * @param {Array} arr - 数组
 * @param {string|Function} key - 分组键或分组函数
 * @returns {Object} 分组后的对象
 * 
 * @example
 * groupBy([{type: 'a', val: 1}, {type: 'b', val: 2}, {type: 'a', val: 3}], 'type')
 * // { a: [{type: 'a', val: 1}, {type: 'a', val: 3}], b: [{type: 'b', val: 2}] }
 */
export function groupBy(arr, key) {
  if (!Array.isArray(arr)) return {}
  
  return arr.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!result[groupKey]) result[groupKey] = []
    result[groupKey].push(item)
    return result
  }, {})
}

/**
 * 树形数据扁平化
 * @param {Array} tree - 树形数据
 * @param {string} childrenKey - 子节点键名，默认 'children'
 * @returns {Array} 扁平化后的数组
 * 
 * @example
 * flattenTree([{ id: 1, children: [{ id: 2 }] }])
 * // [{ id: 1 }, { id: 2 }]
 */
export function flattenTree(tree, childrenKey = 'children') {
  const result = []
  
  function flatten(nodes) {
    nodes.forEach(node => {
      const { [childrenKey]: children, ...rest } = node
      result.push(rest)
      if (children && children.length) {
        flatten(children)
      }
    })
  }
  
  flatten(tree)
  return result
}

/**
 * 数组转树形结构
 * @param {Array} arr - 扁平数组
 * @param {Object} options - 配置选项
 * @param {string} options.idKey - ID 键名，默认 'id'
 * @param {string} options.parentKey - 父 ID 键名，默认 'parentId'
 * @param {string} options.childrenKey - 子节点键名，默认 'children'
 * @param {any} options.rootValue - 根节点的父 ID 值，默认 null
 * @returns {Array} 树形结构数组
 * 
 * @example
 * arrayToTree([
 *   { id: 1, parentId: null, name: 'A' },
 *   { id: 2, parentId: 1, name: 'B' }
 * ])
 * // [{ id: 1, parentId: null, name: 'A', children: [{ id: 2, parentId: 1, name: 'B', children: [] }] }]
 */
export function arrayToTree(arr, options = {}) {
  const {
    idKey = 'id',
    parentKey = 'parentId',
    childrenKey = 'children',
    rootValue = null
  } = options

  const map = {}
  const result = []

  // 创建映射
  arr.forEach(item => {
    map[item[idKey]] = { ...item, [childrenKey]: [] }
  })

  // 构建树
  arr.forEach(item => {
    const node = map[item[idKey]]
    const parent = map[item[parentKey]]
    
    if (item[parentKey] === rootValue || !parent) {
      result.push(node)
    } else {
      parent[childrenKey].push(node)
    }
  })

  return result
}

/**
 * 防抖函数（简化版，推荐使用 debounce.js）
 * @param {Function} func - 函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖后的函数
 */
export function simpleDebounce(func, wait = 300) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * 节流函数（简化版，推荐使用 throttle.js）
 * @param {Function} func - 函数
 * @param {number} wait - 等待时间
 * @returns {Function} 节流后的函数
 */
export function simpleThrottle(func, wait = 300) {
  let previous = 0
  return function(...args) {
    const now = Date.now()
    if (now - previous > wait) {
      previous = now
      func.apply(this, args)
    }
  }
}

/**
 * 下载文件
 * @param {string} url - 文件 URL
 * @param {string} filename - 文件名
 * 
 * @example
 * downloadFile('/api/files/123', 'document.pdf')
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 * 
 * @example
 * await copyToClipboard('Hello World')
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 兼容旧浏览器
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  } catch (e) {
    console.error('复制失败:', e)
    return false
  }
}

/**
 * 获取随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 随机数
 * 
 * @example
 * random(1, 10) // 1-10 之间的随机整数
 */
export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 打乱数组顺序
 * @param {Array} arr - 数组
 * @returns {Array} 打乱后的数组
 * 
 * @example
 * shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4]
 */
export function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
