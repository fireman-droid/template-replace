/**
 * Axios 请求封装
 * 统一处理请求拦截器和响应拦截器
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 根据环境配置 baseURL
// 开发环境：使用 /api，通过 vite proxy 代理到本地后端
// 生产环境：直接连接远程后端服务
const baseURL = import.meta.env.PROD 
  ? 'http://8.148.251.30:8883/api'  // 生产环境后端地址
  : '/api'                           // 开发环境使用代理

// 创建 axios 实例
const request = axios.create({
  baseURL,
  timeout: 120000 
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 自动添加 token
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    if (error.response) { 
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 清除登录状态
          const authStore = useAuthStore()
          authStore.logout()
          // 跳转到登录页
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default request
