# Template Store 使用指南

## 📋 设计理念

Template Store 专注于处理**单个模板文件**的操作，而不是管理模板列表。

### 核心功能
1. **加载模板文件** - 从服务器获取 Word 文件
2. **解析模板内容** - 提取 XML 和占位符
3. **替换占位符** - 填充用户数据
4. **预览和下载** - 展示和导出文件

---

## 🏗️ Store 结构

### State（状态）

```javascript
templateFile      // Blob - 模板文件对象
templateInfo      // Object - 模板信息（名称、字段等）
parsedXml         // String - 解析后的 XML 内容
placeholders      // Array - 占位符列表 ['姓名', '日期']
loading           // Boolean - 加载状态
error             // String - 错误信息
```

### Getters（计算属性）

```javascript
hasFile           // 是否已加载文件
hasInfo           // 是否有模板信息
isParsed          // 是否已解析
fileSize          // 文件大小（格式化）
placeholderCount  // 占位符数量
```

### Actions（方法）

```javascript
loadFile(caseId)              // 加载模板文件
setInfo(info)                 // 设置模板信息
parseXml()                    // 解析 XML
extractPlaceholders()         // 提取占位符
replacePlaceholders(data)     // 替换占位符
download(filename)            // 下载文件
getArrayBuffer()              // 获取 ArrayBuffer
getBase64()                   // 获取 Base64
clear()                       // 清空数据
reload(caseId)                // 重新加载
```

---

## 💡 使用场景

### 场景 1: 加载和预览模板

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="hasFile">
      <p>文件大小: {{ fileSize }}</p>
      <button @click="handleDownload">下载模板</button>
      <div ref="previewContainer"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTemplateStore } from '@/stores/template'
import { renderAsync } from 'docx-preview'

const templateStore = useTemplateStore()
const { hasFile, fileSize, loading, error } = storeToRefs(templateStore)
const { loadFile, setInfo, download } = templateStore

const previewContainer = ref(null)

onMounted(async () => {
  const caseId = 10
  
  // 1. 加载模板文件
  const blob = await loadFile(caseId)
  
  // 2. 设置模板信息（从案卷详情中获取）
  setInfo({
    name: '离婚协议书',
    fields: { husband_name: '男方姓名', wife_name: '女方姓名' }
  })
  
  // 3. 预览模板
  await renderAsync(blob, previewContainer.value)
})

const handleDownload = () => {
  download('离婚协议书')
}
</script>
```

---

### 场景 2: 解析和替换占位符

```vue
<script setup>
import { useTemplateStore } from '@/stores/template'

const templateStore = useTemplateStore()

const processTemplate = async () => {
  // 1. 加载模板
  await templateStore.loadFile(caseId)
  
  // 2. 解析 XML
  await templateStore.parseXml()
  
  // 3. 提取占位符
  const placeholders = templateStore.extractPlaceholders()
  console.log('占位符:', placeholders)  // ['姓名', '日期', '金额']
  
  // 4. 替换占位符
  const newXml = templateStore.replacePlaceholders({
    姓名: '张三',
    日期: '2025-11-22',
    金额: '10000'
  })
  
  // 5. 生成新的文档（需要额外的库）
  // ...
}
</script>
```

---

### 场景 3: 在 ProjectEdit.vue 中使用

```vue
<template>
  <div class="editor-container">
    <header class="toolbar">
      <div class="left">
        <h1>{{ caseName }}</h1>
      </div>
      <div class="right">
        <button @click="handleDownload" :disabled="!hasFile">
          下载模板
        </button>
        <button @click="handleGenerate">
          生成文书
        </button>
      </div>
    </header>

    <div class="workspace">
      <!-- 左侧：表单 -->
      <div class="left-pane">
        <ProjectForm :fields="templateInfo?.fields" />
      </div>

      <!-- 右侧：预览 -->
      <div class="right-pane">
        <div v-if="loading" class="loading">
          加载模板中...
        </div>
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        <div v-else ref="previewContainer" class="preview"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCaseStore } from '@/stores/case'
import { useTemplateStore } from '@/stores/template'
import { renderAsync } from 'docx-preview'

const route = useRoute()
const caseStore = useCaseStore()
const templateStore = useTemplateStore()

// 解构状态
const { currentCase } = storeToRefs(caseStore)
const { hasFile, templateInfo, loading, error, fileSize } = storeToRefs(templateStore)

// 解构方法
const { fetchCaseDetail } = caseStore
const { loadFile, setInfo, download } = templateStore

const previewContainer = ref(null)
const caseName = ref('')

// 初始化
onMounted(async () => {
  const caseId = route.query.id
  
  // 1. 加载案卷详情
  await fetchCaseDetail(caseId)
  caseName.value = currentCase.value.title
  
  // 2. 如果有模板，加载模板文件
  if (currentCase.value.template) {
    // 设置模板信息
    setInfo(currentCase.value.template)
    
    // 加载模板文件
    const blob = await loadFile(caseId)
    
    // 预览模板
    await renderAsync(blob, previewContainer.value)
  }
})

