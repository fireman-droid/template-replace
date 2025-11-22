/**
 * 认证状态管理
 * 管理用户登录状态、token 和用户信息
 */
import { defineStore } from 'pinia'
import { register as registerApi, login as loginApi, getCurrentUser } from '@/api'

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
      const data = await registerApi(userData)
      return data
    },

    /**
     * 用户登录
     * @param {Object} credentials - 登录凭证
     */
    async login(credentials) {
      const data = await loginApi(credentials)
      const { token, user } = data

      // 保存 token 和用户信息
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      return data
    },

    /**
     * 用户登出
     */
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    /**
     * 获取当前用户信息
     */
    async fetchUser() {
      const data = await getCurrentUser()
      this.user = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      return data.user
    },

    /**
     * 初始化认证状态
     * 在应用启动时调用，恢复登录状态
     */
    initAuth() {
      // token 会在 request.js 的拦截器中自动添加
    }
  }
})
