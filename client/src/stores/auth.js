/**
 * 认证状态管理
 * 管理用户登录状态、token 和用户信息
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { register as registerApi, login as loginApi, getCurrentUser } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const username = computed(() => user.value?.username || '')

  // Actions
  /**
   * 用户注册
   * @param {Object} userData - 注册数据
   */
  async function register(userData) {
    const data = await registerApi(userData)
    return data
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   */
  async function login(credentials) {
    const data = await loginApi(credentials)
    const { token: newToken, user: newUser } = data

    // 保存 token 和用户信息
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    return data
  }

  /**
   * 用户登出
   */
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUser() {
    const data = await getCurrentUser()
    user.value = data.user
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  /**
   * 初始化认证状态
   * 在应用启动时调用，恢复登录状态
   */
  function initAuth() {
    // token 会在 request.js 的拦截器中自动添加
  }

  return {
    // State
    token,
    user,
    // Getters
    isAuthenticated,
    isAdmin,
    username,
    // Actions
    register,
    login,
    logout,
    fetchUser,
    initAuth
  }
})
