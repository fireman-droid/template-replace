# Pinia Store 使用指南

## 📚 什么是 Store？

Store 是应用的**全局状态管理中心**，用于：
- 跨组件共享数据
- 持久化状态
- 集中管理业务逻辑

---

## 🏗️ Store 的三个核心概念

### 1. State（状态）- 存储数据
```javascript
const user = ref(null)          // 用户信息
const loading = ref(false)      // 加载状态
const cases = ref([])           // 案卷列表
```

### 2. Getters（计算属性）- 派生数据
```javascript
const isAuthenticated = computed(() => !!user.value)
const caseCount = computed(() => cases.value.length)
```

### 3. Actions（方法）- 修改状态
```javascript
async function login(credentials) {
  const data = await loginApi(credentials)
  user.value = data.user
}
```

---

## 💡 什么时候用 Store？

### ✅ 应该放在 Store：

| 场景 | 示例 | 原因 |
|------|------|------|
| **跨组件共享** | 用户信息、当前案卷 | 多个组件都需要访问 |
| **需要持久化** | 登录状态、token | 刷新后仍需保持 |
| **复杂业务逻辑** | 案卷的增删改查 | 统一管理，方便维护 |
| **全局状态** | 主题、语言设置 | 影响整个应用 |

### ❌ 不应该放在 Store：

| 场景 | 示例 | 原因 |
|------|------|------|
| **UI 状态** | 弹窗开关、当前标签页 | 只在组件内使用 |
| **临时数据** | 搜索关键词、临时表单 | 不需要共享 |
| **一次性数据** | 临时计算结果 | 用完即丢 |

---

## 🎯 项目中的 Store 设计

### 1. **Auth Store（认证）**
管理用户登录状态

```javascript
// client/src/stores/auth.js
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  // Actions
  async function login(credentials) { /* ... */ }
  function logout() { /* ... */ }
  
  return { token, user, isAuthenticated, isAdmin, login, logout }
})
```

**使用场景**：
- 登录/注册页面
- 路由守卫
- 需要用户信息的组件

### 2. **Case Store（案卷）**
管理案卷的增删改查

```javascript
// client/src/stores/case.js
export const useCaseStore = defineStore('case', () => {
  // State
  const cases = ref([])           // 案卷列表
  const currentCase = ref(null)   // 当前案卷
  const loading = ref(false)      // 加载状态
  
  // Getters
  const hasCurrentCase = computed(() => !!currentCase.value)
  const isDraft = computed(() => currentCase.value?.status === 'draft')
  
  // Actions
  async function fetchCases() { /* ... */ }
  async function create(data) { /* ... */ }
  async function update(id, data) { /* ... */ }
  
  return { cases, currentCase, loading, hasCurrentCase, isDraft, fetchCases, create, update }
})
```

**使用场景**：
- 案卷列表页
- 案卷编辑页
- 案卷详情页

### 3. **Template Store（模板）**
管理模板文件和预览

```javascript
// client/src/stores/template.js
export const useTemplateStore = defineStore('template', () => {
  // State
  const templates = ref([])               // 模板列表
  const currentTemplateFile = ref(null)   // 当前模板文件
  
  // Getters
  const hasTemplateFile = computed(() => !!currentTemplateFile.value)
  
  // Actions
  async function loadTemplateFile(caseId) { /* ... */ }
  function downloadTemplate(filename) { /* ... */ }
  
  return { templates, currentTemplateFile, hasTemplateFile, loadTemplateFile, downloadTemplate }
})
```

**使用场景**：
- 模板选择页
- 模板预览组件
- 文档生成功能

### 4. **App Store（应用）**
管理全局应用状态

```javascript
// client/src/stores/app.js
export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const theme = ref('light')
  
  // Actions
  function setLoading(value) { loading.value = value }
  function toggleTheme() { theme.value = theme.value === 'light' ? 'dark' : 'light' }
  
  return { loading, theme, setLoading, toggleTheme }
})
```

**使用场景**：
- 全局加载状态
- 主题切换
- 全局配置

---

## 📖 在组件中使用 Store

### 基本用法

```vue
<template>
  <div>
    <p>用户名: {{ username }}</p>
    <p>案卷数量: {{ cases.length }}</p>
    <button @click="handleLogin">登录</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useCaseStore } from '@/stores/case'

// 1. 获取 store 实例
const authStore = useAuthStore()
const caseStore = useCaseStore()

// 2. 访问 state
console.log(authStore.user)
console.log(caseStore.cases)

// 3. 访问 getters
console.log(authStore.isAuthenticated)
console.log(caseStore.hasCurrentCase)

// 4. 调用 actions
const handleLogin = async () => {
  await authStore.login({ email, password })
}

// 5. 解构（需要使用 storeToRefs）
import { storeToRefs } from 'pinia'
const { user, isAuthenticated } = storeToRefs(authStore)
const { login, logout } = authStore  // actions 不需要 storeToRefs
</script>
```

### 实际示例：ProjectEdit.vue

