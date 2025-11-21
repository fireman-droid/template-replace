<template>
  <div class="home">
    <el-container>
      <el-header>
        <div class="header-content">
          <h1>FastReplace - 模板填充系统</h1>
          <div class="user-info">
            <el-tag v-if="authStore.isAdmin" type="danger">管理员</el-tag>
            <el-tag v-else type="success">普通用户</el-tag>
            <span style="margin: 0 10px">{{ authStore.username }}</span>
            <el-button size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <el-card>
          <template #header>
            <span>欢迎使用模板填充系统</span>
          </template>
          <el-space direction="vertical" style="width: 100%">
            <el-alert
              title="系统功能"
              type="info"
              :closable="false"
            >
              <p>✅ 用户认证系统已完成</p>
              <p>🔄 模板管理功能开发中...</p>
            </el-alert>
            
            <el-button type="primary" @click="testApi">测试后端连接</el-button>
            <el-button type="success" @click="testDatabase">测试数据库连接</el-button>
            <el-alert v-if="message" :title="message" :type="alertType" show-icon />
          </el-space>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import axios from 'axios'

export default {
  name: 'Home',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()
    const message = ref('')
    const alertType = ref('success')

    const testApi = async () => {
      const result = await appStore.testConnection()
      message.value = result
      alertType.value = 'success'
    }

    const testDatabase = async () => {
      try {
        const response = await axios.get('/api/db/test')
        if (response.data.success) {
          message.value = response.data.message
          alertType.value = 'success'
        } else {
          message.value = response.data.message
          alertType.value = 'error'
        }
      } catch (error) {
        message.value = '数据库连接失败: ' + error.message
        alertType.value = 'error'
      }
    }

    const handleLogout = () => {
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }

    return {
      authStore,
      message,
      alertType,
      testApi,
      testDatabase,
      handleLogout
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f5f5;
}

.el-header {
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
}

.user-info {
  display: flex;
  align-items: center;
}

.el-main {
  padding: 40px;
}
</style>
