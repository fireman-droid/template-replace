/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 * 
 * @example
 * isEmail('test@example.com') // true
 * isEmail('invalid-email') // false
 */
export function isEmail(email) {
  const reg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return reg.test(email)
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 * 
 * @example
 * isPhone('13812345678') // true
 * isPhone('12345678901') // false
 */
export function isPhone(phone) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

/**
 * 验证身份证号格式（中国大陆）
 * @param {string} idCard - 身份证号
 * @returns {boolean} 是否有效
 * 
 * @example
 * isIdCard('110101199001011234') // true
 */
export function isIdCard(idCard) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 地址
 * @returns {boolean} 是否有效
 * 
 * @example
 * isUrl('https://www.example.com') // true
 * isUrl('not-a-url') // false
 */
export function isUrl(url) {
  const reg = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  return reg.test(url)
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @param {Object} options - 配置选项
 * @param {number} options.minLength - 最小长度，默认 6
 * @param {boolean} options.requireNumber - 是否需要数字，默认 false
 * @param {boolean} options.requireLetter - 是否需要字母，默认 false
 * @param {boolean} options.requireSpecial - 是否需要特殊字符，默认 false
 * @returns {boolean} 是否有效
 * 
 * @example
 * isStrongPassword('123456') // true
 * isStrongPassword('abc', { minLength: 6 }) // false
 * isStrongPassword('abc123', { requireNumber: true, requireLetter: true }) // true
 */
export function isStrongPassword(password, options = {}) {
  const {
    minLength = 6,
    requireNumber = false,
    requireLetter = false,
    requireSpecial = false
  } = options

  if (!password || password.length < minLength) return false
  if (requireNumber && !/\d/.test(password)) return false
  if (requireLetter && !/[a-zA-Z]/.test(password)) return false
  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false

  return true
}

/**
 * 验证是否为纯数字
 * @param {any} value - 值
 * @returns {boolean} 是否为纯数字
 * 
 * @example
 * isNumber('123') // true
 * isNumber('abc') // false
 */
export function isNumber(value) {
  return /^\d+$/.test(value)
}

/**
 * 验证是否为整数
 * @param {any} value - 值
 * @returns {boolean} 是否为整数
 * 
 * @example
 * isInteger(123) // true
 * isInteger(123.45) // false
 */
export function isInteger(value) {
  return Number.isInteger(Number(value))
}

/**
 * 验证是否为正整数
 * @param {any} value - 值
 * @returns {boolean} 是否为正整数
 * 
 * @example
 * isPositiveInteger(123) // true
 * isPositiveInteger(-123) // false
 */
export function isPositiveInteger(value) {
  return isInteger(value) && Number(value) > 0
}

/**
 * 验证是否为中文
 * @param {string} str - 字符串
 * @returns {boolean} 是否为中文
 * 
 * @example
 * isChinese('你好') // true
 * isChinese('hello') // false
 */
export function isChinese(str) {
  return /^[\u4e00-\u9fa5]+$/.test(str)
}

/**
 * 验证是否包含中文
 * @param {string} str - 字符串
 * @returns {boolean} 是否包含中文
 * 
 * @example
 * hasChinese('你好world') // true
 * hasChinese('hello') // false
 */
export function hasChinese(str) {
  return /[\u4e00-\u9fa5]/.test(str)
}

/**
 * 验证是否为空（null、undefined、空字符串、空数组、空对象）
 * @param {any} value - 值
 * @returns {boolean} 是否为空
 * 
 * @example
 * isEmpty('') // true
 * isEmpty([]) // true
 * isEmpty({}) // true
 * isEmpty('hello') // false
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

/**
 * 验证银行卡号格式（Luhn 算法）
 * @param {string} cardNumber - 银行卡号
 * @returns {boolean} 是否有效
 * 
 * @example
 * isBankCard('6222021234567890123') // true
 */
export function isBankCard(cardNumber) {
  if (!cardNumber || !/^\d{16,19}$/.test(cardNumber)) return false

  let sum = 0
  let isEven = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * 验证 IP 地址格式
 * @param {string} ip - IP 地址
 * @returns {boolean} 是否有效
 * 
 * @example
 * isIP('192.168.1.1') // true
 * isIP('256.1.1.1') // false
 */
export function isIP(ip) {
  const reg = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
  return reg.test(ip)
}