// 下载模板
const handleDownload = () => {
  download(caseName.value)
}

// 生成文书
const handleGenerate = async () => {
  // 1. 解析模板
  await templateStore.parseXml()
  
  // 2. 替换占位符
  const formData = currentCase.value.form_data
  const newXml = templateStore.replacePlaceholders(formData)
  
  // 3. 生成新文档
  // ...
}
</script>
```

---

### 场景 4: 获取不同格式的文件

```javascript
// 获取 Blob（用于预览）
const blob = templateStore.templateFile

// 获取 ArrayBuffer（用于某些库）
const arrayBuffer = await templateStore.getArrayBuffer()

// 获取 Base64（用于传输）
const base64 = await templateStore.getBase64()

// 使用示例
import { renderAsync } from 'docx-preview'
await renderAsync(blob, container)

import mammoth from 'mammoth'
const result = await mammoth.convertToHtml({ arrayBuffer })
```

---

## 🔄 完整的工作流程

### 1. 加载阶段

```javascript
// 加载案卷详情
const caseDetail = await getCaseDetail(caseId)

// 设置模板信息
templateStore.setInfo(caseDetail.template)

// 加载模板文件
await templateStore.loadFile(caseId)
```

### 2. 预览阶段

```javascript
// 使用 docx-preview 预览
import { renderAsync } from 'docx-preview'
await renderAsync(templateStore.templateFile, container)
```

### 3. 编辑阶段（可选）

```javascript
// 解析模板
await templateStore.parseXml()

// 提取占位符
const placeholders = templateStore.extractPlaceholders()

// 显示表单让用户填写
// ...

// 替换占位符
const newXml = templateStore.replacePlaceholders(formData)
```

### 4. 导出阶段

```javascript
// 直接下载原模板
templateStore.download('我的文档')

// 或生成新文档后下载
// ...
```

---

## 🎨 最佳实践

### 1. 错误处理

```javascript
try {
  await templateStore.loadFile(caseId)
} catch (error) {
  if (error.response?.status === 404) {
    ElMessage.error('模板文件不存在')
  } else {
    ElMessage.error('加载模板失败')
  }
}
```

### 2. 加载状态

```vue
<template>
  <div v-if="loading">
    <el-icon class="is-loading"><Loading /></el-icon>
    加载中...
  </div>
</template>

<script setup>
const { loading } = storeToRefs(templateStore)
</script>
```

### 3. 清理资源

```javascript
// 组件卸载时清理
onUnmounted(() => {
  templateStore.clear()
})

// 或切换案卷时清理
watch(() => route.query.id, () => {
  templateStore.clear()
})
```

### 4. 重新加载

```javascript
// 刷新模板
const handleRefresh = async () => {
  await templateStore.reload(caseId)
  await renderAsync(templateStore.templateFile, container)
}
```

---

## 📊 与 Case Store 的配合

```javascript
// Case Store 负责：
// - 案卷的增删改查
// - 案卷列表管理
// - 当前案卷状态

// Template Store 负责：
// - 单个模板文件的处理
// - 模板内容的解析
// - 占位符的替换

// 配合使用：
const caseStore = useCaseStore()
const templateStore = useTemplateStore()

// 1. 从 Case Store 获取案卷信息
await caseStore.fetchCaseDetail(caseId)
const template = caseStore.currentCase.template

// 2. 传递给 Template Store 处理
templateStore.setInfo(template)
await templateStore.loadFile(caseId)
```

---

## 🚀 高级用法

### 1. 批量替换

```javascript
const batchReplace = (templates, dataList) => {
  return dataList.map(data => {
    return templateStore.replacePlaceholders(data)
  })
}
```

### 2. 模板验证

```javascript
const validateTemplate = () => {
  const placeholders = templateStore.extractPlaceholders()
  const requiredFields = templateStore.templateInfo.fields
  
  const missing = Object.keys(requiredFields).filter(
    field => !placeholders.includes(field)
  )
  
  if (missing.length > 0) {
    console.warn('模板缺少占位符:', missing)
  }
}
```

### 3. 自动保存

```javascript
import { watchDebounced } from '@vueuse/core'

watchDebounced(
  () => templateStore.parsedXml,
  (newXml) => {
    // 自动保存修改后的模板
    localStorage.setItem('template_draft', newXml)
  },
  { debounce: 1000 }
)
```

---

## 📝 总结

### Template Store 的职责

- ✅ 加载单个模板文件
- ✅ 解析模板内容
- ✅ 提取和替换占位符
- ✅ 提供预览和下载功能
- ❌ 不管理模板列表（由 Case Store 或专门的 Templates Store 管理）
- ❌ 不处理案卷逻辑（由 Case Store 管理）

### 核心优势

1. **职责单一** - 只处理单个模板
2. **易于使用** - API 简洁明了
3. **灵活扩展** - 可以添加更多处理方法
4. **状态清晰** - 状态管理简单直观

现在你可以专注于处理单个模板的各种操作了！
