/**
 * 工具函数统一导出
 * 
 * @example
 * // 导入单个函数
 * import { debounce, formatDate } from '@/utils'
 * 
 * // 导入所有函数
 * import * as utils from '@/utils'
 */

// 请求相关
export { default as request } from './request'

// 防抖节流
export { debounce } from './debounce'
export { throttle } from './throttle'

// 格式化
export {
  formatDate,
  formatFileSize,
  formatNumber,
  formatPhone,
  formatIdCard,
  formatBankCard,
  formatMoney,
  formatRelativeTime
} from './format'

// 验证
export {
  isEmail,
  isPhone,
  isIdCard,
  isUrl,
  isStrongPassword,
  isNumber,
  isInteger,
  isPositiveInteger,
  isChinese,
  hasChinese,
  isEmpty,
  isBankCard,
  isIP
} from './validate'

// 存储
export {
  setLocal,
  getLocal,
  removeLocal,
  clearLocal,
  setSession,
  getSession,
  removeSession,
  clearSession,
  getLocalKeys,
  getSessionKeys
} from './storage'

// 通用工具
export {
  deepClone,
  generateId,
  sleep,
  getUrlParam,
  getUrlParams,
  objectToQuery,
  unique,
  groupBy,
  flattenTree,
  arrayToTree,
  simpleDebounce,
  simpleThrottle,
  downloadFile,
  copyToClipboard,
  random,
  shuffle
} from './common'
