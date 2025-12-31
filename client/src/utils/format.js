/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期对象、时间戳或日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 * 
 * @example
 * formatDate(new Date()) // '2025-11-22 15:30:45'
 * formatDate(new Date(), 'YYYY-MM-DD') // '2025-11-22'
 * formatDate('1980-05-20', 'YYYY年M月D日') // '1980年5月20日'
 * formatDate(1700654400000, 'YYYY年MM月DD日') // '2023年11月22日'
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const seconds = d.getSeconds()

  // 带前导零的版本
  const MM = String(month).padStart(2, '0')
  const DD = String(day).padStart(2, '0')
  const HH = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', MM)
    .replace('M', month)  // 不带前导零的月份
    .replace('DD', DD)
    .replace('D', day)    // 不带前导零的日期
    .replace('HH', HH)
    .replace('mm', mm)
    .replace('ss', ss)
}

/**
 * 格式化为中文日期（去除前导零）
 * @param {Date|string|number} date - 日期
 * @returns {string} 中文格式日期
 * 
 * @example
 * formatDateCN('1980-05-20') // '1980年5月20日'
 * formatDateCN('2023-01-01') // '2023年1月1日'
 */
export function formatDateCN(date) {
  return formatDate(date, 'YYYY年M月D日')
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数，默认 2
 * @returns {string} 格式化后的文件大小
 * 
 * @example
 * formatFileSize(1024) // '1.00 KB'
 * formatFileSize(1048576) // '1.00 MB'
 * formatFileSize(1234567, 1) // '1.2 MB'
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  if (!bytes) return ''

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化数字，添加千分位分隔符
 * @param {number|string} num - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 * 
 * @example
 * formatNumber(1234567) // '1,234,567'
 * formatNumber(1234567.89, 2) // '1,234,567.89'
 */
export function formatNumber(num, decimals) {
  if (num === null || num === undefined || num === '') return ''
  
  const number = Number(num)
  if (isNaN(number)) return ''

  const parts = decimals !== undefined 
    ? number.toFixed(decimals).split('.')
    : number.toString().split('.')
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return parts.join('.')
}

/**
 * 格式化手机号，隐藏中间四位
 * @param {string} phone - 手机号
 * @returns {string} 格式化后的手机号
 * 
 * @example
 * formatPhone('13812345678') // '138****5678'
 */
export function formatPhone(phone) {
  if (!phone) return ''
  const str = String(phone)
  if (str.length !== 11) return str
  return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/**
 * 格式化身份证号，隐藏中间部分
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号
 * 
 * @example
 * formatIdCard('110101199001011234') // '110101********1234'
 */
export function formatIdCard(idCard) {
  if (!idCard) return ''
  const str = String(idCard)
  if (str.length === 15) {
    return str.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2')
  } else if (str.length === 18) {
    return str.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }
  return str
}

/**
 * 格式化银行卡号，每四位添加空格
 * @param {string} cardNumber - 银行卡号
 * @returns {string} 格式化后的银行卡号
 * 
 * @example
 * formatBankCard('6222021234567890123') // '6222 0212 3456 7890 123'
 */
export function formatBankCard(cardNumber) {
  if (!cardNumber) return ''
  return String(cardNumber).replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * 格式化金额，保留两位小数并添加千分位
 * @param {number|string} amount - 金额
 * @param {string} currency - 货币符号，默认 '¥'
 * @returns {string} 格式化后的金额
 * 
 * @example
 * formatMoney(1234567.89) // '¥1,234,567.89'
 * formatMoney(1234567.89, '$') // '$1,234,567.89'
 */
export function formatMoney(amount, currency = '¥') {
  if (amount === null || amount === undefined || amount === '') return ''
  const formatted = formatNumber(amount, 2)
  return formatted ? `${currency}${formatted}` : ''
}

/**
 * 格式化相对时间（多久之前）
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 * 
 * @example
 * formatRelativeTime(new Date()) // '刚刚'
 * formatRelativeTime(Date.now() - 60000) // '1分钟前'
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = Date.now()
  const diff = now - d.getTime()
  
  if (diff < 0) return '未来'
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`
  if (diff < 31536000000) return `${Math.floor(diff / 2592000000)}个月前`
  return `${Math.floor(diff / 31536000000)}年前`
}
