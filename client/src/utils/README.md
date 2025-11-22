# Utils 工具函数库

这是一个包含常用工具函数的库，提供了防抖、节流、格式化、验证、存储等功能。

## 📦 安装使用

```javascript
// 导入单个函数
import { debounce, formatDate } from '@/utils'

// 导入所有函数
import * as utils from '@/utils'
```

## 📚 功能模块

### 1. 防抖与节流 (debounce.js / throttle.js)

#### debounce - 防抖函数
在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

```javascript
import { debounce } from '@/utils'

// 搜索输入框防抖
const handleSearch = debounce((value) => {
  console.log('搜索:', value)
}, 500)

// 立即执行版本
const handleClick = debounce(() => {
  console.log('点击')
}, 1000, true)
```

#### throttle - 节流函数
规定在一个单位时间内，只能触发一次函数。

```javascript
import { throttle } from '@/utils'

// 滚动事件节流
const handleScroll = throttle(() => {
  console.log('滚动事件')
}, 1000)

// 配置选项
const handleResize = throttle(() => {
  console.log('窗口大小改变')
}, 500, { leading: true, trailing: false })
```

---

### 2. 格式化 (format.js)

#### formatDate - 格式化日期时间
```javascript
import { formatDate } from '@/utils'

formatDate(new Date()) // '2025-11-22 15:30:45'
formatDate(new Date(), 'YYYY-MM-DD') // '2025-11-22'
formatDate(1700654400000, 'YYYY年MM月DD日') // '2023年11月22日'
```

#### formatFileSize - 格式化文件大小
```javascript
import { formatFileSize } from '@/utils'

formatFileSize(1024) // '1.00 KB'
formatFileSize(1048576) // '1.00 MB'
formatFileSize(1234567, 1) // '1.2 MB'
```

#### formatNumber - 格式化数字（千分位）
```javascript
import { formatNumber } from '@/utils'

formatNumber(1234567) // '1,234,567'
formatNumber(1234567.89, 2) // '1,234,567.89'
```

#### formatPhone - 格式化手机号
```javascript
import { formatPhone } from '@/utils'

formatPhone('13812345678') // '138****5678'
```

#### formatIdCard - 格式化身份证号
```javascript
import { formatIdCard } from '@/utils'

formatIdCard('110101199001011234') // '110101********1234'
```

#### formatBankCard - 格式化银行卡号
```javascript
import { formatBankCard } from '@/utils'

formatBankCard('6222021234567890123') // '6222 0212 3456 7890 123'
```

#### formatMoney - 格式化金额
```javascript
import { formatMoney } from '@/utils'

formatMoney(1234567.89) // '¥1,234,567.89'
formatMoney(1234567.89, '$') // '$1,234,567.89'
```

#### formatRelativeTime - 格式化相对时间
```javascript
import { formatRelativeTime } from '@/utils'

formatRelativeTime(new Date()) // '刚刚'
formatRelativeTime(Date.now() - 60000) // '1分钟前'
formatRelativeTime(Date.now() - 3600000) // '1小时前'
```

---

### 3. 验证 (validate.js)

#### isEmail - 验证邮箱
```javascript
import { isEmail } from '@/utils'

isEmail('test@example.com') // true
isEmail('invalid-email') // false
```

#### isPhone - 验证手机号
```javascript
import { isPhone } from '@/utils'

isPhone('13812345678') // true
isPhone('12345678901') // false
```

#### isIdCard - 验证身份证号
```javascript
import { isIdCard } from '@/utils'

isIdCard('110101199001011234') // true
```

#### isUrl - 验证 URL
```javascript
import { isUrl } from '@/utils'

isUrl('https://www.example.com') // true
isUrl('not-a-url') // false
```

#### isStrongPassword - 验证密码强度
```javascript
import { isStrongPassword } from '@/utils'

isStrongPassword('123456') // true
isStrongPassword('abc', { minLength: 6 }) // false
isStrongPassword('abc123', { 
  minLength: 6,
  requireNumber: true, 
  requireLetter: true 
}) // true
```

#### isEmpty - 验证是否为空
```javascript
import { isEmpty } from '@/utils'

isEmpty('') // true
isEmpty([]) // true
isEmpty({}) // true
isEmpty('hello') // false
```

#### 其他验证函数
- `isNumber(value)` - 验证是否为纯数字
- `isInteger(value)` - 验证是否为整数
- `isPositiveInteger(value)` - 验证是否为正整数
- `isChinese(str)` - 验证是否为中文
- `hasChinese(str)` - 验证是否包含中文
- `isBankCard(cardNumber)` - 验证银行卡号
- `isIP(ip)` - 验证 IP 地址

---

### 4. 存储 (storage.js)

#### localStorage 操作

```javascript
import { setLocal, getLocal, removeLocal, clearLocal } from '@/utils'

// 存储数据
setLocal('user', { name: 'John' })

// 存储带过期时间的数据（3600秒后过期）
setLocal('token', 'abc123', 3600)

// 获取数据
const user = getLocal('user')

// 删除数据
removeLocal('user')

// 清空所有数据
clearLocal()
```

#### sessionStorage 操作

```javascript
import { setSession, getSession, removeSession, clearSession } from '@/utils'

// 存储数据
setSession('tempData', { id: 1 })

// 获取数据
const tempData = getSession('tempData')

// 删除数据
removeSession('tempData')

// 清空所有数据
clearSession()
```

---

### 5. 通用工具 (common.js)

#### deepClone - 深拷贝
```javascript
import { deepClone } from '@/utils'

const obj = { a: 1, b: { c: 2 } }
const copied = deepClone(obj)
```