```vue
<template>
  <div class="editor-container">
    <!-- 显示案卷名称 -->
    <h1>{{ currentCase?.title }}</h1>
    
    <!-- 显示加载状态 -->
    <div v-if="loading">加载中...</div>
    
    <!-- 显示模板预览 -->
    <div v-if="hasTemplateFile">
      <button @click="downloadTemplate">下载模板</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCaseStore } from '@/stores/case'
import { useTemplateStore } from '@/stores/template'

const route = useRoute()

// 获取 store
const caseStore = useCaseStore()
const templateStore = useTemplateStore()

// 解构 state 和 getters（响应式）
const { currentCase, loading } = storeToRefs(caseStore)
const { hasTemplateFile } = storeToRefs(templateStore)

// 解构 actions（不需要 storeToRefs）
const { fetchCaseDetail, update } = caseStore
const { loadTemplateFile, downloadTemplate } = templateStore

// 加载数据
onMounted(async () => {
  const caseId = route.query.id
  
  // 1. 加载案卷详情
  await fetchCaseDetail(caseId)
  
  // 2. 如果有模板，加载模板文件
  if (currentCase.value?.template) {
    await loadTemplateFile(caseId)
  }
})

// 更新案卷名称
const updateCaseName = async (newName) => {
  await update(currentCase.value.id, { title: newName })
}
</script>
```

---

## 🔄 Store 之间的交互

### 方法 1: 在 Action 中调用其他 Store

```javascript
// stores/case.js
import { useTemplateStore } from './template'

export const useCaseStore = defineStore('case', () => {
  async function createWithTemplate(data) {
    // 1. 创建案卷
    const result = await create(data)
    
    // 2. 加载模板
    const templateStore = useTemplateStore()
    await templateStore.loadTemplateFile(result.case.id)
    
    return result
  }
  
  return { createWithTemplate }
})
```

### 方法 2: 在组件中协调多个 Store

```javascript
// 在组件中
const caseStore = useCaseStore()
const templateStore = useTemplateStore()

const handleCreate = async () => {
  // 1. 创建案卷
  const result = await caseStore.create(formData)
  
  // 2. 加载模板
  await templateStore.loadTemplateFile(result.case.id)
}
```

---

## 🎨 最佳实践

### 1. **命名规范**

```javascript
// ✅ 好的命名
const useCaseStore = defineStore('case', () => { /* ... */ })
const useAuthStore = defineStore('auth', () => { /* ... */ })

// ❌ 不好的命名
const caseStore = defineStore('case', () => { /* ... */ })
const store = defineStore('auth', () => { /* ... */ })
```

### 2. **State 设计**

```javascript
// ✅ 好的设计：扁平化、语义清晰
const cases = ref([])
const currentCase = ref(null)
const loading = ref(false)

// ❌ 不好的设计：嵌套过深
const data = ref({
  cases: {
    list: [],
    current: null,
    loading: false
  }
})
```

### 3. **Getters 使用**

```javascript
// ✅ 好的用法：派生数据
const draftCases = computed(() => 
  cases.value.filter(c => c.status === 'draft')
)

// ❌ 不好的用法：简单的属性访问
const casesLength = computed(() => cases.value.length)  // 直接用 cases.length 即可
```

### 4. **Actions 设计**

```javascript
// ✅ 好的设计：职责单一
async function fetchCases() { /* 只负责获取列表 */ }
async function create(data) { /* 只负责创建 */ }

// ❌ 不好的设计：职责混乱
async function fetchAndCreate(data) { 
  await fetchCases()
  await create(data)
}
```

### 5. **错误处理**

```javascript
// ✅ 好的做法：在 action 中抛出错误，在组件中处理
async function fetchCases() {
  try {
    const result = await getCaseList()
    cases.value = result.list
    return result
  } catch (error) {
    console.error('获取案卷列表失败:', error)
    throw error  // 抛出错误，让组件处理
  }
}

// 在组件中
try {
  await caseStore.fetchCases()
} catch (error) {
  ElMessage.error('加载失败，请重试')
}
```

---

## 🚀 实战技巧

### 1. **批量操作**

```javascript
// 批量更新案卷状态
async function batchUpdateStatus(ids, status) {
  const promises = ids.map(id => update(id, { status }))
  await Promise.all(promises)
  
  // 更新本地状态
  cases.value.forEach(c => {
    if (ids.includes(c.id)) {
      c.status = status
    }
  })
}
```

### 2. **乐观更新**

```javascript
// 先更新 UI，再调用 API
async function optimisticUpdate(id, data) {
  // 1. 保存旧数据
  const oldCase = { ...currentCase.value }
  
  // 2. 立即更新 UI
  currentCase.value = { ...currentCase.value, ...data }
  
  try {
    // 3. 调用 API
    await updateCase(id, data)
  } catch (error) {
    // 4. 失败时回滚
    currentCase.value = oldCase
    throw error
  }
}
```

### 3. **防抖/节流**

```javascript
import { debounce } from '@/utils'

// 防抖搜索
const debouncedSearch = debounce(async (keyword) => {
  await fetchCases({ keyword })
}, 500)
```

---

## 📝 总结

### Store 的核心价值

1. **数据共享** - 避免 props 层层传递
2. **状态持久化** - 刷新页面保持状态
3. **逻辑复用** - 统一管理业务逻辑
4. **可维护性** - 代码更清晰、更易维护

### 使用原则

- ✅ 共享的数据放 Store
- ✅ 复杂的逻辑放 Store
- ✅ 需要持久化的放 Store
- ❌ UI 状态不放 Store
- ❌ 临时数据不放 Store
- ❌ 一次性数据不放 Store

### 项目中的 Store 架构

```
stores/
├── auth.js      # 用户认证
├── case.js      # 案卷管理（新增）
├── template.js  # 模板管理（已改进）
└── app.js       # 全局应用状态
```

现在你可以在组件中使用这些 Store 来管理状态了！
