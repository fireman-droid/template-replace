/**
 * 认证状态管理
 * 管理用户登录状态、token 和用户信息
 */
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    // 是否已登录
    isAuthenticated: (state) => !!state.token,
    
    // 是否是管理员
    isAdmin: (state) => state.user?.role === 'admin',
    
    // 获取用户名
    username: (state) => state.user?.username || ''
  },

  actions: {
    /**
     * 用户注册
     * @param {Object} userData - 注册数据
     */
    async register(userData) {
      try {
        const response = await axios.post('/api/auth/register', userData)
        return response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || '注册失败')
      }
    },

    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证
     */
    async login(credentials) {
      try {
        const response = await axios.post('/api/auth/login', credentials)
        const { token, user } = response.data

        // 保存 token 和用户信息
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        // 设置 axios 默认 header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

        return response.data
      } catch (error) {
        throw new Error(error.response?.data?.message || '登录失败')
      }
    },

    /**
     * 用户登出
     */
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
    },

    /**
     * 获取当前用户信息
     */
    async fetchUser() {
      try {
        const response = await axios.get('/api/auth/me')
        this.user = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return response.data.user
      } catch (error) {
        // token 失效，清除登录状态
        this.logout()
        throw new Error('获取用户信息失败')
      }
    },

    /**
     * 初始化认证状态
     * 在应用启动时调用，恢复登录状态
     */
    initAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      }
    }
  }
})
