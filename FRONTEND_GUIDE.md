# 前端获取模板文件指南

## 📋 后端已完成

### 新增接口
```
GET /api/cases/:id/template-file
```

### 接口功能
- 获取指定案卷关联的模板 Word 文件
- 返回文件的二进制内容（Buffer）
- 自动进行权限验证
- 设置正确的响应头

---

## 🎯 前端实现步骤

### 第一步：添加 API 方法

在 `client/src/api/cases.js` 中添加：

```javascript
/**
 * 获取案卷的模板文件
 * @param {number} id - 案卷 ID
 * @returns {Promise<Blob>} 文件 Blob 对象
 */
export const getCaseTemplateFile = (id) => {
  return request({
    url: `/cases/${id}/template-file`,
    method: 'get',
    responseType: 'blob'  // 重要：指定返回类型为 blob
  })
}
```

---

### 第二步：安装 Word 预览库

选择一个 Word 预览库（推荐 docx-preview）：

```bash
npm install docx-preview
```

或者使用其他库：
- `mammoth` - 将 docx 转为 HTML
- `docx` - 创建和修改 docx 文件

---

### 第三步：在组件中使用

#### 方案 A: 使用 docx-preview（推荐）

```vue
<template>
  <div>
    <div ref="previewContainer" id="word-preview"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCaseTemplateFile } from '@/api/cases'
import { renderAsync } from 'docx-preview'

const previewContainer = ref(null)

const loadTemplateFile = async (caseId) => {
  try {
    // 1. 获取文件
    const blob = await getCaseTemplateFile(caseId)
    
    // 2. 渲染预览
    await renderAsync(blob, previewContainer.value, null, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: false,
      useMathMLPolyfill: false,
      renderChanges: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true
    })
    
    console.log('Word 文件预览成功')
  } catch (error) {
    console.error('加载模板文件失败:', error)
  }
}

onMounted(() => {
  const caseId = 10 // 从路由或 props 获取
  loadTemplateFile(caseId)
})
</script>

<style>
/* docx-preview 样式 */
#word-preview {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f5f5f5;
  padding: 20px;
}

.docx-wrapper {
  background: white;
  padding: 40px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  margin: 0 auto;
  max-width: 800px;
}
</style>
```

#### 方案 B: 使用 mammoth（转为 HTML）

```vue
<template>
  <div v-html="htmlContent"></div>
</template>

<script setup>
import { ref } from 'vue'
import { getCaseTemplateFile } from '@/api/cases'
import mammoth from 'mammoth'

const htmlContent = ref('')

const loadTemplateFile = async (caseId) => {
  try {
    const blob = await getCaseTemplateFile(caseId)
    const arrayBuffer = await blob.arrayBuffer()
    
    const result = await mammoth.convertToHtml({ arrayBuffer })
    htmlContent.value = result.value
  } catch (error) {
    console.error('加载模板文件失败:', error)
  }
}
</script>
```

#### 方案 C: 直接下载文件

```javascript
const downloadTemplateFile = async (caseId, fileName) => {
  try {
    const blob = await getCaseTemplateFile(caseId)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || '模板文件.docx'
    link.click()
    
    // 清理
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载文件失败:', error)
  }
}
```

---

## 🔧 完整示例（ProjectEdit.vue）

