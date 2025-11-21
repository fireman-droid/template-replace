<template>
  <div class="panel-box">
    <div class="panel-header">
      <h3>用户管理</h3>
      <el-input
        v-model="keyword"
        placeholder="搜索用户名或邮箱"
        style="width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table
      :data="userList"
      v-loading="loading"
      style="width: 100%"
      class="cyber-table"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="email" label="邮箱" width="220" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.role === 'admin'" type="danger">管理员</el-tag>
          <el-tag v-else type="success">普通用户</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button
            size="small"
            @click="handleRoleChange(row)"
            :disabled="row.id === currentUserId"
          >
            切换角色
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
            :disabled="row.id === currentUserId"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="pagination.total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      layout="total, prev, pager, next"
      @current-change="fetchUsers"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const userList = ref([])
const loading = ref(false)
const keyword = ref('')
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/admin/users', {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        keyword: keyword.value
      }
    })
    userList.value = response.data.list
    pagination.value.total = response.data.total
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

// 切换角色
const handleRoleChange = async (user) => {
  try {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    await ElMessageBox.confirm(
      `确定要将 ${user.username} 的角色切换为 ${newRole === 'admin' ? '管理员' : '普通用户'} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await axios.put(`/api/admin/users/${user.id}/role`, { role: newRole })
    ElMessage.success('角色切换成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '角色切换失败')
    }
  }
}

// 删除用户
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个用户吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })

    await axios.delete(`/api/admin/users/${id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.1);

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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.cyber-table) {
  background: transparent !important;
  
  .el-table__header-wrapper {
    background: rgba(255,255,255,0.05);
    th { background: transparent !important; color: $text-main !important; border-bottom: 1px solid $border !important; }
  }
  
  .el-table__body-wrapper {
    tr { background: transparent !important; &:hover > td { background: rgba(255,255,255,0.05) !important; } }
    td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; color: $text-sub !important; }
  }
}

:deep(.el-input__wrapper) {
  background-color: rgba(255,255,255,0.05) !important;
  box-shadow: none !important;
  border: 1px solid $border !important;
  .el-input__inner { color: white !important; }
}

:deep(.el-pagination) {
  .el-pager li { background: rgba(255,255,255,0.05); color: $text-sub; border: 1px solid $border; &.is-active { background: $primary; color: white; } }
  button { background: rgba(255,255,255,0.05); color: $text-sub; border: 1px solid $border; }
}

// 修复 Element Plus 组件的白色背景
:deep(.el-table) {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-row-hover-bg-color: rgba(255,255,255,0.05) !important;
}

:deep(.el-button) {
  --el-button-bg-color: rgba(255,255,255,0.05);
  --el-button-border-color: $border;
  --el-button-text-color: $text-sub;
  --el-button-hover-bg-color: rgba(255,255,255,0.1);
  --el-button-hover-border-color: $primary;
  --el-button-hover-text-color: white;
}

:deep(.el-message-box) {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 1px solid $border !important;
  .el-message-box__title, .el-message-box__message { color: white !important; }
}
</style>
