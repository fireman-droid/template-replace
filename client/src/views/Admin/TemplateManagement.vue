<template>
  <div class="panel-box">
    <div class="panel-header">
      <h3>模版核心库</h3>
      <button class="btn-cyber primary" @click="showUploadDialog = true">
        <el-icon><Upload /></el-icon> 部署新模版
      </button>
    </div>

    <div class="template-grid" v-loading="loading">
      <div class="tpl-card" v-for="tpl in templateList" :key="tpl.id">
        <div class="tpl-icon"><el-icon><DocumentChecked /></el-icon></div>
        <div class="tpl-info">
          <h4>{{ tpl.name }}</h4>
          <p>分类: {{ tpl.category }} | 字段: {{ tpl.fields?.length || 0 }}个</p>
          <p class="desc">{{ tpl.description }}</p>
        </div>
        <div class="tpl-actions">
          <button class="icon-btn"><el-icon><Edit /></el-icon></button>
          <button class="icon-btn danger" @click="handleDelete(tpl.id)"><el-icon><Delete /></el-icon></button>
        </div>
      </div>
    </div>

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
      title="部署新法律模版"
      width="800px"
      class="admin-dialog"
      :modal="true"
      :append-to-body="true"
      align-center
    >
      <div class="deploy-content">
        <el-form label-position="top" class="cyber-form">
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="模版名称">
                <el-input v-model="formData.name" placeholder="例如：股权转让协议书(标准版)" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="案由分类">
                <el-select v-model="formData.category" placeholder="选择分类">
                  <el-option label="离婚纠纷" value="divorce" />
                  <el-option label="买卖合同" value="sales" />
                  <el-option label="房屋租赁" value="house" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="模版描述">
            <el-input v-model="formData.description" type="textarea" rows="3" placeholder="简要描述模板用途..." />
          </el-form-item>

          <div class="upload-grid">
            <div class="upload-item">
              <div class="upload-label"><el-icon><Document /></el-icon> Word 模版 (.docx)</div>
              <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1" drag>
                <div class="drop-area">
                  <el-icon><Plus /></el-icon>
                  <span>点击上传</span>
                </div>
              </el-upload>
            </div>
            <div class="upload-item">
              <div class="upload-label code-label"><el-icon><Connection /></el-icon> 结构表 (Schema)</div>
              <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1" accept=".json" drag>
                <div class="drop-area code-area">
                  <el-icon><Link /></el-icon>
                  <span>定义表单结构</span>
                </div>
              </el-upload>
            </div>
            <div class="upload-item">
              <div class="upload-label code-label"><el-icon><Link /></el-icon> 映射表 (Map)</div>
              <el-upload class="mini-upload" action="#" :auto-upload="false" :limit="1" accept=".json" drag>
                <div class="drop-area code-area">
                  <el-icon><Link /></el-icon>
                  <span>Tag ↔ Key 映射</span>
                </div>
              </el-upload>
            </div>
          </div>

          <div class="tips-box">
            <p><el-icon><InfoFilled /></el-icon> 提示：结构表用于生成前端表单，映射表用于将表单数据填充回 Word 内容控件。</p>
          </div>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="btn-cyber secondary" @click="showUploadDialog = false">取消</button>
          <button class="btn-cyber primary" @click="handleCreate">立即部署</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Upload, DocumentChecked, Edit, Delete, Document, Connection, Link, InfoFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateList, createTemplate, deleteTemplate } from '@/api'

const showUploadDialog = ref(false)
const templateList = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = ref({
  name: '',
  description: '',
  category: '',
  fields: []
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

// 创建模板
const handleCreate = async () => {
  try {
    if (!formData.value.name || !formData.value.category) {
      ElMessage.warning('请填写模板名称和分类')
      return
    }

    await createTemplate(formData.value)
    ElMessage.success('模板创建成功')
    showUploadDialog.value = false
    resetForm()
    fetchTemplates()
  } catch (error) {
    // 错误已在拦截器中处理
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
    category: '',
    fields: []
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
    .tpl-info { flex: 1; h4 { margin: 0 0 6px; color: $text-main; } p { margin: 0 0 4px; font-size: 12px; color: $text-sub; } .desc { color: #64748b; font-size: 11px; } }
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
    grid-template-columns: repeat(3, 1fr);
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