#### generateId - 生成唯一 ID
```javascript
import { generateId } from '@/utils'

generateId() // 'a1b2c3d4'
generateId('user_') // 'user_a1b2c3d4'
```

#### sleep - 延迟执行
```javascript
import { sleep } from '@/utils'

await sleep(1000) // 延迟 1 秒
```

#### getUrlParam / getUrlParams - 获取 URL 参数
```javascript
import { getUrlParam, getUrlParams } from '@/utils'

// 获取单个参数
getUrlParam('id') // '123'

// 获取所有参数
getUrlParams() // { id: '123', name: 'John' }
```

#### objectToQuery - 对象转 URL 参数
```javascript
import { objectToQuery } from '@/utils'

objectToQuery({ id: 123, name: 'John' }) // 'id=123&name=John'
```

#### unique - 数组去重
```javascript
import { unique } from '@/utils'

unique([1, 2, 2, 3]) // [1, 2, 3]
unique([{id: 1}, {id: 2}, {id: 1}], 'id') // [{id: 1}, {id: 2}]
```

#### groupBy - 数组分组
```javascript
import { groupBy } from '@/utils'

const data = [
  { type: 'a', val: 1 },
  { type: 'b', val: 2 },
  { type: 'a', val: 3 }
]
groupBy(data, 'type')
// { a: [{type: 'a', val: 1}, {type: 'a', val: 3}], b: [{type: 'b', val: 2}] }
```

#### flattenTree - 树形数据扁平化
```javascript
import { flattenTree } from '@/utils'

const tree = [
  { id: 1, children: [{ id: 2 }] }
]
flattenTree(tree) // [{ id: 1 }, { id: 2 }]
```

#### arrayToTree - 数组转树形结构
```javascript
import { arrayToTree } from '@/utils'

const arr = [
  { id: 1, parentId: null, name: 'A' },
  { id: 2, parentId: 1, name: 'B' }
]
arrayToTree(arr)
// [{ id: 1, parentId: null, name: 'A', children: [{ id: 2, parentId: 1, name: 'B', children: [] }] }]
```

#### downloadFile - 下载文件
```javascript
import { downloadFile } from '@/utils'

downloadFile('/api/files/123', 'document.pdf')
```

#### copyToClipboard - 复制到剪贴板
```javascript
import { copyToClipboard } from '@/utils'

await copyToClipboard('Hello World')
```

#### random - 获取随机数
```javascript
import { random } from '@/utils'

random(1, 10) // 1-10 之间的随机整数
```

#### shuffle - 打乱数组顺序
```javascript
import { shuffle } from '@/utils'

shuffle([1, 2, 3, 4, 5]) // [3, 1, 5, 2, 4]
```

---

## 🎯 在 Vue 组件中使用

### 示例 1: 搜索框防抖

```vue
<template>
  <el-input 
    v-model="keyword" 
    @input="handleSearch"
    placeholder="请输入搜索关键词"
  />
</template>

<script setup>
import { ref } from 'vue'
import { debounce } from '@/utils'

const keyword = ref('')

const handleSearch = debounce((value) => {
  console.log('搜索:', value)
  // 调用搜索 API
}, 500)
</script>
```

### 示例 2: 滚动加载节流

```vue
<template>
  <div @scroll="handleScroll" class="scroll-container">
    <!-- 内容 -->
  </div>
</template>

<script setup>
import { throttle } from '@/utils'

const handleScroll = throttle((event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    console.log('到达底部，加载更多')
    // 加载更多数据
  }
}, 300)
</script>
```

### 示例 3: 表单验证

```vue
<template>
  <el-form :model="form" :rules="rules">
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
    <el-form-item label="手机号" prop="phone">
      <el-input v-model="form.phone" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive } from 'vue'
import { isEmail, isPhone } from '@/utils'

const form = reactive({
  email: '',
  phone: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!isEmail(value)) {
        callback(new Error('邮箱格式不正确'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!isPhone(value)) {
        callback(new Error('手机号格式不正确'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}
</script>
```

### 示例 4: 数据格式化显示

```vue
<template>
  <div>
    <p>日期: {{ formatDate(date) }}</p>
    <p>金额: {{ formatMoney(amount) }}</p>
    <p>文件大小: {{ formatFileSize(fileSize) }}</p>
    <p>手机号: {{ formatPhone(phone) }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatDate, formatMoney, formatFileSize, formatPhone } from '@/utils'

const date = ref(new Date())
const amount = ref(1234567.89)
const fileSize = ref(1048576)
const phone = ref('13812345678')
</script>
```

---

## 📝 注意事项

1. **防抖和节流的区别**
   - 防抖：事件触发后等待 n 秒再执行，期间再次触发会重新计时
   - 节流：事件触发后立即执行，n 秒内再次触发不会执行

2. **存储过期时间**
   - `setLocal` 的过期时间单位是秒
   - 过期后再次获取会自动删除并返回 null

3. **深拷贝限制**
   - 不支持拷贝函数、Symbol、循环引用
   - 如需更强大的深拷贝，建议使用 lodash 的 cloneDeep

4. **浏览器兼容性**
   - `copyToClipboard` 在旧浏览器中使用 `document.execCommand` 作为降级方案
   - `getUrlParam` 使用 URL API，IE 不支持

---

## 🔧 扩展建议

如果需要更多功能，可以考虑引入以下库：

- **lodash** - 更强大的工具函数库
- **dayjs** - 更强大的日期处理库
- **validator.js** - 更全面的验证库
- **qs** - URL 参数处理库

```bash
npm install lodash dayjs validator qs
```