```vue
<template>
  <div class="editor-container">
    <!-- 工具栏 -->
    <header class="toolbar">
      <!-- ... 现有代码 ... -->
    </header>

    <div class="workspace">
      <!-- 左侧表单 -->
      <div class="left-pane">
        <ProjectForm :current-type="currentType" />
      </div>

      <!-- 右侧预览 -->
      <div class="right-pane">
        <div class="preview-header">
          <h3>模板预览</h3>
          <button @click="downloadTemplate">下载模板</button>
        </div>
        <div ref="previewContainer" class="preview-content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCaseDetail, getCaseTemplateFile } from '@/api'
import { renderAsync } from 'docx-preview'

const route = useRoute()
const previewContainer = ref(null)
const caseId = ref(null)
const templateBlob = ref(null)

// 加载案卷详情
const handleGetCaseDetail = async (id) => {
  const res = await getCaseDetail(id)
  caseName.value = res.title
  
  // 如果有模板，加载模板文件
  if (res.template) {
    await loadTemplateFile(id)
  }
}

// 加载模板文件
const loadTemplateFile = async (id) => {
  try {
    const blob = await getCaseTemplateFile(id)
    templateBlob.value = blob
    
    // 渲染预览
    await renderAsync(blob, previewContainer.value)
    console.log('模板预览加载成功')
  } catch (error) {
    console.error('加载模板失败:', error)
  }
}

// 下载模板
const downloadTemplate = () => {
  if (!templateBlob.value) return
  
  const url = window.URL.createObjectURL(templateBlob.value)
  const link = document.createElement('a')
  link.href = url
  link.download = `${caseName.value || '模板'}.docx`
  link.click()
  window.URL.revokeObjectURL(url)
}

onMounted(async () => {
  if (route.query.id) {
    caseId.value = route.query.id
    await handleGetCaseDetail(route.query.id)
  }
})
</script>

<style>
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: #f5f5f5;
}
</style>
```

---

## 📦 需要安装的依赖

```bash
# 推荐：docx-preview（最好的预览效果）
npm install docx-preview

# 或者：mammoth（转为 HTML）
npm install mammoth

# 或者：docx（用于创建和编辑）
npm install docx
```

---

## ⚠️ 注意事项

### 1. responseType 必须设置为 'blob'
```javascript
request({
  url: '/cases/1/template-file',
  method: 'get',
  responseType: 'blob'  // 必须设置！
})
```

### 2. 处理大文件
如果文件很大，考虑添加加载提示：
```javascript
const loading = ref(false)

const loadTemplateFile = async (id) => {
  loading.value = true
  try {
    const blob = await getCaseTemplateFile(id)
    await renderAsync(blob, previewContainer.value)
  } finally {
    loading.value = false
  }
}
```

### 3. 错误处理
```javascript
try {
  const blob = await getCaseTemplateFile(id)
  await renderAsync(blob, previewContainer.value)
} catch (error) {
  if (error.response?.status === 404) {
    ElMessage.error('模板文件不存在')
  } else if (error.response?.status === 403) {
    ElMessage.error('无权访问此文件')
  } else {
    ElMessage.error('加载模板失败')
  }
}
```

---

## 🎨 样式建议

```css
/* Word 预览容器 */
.preview-content {
  background: #525659;
  padding: 40px;
}

/* docx-preview 生成的内容 */
.docx-wrapper {
  background: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  margin: 0 auto;
  max-width: 21cm; /* A4 纸宽度 */
  min-height: 29.7cm; /* A4 纸高度 */
  padding: 2cm; /* 页边距 */
}

/* 分页 */
.docx-wrapper section.docx {
  page-break-after: always;
  margin-bottom: 20px;
}
```

---

## 🚀 测试步骤

1. **启动后端服务器**
   ```bash
   cd server
   npm run dev
   ```

2. **测试接口**
   ```bash
   curl -X GET http://localhost:5000/api/cases/10/template-file \
     -H "Authorization: Bearer YOUR_TOKEN" \
     --output test.docx
   ```

3. **在前端调用**
   - 添加 API 方法
   - 在组件中调用
   - 查看浏览器控制台和 Network 标签

---

## 📚 参考资源

- [docx-preview 文档](https://github.com/VolodymyrBaydalka/docxjs)
- [mammoth 文档](https://github.com/mwilliamson/mammoth.js)
- [docx 文档](https://docx.js.org/)

---

## ❓ 常见问题

**Q: 文件下载后是空的？**
A: 检查 `responseType: 'blob'` 是否设置

**Q: 预览显示乱码？**
A: 确保使用正确的库和正确的文件格式

**Q: 403 错误？**
A: 检查 token 是否正确，是否是案卷所有者

**Q: 404 错误？**
A: 检查案卷是否有关联模板，模板文件是否存在
