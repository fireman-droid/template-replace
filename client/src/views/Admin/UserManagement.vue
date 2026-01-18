<template>
  <div class="panel-box">
    <div class="panel-header">
      <h3>用户管理</h3>
      <div class="search-box">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名或邮箱..."
          clearable
          @input="handleSearch"
          class="cyber-input"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <el-table
      :data="userList"
      v-loading="loading"
      style="width: 100%"
      class="cyber-table"
    >
      <el-table-column prop="id" label="ID" width="100" align="center" />

      <el-table-column
        prop="username"
        label="用户名"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span class="username-text">{{ row.username }}</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="email"
        label="邮箱"
        min-width="220"
        show-overflow-tooltip
      />

      <el-table-column prop="role" label="角色" width="140" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.role === 'admin' ? 'danger' : 'primary'"
            effect="dark"
            size="small"
            round
          >
            {{ row.role === "admin" ? "管理员" : "普通用户" }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="created_at"
        label="注册时间"
        width="200"
        align="center"
      >
        <template #default="{ row }">
          <span class="time-text">{{ formatDate(row.created_at) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleRoleChange(row)"
              :disabled="row.id === currentUserId"
            >
              {{ row.role === "admin" ? "降级" : "提权" }}
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
              :disabled="row.id === currentUserId"
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next, total"
        @current-change="fetchUsers"
        background
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import { getUserList, updateUserRole, deleteUser } from "@/api";

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id);

const userList = ref([]);
const loading = ref(false);
const keyword = ref("");
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true;
    const data = await getUserList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      keyword: keyword.value
    });
    userList.value = data.list;
    pagination.value.total = data.total;
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.page = 1;
  fetchUsers();
};

const handleRoleChange = async (user) => {
  try {
    const newRole = user.role === "admin" ? "user" : "admin";
    await ElMessageBox.confirm(
      `确定要将 ${user.username} 的角色切换为 ${
        newRole === "admin" ? "管理员" : "普通用户"
      } 吗？`,
      "权限变更",
      {
        confirmButtonText: "确定切换",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "cyber-message-box",
      }
    );
    await updateUserRole(user.id, newRole);
    ElMessage.success("角色切换成功");
    fetchUsers();
  } catch (error) {
    if (error !== "cancel") ElMessage.error("操作取消");
  }
};

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个用户吗？此操作不可恢复！",
      "危险操作",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "error",
        customClass: "cyber-message-box",
      }
    );
    await deleteUser(id);
    ElMessage.success("删除成功");
    fetchUsers();
  } catch (error) {
    if (error !== "cancel") ElMessage.error("操作取消");
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  fetchUsers();
});
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255, 255, 255, 0.1);
$danger: #ef4444;

.panel-box {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid $border;
  border-radius: 16px;
  padding: 24px;
  min-height: 600px;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      margin: 0;
      font-size: 18px;
      border-left: 4px solid $accent;
      padding-left: 12px;
      color: $text-main;
      font-weight: 600;
    }

    .search-box {
      width: 300px;
    }
  }
}

// --- 搜索框样式 ---
:deep(.cyber-input) {
  .el-input__wrapper {
    background-color: rgba(0, 0, 0, 0.2) !important;
    box-shadow: 0 0 0 1px $border inset !important;
    border-radius: 8px;
    padding: 4px 12px;
    transition: all 0.3s;

    &.is-focus {
      box-shadow: 0 0 0 1px $primary inset !important;
      background-color: rgba($primary, 0.05) !important;
    }

    .el-input__inner {
      color: $text-main;
      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
    }

    .search-icon {
      color: $text-sub;
    }
  }
}

// --- 表格样式核心 ---
:deep(.cyber-table) {
  // 重置 Element 变量
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  --el-table-header-text-color: #{$text-main};
  --el-table-text-color: #{$text-sub};
  --el-table-border-color: #{$border};
  --el-table-row-hover-bg-color: rgba(59, 130, 246, 0.08);
  --el-mask-color: rgba(15, 23, 42, 0.7); // 修复 Loading 遮罩颜色

  background-color: transparent !important;

  // 修复 Loading 时的白色背景
  .el-loading-mask {
    background-color: rgba(15, 23, 42, 0.5) !important;
    backdrop-filter: blur(4px);
    .el-loading-spinner {
      .path {
        stroke: $primary;
      }
      .el-loading-text {
        color: $primary;
      }
    }
  }

  // 移除表格底部的白线
  .el-table__inner-wrapper::before {
    display: none;
  }

  // 表头样式
  th.el-table__cell {
    background-color: rgba(255, 255, 255, 0.03) !important;
    border-bottom: 1px solid $border !important;
    font-weight: 600;
    height: 50px;
  }

  // 单元格样式
  td.el-table__cell {
    border-bottom: 1px solid $border !important;
    height: 60px;
  }

  // 文本高亮
  .username-text {
    color: white;
    font-weight: 500;
  }
  .time-text {
    font-family: monospace;
    color: darken($text-sub, 10%);
  }

  // 操作按钮容器
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

// --- 分页器样式 ---
.pagination-wrapper {
  margin-top: auto;
  padding-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #{$text-sub};
  --el-pagination-button-disabled-bg-color: transparent;
  --el-pagination-hover-color: #{$primary};

  .btn-prev,
  .btn-next,
  .el-pager li {
    background: transparent !important;
    border: 1px solid $border;
    color: $text-sub;
    min-width: 32px;
    height: 32px;
    border-radius: 6px;
    font-weight: 500;

    &:hover:not(:disabled) {
      border-color: $primary;
      color: $primary;
    }

    &.is-active {
      background-color: $primary !important;
      border-color: $primary;
      color: white;
    }
  }

  .el-pagination__total {
    color: $text-sub;
  }
}
</style>

<style lang="scss">
.cyber-message-box {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;

  .el-message-box__title {
    color: white !important;
  }
  .el-message-box__message {
    color: #94a3b8 !important;
  }
  .el-message-box__btns button {
    border-radius: 6px;
    &.el-button--primary {
      background: #3b82f6;
      border-color: #3b82f6;
    }
    &:not(.el-button--primary) {
      background: transparent;
      border: 1px solid #475569;
      color: #cbd5e1;
      &:hover {
        border-color: white;
        color: white;
      }
    }
  }
}
</style>
