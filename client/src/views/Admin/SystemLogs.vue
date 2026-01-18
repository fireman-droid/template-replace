<template>
  <div class="system-logs">
    <div class="logs-card">
      <!-- 顶部筛选栏 -->
      <div class="filter-bar">
        <el-select v-model="filters.action" placeholder="操作类型" clearable style="width: 140px" @change="fetchLogs">
          <el-option label="创建" value="CREATE" />
          <el-option label="更新" value="UPDATE" />
          <el-option label="删除" value="DELETE" />
          <el-option label="登录" value="LOGIN" />
          <el-option label="角色变更" value="ROLE_CHANGE" />
          <el-option label="AI分析" value="AI_ANALYZE" />
        </el-select>
        <el-select v-model="filters.resourceType" placeholder="资源类型" clearable style="width: 120px" @change="fetchLogs">
          <el-option label="用户" value="USER" />
          <el-option label="模板" value="TEMPLATE" />
          <el-option label="案卷" value="CASE" />
          <el-option label="项目" value="PROJECT" />
        </el-select>
        <el-input
          v-model="filters.keyword"
          placeholder="搜索用户名或内容..."
          clearable
          style="width: 200px"
          @keyup.enter="fetchLogs"
          @clear="fetchLogs"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Refresh" @click="fetchLogs" :loading="loading">刷新</el-button>
      </div>

      <!-- 日志表格 -->
      <div class="table-container">
        <el-table
          :data="logs"
          v-loading="loading"
          stripe
          style="width: 100%; height: 100%"
          :header-cell-style="{ background: 'transparent', color: '#94a3b8' }"
        >
          <el-table-column label="时间" width="180">
            <template #default="{ row }">
              <span class="time-cell">{{ formatTime(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作者" width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :size="28" class="avatar">{{ row.username?.charAt(0)?.toUpperCase() || '?' }}</el-avatar>
                <span>{{ row.username || '系统' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-tag :type="getActionTagType(row.action)" size="small" effect="dark" style="border: none">
                {{ getActionLabel(row.action) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="资源类型" width="100">
            <template #default="{ row }">
              <span class="resource-type">{{ getResourceLabel(row.resource_type) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="详情" min-width="200">
            <template #default="{ row }">
              <el-tooltip 
                v-if="getDetailsMessage(row.details).length > 50"
                :content="getDetailsMessage(row.details)" 
                placement="top" 
                max-width="500"
              >
                <span class="details-cell">{{ getDetailsMessage(row.details) }}</span>
              </el-tooltip>
              <span v-else class="details-cell">{{ getDetailsMessage(row.details) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="IP地址" width="140">
            <template #default="{ row }">
              <code class="ip-cell">{{ row.ip || '-' }}</code>
            </template>
          </el-table-column>
          
          <template #empty>
            <div class="empty-state">
              <el-icon class="empty-icon" :size="60"><Monitor /></el-icon>
              <p>暂无日志记录</p>
            </div>
          </template>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchLogs"
          @current-change="fetchLogs"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Monitor, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const loading = ref(false)
const logs = ref([])

const filters = reactive({
  action: '',
  resourceType: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE}/admin/logs`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        keyword: filters.keyword || undefined
      }
    })
    logs.value = response.data.list || []
    pagination.total = response.data.total || 0
  } catch (error) {
    console.error('获取日志失败:', error)
    ElMessage.error('获取日志失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取操作类型标签颜色
const getActionTagType = (action) => {
  const types = {
    CREATE: 'success',
    UPDATE: 'warning',
    DELETE: 'danger',
    LOGIN: 'info',
    LOGOUT: 'info',
    ROLE_CHANGE: 'warning',
    UPLOAD: 'success',
    DOWNLOAD: '',
    AI_ANALYZE: 'primary'
  }
  return types[action] || ''
}

// 获取操作类型中文标签
const getActionLabel = (action) => {
  const labels = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    LOGIN: '登录',
    LOGOUT: '登出',
    REGISTER: '注册',
    ROLE_CHANGE: '角色变更',
    UPLOAD: '上传',
    DOWNLOAD: '下载',
    AI_ANALYZE: 'AI分析',
    SYSTEM_ERROR: '系统错误'
  }
  return labels[action] || action
}

// 获取资源类型中文标签
const getResourceLabel = (resourceType) => {
  const labels = {
    USER: '用户',
    TEMPLATE: '模板',
    CASE: '案卷',
    PROJECT: '项目'
  }
  return labels[resourceType] || resourceType || '-'
}

// 获取详情信息
const getDetailsMessage = (details) => {
  if (!details) return '-'
  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details
    return parsed.message || JSON.stringify(parsed)
  } catch {
    return details
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.system-logs {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 玻璃拟态卡片容器 */
.logs-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.table-container {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.time-cell {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: -0.5px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.resource-type {
  color: #64748b;
  font-size: 12px;
  background: rgba(100, 116, 139, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.details-cell {
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
}

.ip-cell {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.4);
  padding: 4px 8px;
  border-radius: 6px;
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  height: 100%;
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: 24px;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Element Plus 覆盖样式 */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(99, 102, 241, 0.05); /* 悬停时淡淡的紫色 */
  --el-table-border-color: rgba(148, 163, 184, 0.1);
  --el-table-text-color: #e2e8f0;
  --el-table-header-bg-color: rgba(15, 23, 42, 0.6);
}

:deep(.el-table__header) {
  background: transparent;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(15, 23, 42, 0.6) !important;
  color: #94a3b8;
  font-weight: 600;
  height: 48px;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  background-color: rgba(15, 23, 42, 0.3);
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.2) inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6366f1 inset !important;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #94a3b8;
  --el-pagination-button-bg-color: rgba(15, 23, 42, 0.3);
  --el-pagination-hover-color: #6366f1;
}

:deep(.el-pagination button:disabled) {
  background-color: rgba(15, 23, 42, 0.1);
}

:deep(.el-pager li) {
  background-color: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

:deep(.el-pager li.is-active) {
  background-color: #6366f1;
  color: white;
  border-color: #6366f1;
}
</style>