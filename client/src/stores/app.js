import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)

  // Actions
  async function testConnection() {
    try {
      loading.value = true
      const response = await axios.get('/api/test')
      return response.data.message
    } catch (error) {
      return '连接失败: ' + error.message
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    loading,
    // Actions
    testConnection
  }
})
