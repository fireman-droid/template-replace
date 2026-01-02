<template>
  <div class="panel-box">
    <div class="panel-header">
      <h3>模版核心库</h3>
      <button class="btn-cyber primary" @click="openCreateDialog">
        <el-icon><Upload /></el-icon> 部署新模版
      </button>
    </div>

    <div class="template-grid" v-loading="loading">
      <div class="tpl-card" v-for="tpl in templateList" :key="tpl.id" @click="handlePreview(tpl)">
        <div class="tpl-icon"><el-icon><DocumentChecked /></el-icon></div>
        <div class="tpl-info">
          <h4>{{ tpl.name }}</h4>
          <p>待填充: {{ countSpace(tpl.markData) }}</p>
          <p class="desc">描述:{{ tpl.description }}</p>
        </div>
        <div class="tpl-actions">
          <button class="icon-btn" @click.stop="handleEdit(tpl)"><el-icon><Edit /></el-icon></button>
          <button class="icon-btn danger" @click.stop="handleDelete(tpl.id)"><el-icon><Delete /></el-icon></button>
        </div>
      </div>
    </div>

    <!-- 模板预览弹窗 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="模板详情预览"
      width="1200px"
      class="admin-dialog preview-dialog"
      :modal="true"
      :append-to-body="true"
    >
      <TemplatePreview 
        v-if="currentTemplate" 
        :template="currentTemplate" 
        @download="handleDownload"
      />
    </el-dialog>

    <el-pagination
      v-if="pagination.total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next"
      @current-change="fetchTemplates"
      class="pagination"
    />

    <el-dialog
      v-model="showUploadDialog"
      :title="isEditMode ? '编辑模版' : '部署新法律模版'"
      width="800px"
      class="admin-dialog"
      :modal="true"
      :append-to-body="true"
      align-center
      @close="handleDialogClose"
    >
      <div class="deploy-content">
        <el-form label-position="top" class="cyber-form">
          <el-form-item label="模版名称">
            <el-input v-model="formData.name" placeholder="例如：股权转让协议书(标准版)" />
          </el-form-item>

          <el-form-item label="模版描述">
            <el-input v-model="formData.description" type="textarea" rows="3" placeholder="简要描述模板用途..." />
          </el-form-item>

          <div class="upload-grid">
            <div class="upload-item">
              <div class="upload-label"><el-icon><Document /></el-icon> Word 模版 (.docx)</div>
              <el-upload 
                class="mini-upload" 
                :auto-upload="false" 
                :limit="1" 
                accept=".docx"
                :on-change="handleDocxChange"
                drag
              >
                <div class="drop-area">
                  <el-icon><Plus /></el-icon>
                  <span>{{ uploadFiles.docx ? uploadFiles.docx.name : '点击上传' }}</span>
                </div>
              </el-upload>
            </div>
            <div class="upload-item">
              <div class="upload-label code-label"><el-icon><Connection /></el-icon> MarkData 配置 (.json)</div>
              <el-upload 
                class="mini-upload" 
                :auto-upload="false" 
                :limit="1" 
                accept=".json" 
                :on-change="handleMarkDataChange"
                drag
              >
                <div class="drop-area code-area">
                  <el-icon><Link /></el-icon>
                  <span>{{ uploadFiles.markData ? uploadFiles.markData.name : '上传配置文件' }}</span>
                </div>
              </el-upload>
            </div>
          </div>

          <div class="tips-box">
            <p><el-icon><InfoFilled /></el-icon> 提示：MarkData 配置文件包含表单结构和字段映射信息。</p>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cyber secondary" @click="showUploadDialog = false">取消</button>
          <button class="btn-cyber primary" @click="handleCreate">
            {{ isEditMode ? '保存修改' : '立即部署' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted,computed } from 'vue'
import { Upload, DocumentChecked, Edit, Delete, Document, Connection, Link, InfoFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateList, createTemplate, deleteTemplate, updateTemplate } from '@/api'
import TemplatePreview from '@/components/TemplatePreview.vue'
import { countSpace } from '@/utils'

const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const currentTemplate = ref(null)
const templateList = ref([])
const loading = ref(false)
const isEditMode = ref(false) // 是否编辑模式
const editingTemplateId = ref(null) // 正在编辑的模板ID
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = ref({
  name: '',
  description: '',
  markData: {}
})

const uploadFiles = ref({
  docx: null,
  markData: null
})

// 获取模板列表
const fetchTemplates = async () => {
  try {
    loading.value = true
    const data = await getTemplateList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    templateList.value = data.list
    pagination.value.total = data.total
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

// 文件上传处理
const handleDocxChange = (file) => {
  uploadFiles.value.docx = file.raw
}

// 读取markData文件
const handleMarkDataChange = async (file) => {
  uploadFiles.value.markData = file.raw
  
  // 直接读取 JSON 文件内容
  try {
    const text = await file.raw.text()
    const json = JSON.parse(text)
    formData.value.markData = json
    ElMessage.success('MarkData 文件读取成功')
  } catch (error) {
    ElMessage.error(`JSON 格式错误: ${error.message}`)
    uploadFiles.value.markData = null
    formData.value.markData = {}
  }
}

// 创建或更新模板
const handleCreate = async () => {
  try {
    if (!formData.value.name) {
      ElMessage.warning('请填写模板名称')
      return
    }

    // 新建时必须上传文件，编辑时可选
    if (!isEditMode.value) {
      if (!uploadFiles.value.docx) {
        ElMessage.warning('请上传 Word 模板文件')
        return
      }
      if (!uploadFiles.value.markData) {
        ElMessage.warning('请上传 MarkData 配置文件')
        return
      }
    }

    // 创建 FormData 对象
    const data = new FormData()
    data.append('name', formData.value.name)
    data.append('description', formData.value.description || '')
    
    // 只有上传了新文件才添加
    if (uploadFiles.value.docx?.size) {
      data.append('docx', uploadFiles.value.docx)
    }
    
    // 将 markData 对象转为 JSON 字符串
    const markDataStr = JSON.stringify(formData.value.markData)
    data.append('markData', markDataStr)

    if (isEditMode.value) {
      // 编辑模式：调用更新接口
      await updateTemplate(editingTemplateId.value, data)
      ElMessage.success('模板更新成功')
    } else {
      // 新建模式：调用创建接口
      await createTemplate(data)
      ElMessage.success('模板创建成功')
    }
    
    showUploadDialog.value = false
    resetForm()
    fetchTemplates()
  } catch (error) {
    console.error('操作失败:', error)
  }
}


// 删除模板
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTemplate(id)
    ElMessage.success('删除成功')
    fetchTemplates()
  } catch (error) {
    // 错误已在拦截器中处理（除了取消操作）
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    markData: {}
  }
  uploadFiles.value = {
    docx: null,
    markData: null
  }
  isEditMode.value = false
  editingTemplateId.value = null
}

// 打开新建弹窗
const openCreateDialog = () => {
  resetForm()
  showUploadDialog.value = true
}

// 关闭弹窗时重置
const handleDialogClose = () => {
  resetForm()
}

// 预览模板
const handlePreview = (template) => {
  currentTemplate.value = template
  showPreviewDialog.value = true
}

// 编辑模板
const handleEdit = (template) => {
  isEditMode.value = true
  editingTemplateId.value = template.id
  formData.value = {
    name: template.name,
    description: template.description,
    markData: template.markData || {}
  }
  // 显示已有文件信息
  uploadFiles.value = {
    docx: template.file_path ? { name: template.file_path } : null,
    markData: template.markData ? { name: 'markData.json' } : null
  }
  showUploadDialog.value = true
}

// 下载模板
const handleDownload = async (id) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }

    // 使用 fetch 下载文件，可以带上 token
    const response = await fetch(`/api/admin/templates/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('下载失败')
    }

    // 使用模板名称作为文件名
    const filename = `${currentTemplate.value?.name || 'template'}.docx`

    // 创建 Blob 并下载
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.1);

// 复用之前的通用样式
.panel-box {
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid $border;
  border-radius: 12px;
  padding: 24px;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    h3 { margin: 0; font-size: 20px; border-left: 4px solid $accent; padding-left: 12px; color: $text-main; }
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  
  .tpl-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid $border;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s;
    
    &:hover { border-color: $primary; background: rgba(59, 130, 246, 0.05); }
    
    .tpl-icon { width: 48px; height: 48px; background: rgba($primary, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: $primary; font-size: 24px; }
    .tpl-info { flex: 1; min-width: 0; h4 { margin: 0 0 6px; color: $text-main; } p { margin: 0 0 4px; font-size: 12px; color: $text-sub; } .desc { color: #64748b; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; } }
    .tpl-actions { display: flex; gap: 8px; .icon-btn { background: rgba(255,255,255,0.05); border: none; width: 32px; height: 32px; border-radius: 4px; color: $text-sub; cursor: pointer; &:hover { background: white; color: black; } &.danger:hover { background: #ef4444; color: white; } } }
  }
}

.btn-cyber {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  &.primary { background: $primary; color: white; &:hover { background: lighten($primary, 5%); } }
  &.secondary { background: transparent; border: 1px solid $text-sub; color: $text-sub; &:hover { border-color: white; color: white; } }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination) {
  .el-pager li { background: rgba(255,255,255,0.05); color: $text-sub; border: 1px solid $border; &.is-active { background: $primary; color: white; } }
  button { background: rgba(255,255,255,0.05); color: $text-sub; border: 1px solid $border; }
}



.tpl-card {
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.2);
  }
}
</style>

<style lang="scss">
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.1);

.admin-dialog {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 12px !important;
  
  .el-dialog__header { border-bottom: 1px solid rgba(255,255,255,0.05); margin-right: 0; padding: 20px 24px !important; .el-dialog__title { color: white !important; font-weight: 700; } }
  .el-dialog__body { padding: 0 !important; }
  .el-dialog__footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 16px 24px !important; .dialog-footer { display: flex; justify-content: flex-end; gap: 12px; } }
  

}

.deploy-content {
  padding: 24px;
  
  .upload-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin: 20px 0;
    width: 100%;
    
    .upload-item {
      .upload-label { font-size: 13px; color: $text-main; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; &.code-label { color: $accent; } }
      
      .el-upload-dragger {
        height: 120px !important;
        width: 100% !important;
        border: 1px dashed $border !important;
        background: rgba(255,255,255,0.02) !important;
        border-radius: 8px !important;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: $text-sub;
        transition: all 0.3s;
        padding: 0 !important;
        
        .drop-area { display: flex; flex-direction: column; align-items: center; .el-icon { font-size: 24px; margin-bottom: 8px; } &.code-area .el-icon { color: $accent; } }
        
        &:hover { border-color: $primary !important; background: rgba($primary, 0.05) !important; .el-icon { color: $primary; } }
      }
    }
  }

  .tips-box {
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.2);
    padding: 10px;
    border-radius: 6px;
    p { margin: 0; font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 6px; }
  }

  .el-form-item__label { color: #e2e8f0 !important; }
  .el-input__wrapper, .el-select__wrapper {
    background-color: rgba(255,255,255,0.05) !important;
    box-shadow: none !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    .el-input__inner { color: white !important; }
  }
}
</style>