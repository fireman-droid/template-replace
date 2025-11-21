<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 左侧装饰区域 -->
      <div class="login-banner">
        <div class="banner-content">
          <h1 class="banner-title">FastReplace</h1>
          <p class="banner-subtitle">智能模板填充系统</p>
          <div class="banner-features">
            <div class="feature-item">
              <span class="feature-icon">📝</span>
              <span>快速填充</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <span>AI 辅助</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📄</span>
              <span>多格式导出</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区域 -->
      <div class="login-form-wrapper">
        <div class="form-container">
          <div class="form-header">
            <h2>{{ isLogin ? '欢迎回来' : '创建账号' }}</h2>
            <p>{{ isLogin ? '登录以继续使用' : '注册新账号开始使用' }}</p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="邮箱地址"
                size="large"
                prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item v-if="!isLogin" prop="username">
              <el-input
                v-model="form.username"
                placeholder="用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item v-if="!isLogin" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="确认密码"
                size="large"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              @click="handleSubmit"
              :loading="loading"
              class="submit-btn"
            >
              {{ isLogin ? '登录' : '注册' }}
            </el-button>
          </el-form>

          <div class="test-accounts" v-if="isLogin">
            <el-divider>测试账号</el-divider>
            <div class="account-tips">
              <div class="tip-item">
                <el-tag type="danger" size="small">管理员</el-tag>
                <span>admin@test.com / admin123</span>
              </div>
              <div class="tip-item">
                <el-tag type="success" size="small">普通用户</el-tag>
                <span>user@test.com / user123</span>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <span class="footer-text">
              {{ isLogin ? '还没有账号？' : '已有账号？' }}
            </span>
            <el-button type="primary" link @click="toggleMode">
              {{ isLogin ? '立即注册' : '立即登录' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const formRef = ref(null)
    const isLogin = ref(true)
    const loading = ref(false)

    const form = reactive({
      email: 'user@test.com',
      username: '',
      password: 'user123',
      confirmPassword: ''
    })

    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    const rules = reactive({
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少需要 6 个字符', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ]
    })

    const toggleMode = () => {
      isLogin.value = !isLogin.value
      formRef.value?.resetFields()
    }

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        loading.value = true

        if (isLogin.value) {
          await authStore.login({
            email: form.email,
            password: form.password
          })
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          await authStore.register({
            username: form.username,
            email: form.email,
            password: form.password
          })
          ElMessage.success('注册成功，请登录')
          isLogin.value = true
          form.password = ''
          form.confirmPassword = ''
        }
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      rules,
      formRef,
      isLogin,
      loading,
      toggleMode,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  display: flex;
  width: 900px;
  min-height: 550px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 左侧装饰区域 */
.login-banner {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: white;
}

.banner-content {
  text-align: center;
}

.banner-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.banner-subtitle {
  font-size: 20px;
  margin: 0 0 50px 0;
  opacity: 0.9;
}

.banner-features {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 18px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.feature-icon {
  font-size: 28px;
}

/* 右侧表单区域 */
.login-form-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 50px;
}

.form-container {
  width: 100%;
  max-width: 380px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 32px;
  color: #333;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.test-accounts {
  margin: 20px 0;
}

.account-tips {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.form-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.footer-text {
  color: #666;
  font-size: 14px;
  margin-right: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    flex-direction: column;
    width: 100%;
    max-width: 450px;
  }

  .login-banner {
    padding: 40px 20px;
  }

  .banner-title {
    font-size: 36px;
  }

  .banner-subtitle {
    font-size: 16px;
    margin-bottom: 30px;
  }

  .login-form-wrapper {
    padding: 40px 30px;
  }
}
</style>
