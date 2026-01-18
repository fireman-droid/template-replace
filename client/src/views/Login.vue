<template>
  <div class="login-wrapper">
    <div class="tech-bg">
      <div class="grid-overlay"></div>
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
    </div>

    <div class="login-box glass-panel">
      <div class="side-brand">
        <div class="brand-content">
          <div class="logo-circle">
            <el-icon><Lightning /></el-icon>
          </div>
          <h2>FastReplace</h2>
          <p class="slogan">下一代智能合同填充平台</p>
          <ul class="features">
            <li><el-icon><Check /></el-icon> AI 语义识别</li>
            <li><el-icon><Check /></el-icon> 毫秒级渲染</li>
            <li><el-icon><Check /></el-icon> 银行级加密</li>
          </ul>
        </div>
        <svg class="waves" viewBox="0 24 150 28" preserveAspectRatio="none">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g class="parallax">
            <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.1" />
            <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.05)" />
          </g>
        </svg>
      </div>

      <div class="form-side">
        <transition name="fade-slide" mode="out-in">
          <div v-if="isLogin" key="login" class="form-container">
            <div class="header">
              <h3>欢迎回来</h3>
              <p>登录您的账户以继续</p>
            </div>
            
            <el-form ref="loginFormRef" :model="form" :rules="rules" class="custom-form">
              <el-form-item prop="email">
                <div class="input-group">
                  <el-icon><Message /></el-icon>
                  <input v-model="form.email" placeholder="邮箱地址" />
                </div>
              </el-form-item>
              <el-form-item prop="password">
                <div class="input-group">
                  <el-icon><Lock /></el-icon>
                  <input v-model="form.password" type="password" placeholder="密码" />
                </div>
              </el-form-item>
              
              <button type="button" class="submit-btn" @click="handleLogin" :disabled="loading">
                <span v-if="!loading">登 录</span>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </button>
            </el-form>
            
            <div class="footer">
              还没有账号？ <a @click="toggleMode">立即注册</a>
            </div>
          </div>

          <div v-else key="register" class="form-container">
            <div class="header">
              <h3>创建账户</h3>
              <p>开始您的智能文档之旅</p>
            </div>
            
            <el-form ref="registerFormRef" :model="form" :rules="rules" class="custom-form">
              <el-form-item prop="username">
                <div class="input-group">
                  <el-icon><User /></el-icon>
                  <input v-model="form.username" placeholder="用户名" />
                </div>
              </el-form-item>
              <el-form-item prop="email">
                <div class="input-group">
                  <el-icon><Message /></el-icon>
                  <input v-model="form.email" placeholder="邮箱地址" />
                </div>
              </el-form-item>
              <el-form-item prop="password">
                <div class="input-group">
                  <el-icon><Lock /></el-icon>
                  <input v-model="form.password" type="password" placeholder="设置密码" />
                </div>
              </el-form-item>
              
              <button type="button" class="submit-btn" @click="handleRegister" :disabled="loading">
                <span v-if="!loading">注 册</span>
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </button>
            </el-form>
            
            <div class="footer">
              已有账号？ <a @click="toggleMode">直接登录</a>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Message, Lock, User, Lightning, Check, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const isLogin = ref(true)
const loading = ref(false)
const loginFormRef = ref(null)
const registerFormRef = ref(null)

const form = reactive({
  email: 'admin@test.com',
  username: '',
  password: 'admin123'
})

const rules = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  form.password = '' // 清空密码
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.login({ email: form.email, password: form.password })
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.register({ username: form.username, email: form.email, password: form.password })
        ElMessage.success('注册成功')
        isLogin.value = true
      } catch (error) {
        ElMessage.error(error.message)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
$primary: #6366f1;
$secondary: #8b5cf6;
$dark-bg: #0f172a;
$glass-bg: rgba(255, 255, 255, 0.95);
$text-color: #334155;

.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $dark-bg;
  position: relative;
  overflow: hidden;
}

// 科技背景
.tech-bg {
  position: absolute;
  inset: 0;
  
  .grid-overlay {
    position: absolute;
    width: 200%;
    height: 200%;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
    animation: grid-move 20s linear infinite;
  }

  .shape {
    position: absolute;
    filter: blur(80px);
    opacity: 0.4;
  }
  .shape-1 {
    top: -10%;
    left: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, $primary, transparent 70%);
  }
  .shape-2 {
    bottom: -10%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, $secondary, transparent 70%);
  }
}

@keyframes grid-move {
  0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
  100% { transform: perspective(500px) rotateX(60deg) translateY(40px) translateZ(-200px); }
}

// 登录盒子
.login-box {
  display: flex;
  width: 900px;
  height: 550px;
  background: $glass-bg;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  z-index: 10;
  position: relative;
  
  .side-brand {
    flex: 1;
    background: linear-gradient(135deg, $primary, $secondary);
    padding: 40px;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
    
    .brand-content {
      z-index: 2;
      
      .logo-circle {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin-bottom: 24px;
        backdrop-filter: blur(5px);
      }
      
      h2 {
        font-size: 32px;
        margin: 0 0 8px;
      }
      
      .slogan {
        opacity: 0.8;
        font-size: 16px;
        margin-bottom: 40px;
      }
      
      .features {
        list-style: none;
        padding: 0;
        
        li {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 14px;
          opacity: 0.9;
          
          .el-icon {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px;
            border-radius: 50%;
          }
        }
      }
    }
    
    .waves {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100px;
      z-index: 1;
    }
  }
  
  .form-side {
    flex: 1.2;
    background: white;
    padding: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .form-container {
      width: 100%;
      max-width: 320px;
      
      .header {
        margin-bottom: 32px;
        text-align: center;
        
        h3 {
          font-size: 24px;
          color: $text-color;
          margin: 0 0 8px;
        }
        p {
          color: #94a3b8;
          font-size: 14px;
        }
      }
      
      .custom-form {
        .input-group {
          width:100%;
          display: flex;
          align-items: center;
          background: #f1f5f9;
          padding: 12px 16px;
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.3s;
          
          .el-icon {
            color: #94a3b8;
            font-size: 18px;
            margin-right: 12px;
          }
          
          input {
            border: none;
            background: transparent;
            outline: none;
            width: 100%;
            color: $text-color;
            font-size: 15px;
            
            &::placeholder { color: #cbd5e1; }
          }
          
          &:focus-within {
            background: white;
            border-color: $primary;
            box-shadow: 0 4px 12px rgba($primary, 0.1);
            
            .el-icon { color: $primary; }
          }
        }
        
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: $text-color;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          transition: all 0.3s;
          display: flex;
          justify-content: center;
          align-items: center;
          
          &:hover {
            background: black;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
          
          &:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .is-loading { animation: rotate 1s linear infinite; }
        }
      }
      
      .footer {
        text-align: center;
        margin-top: 24px;
        font-size: 14px;
        color: #64748b;
        
        a {
          color: $primary;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          
          &:hover { text-decoration: underline; }
        }
      }
    }
  }
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

// 过渡动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>