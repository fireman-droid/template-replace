import { defineStore } from 'pinia'
import axios from 'axios'

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false
  }),
  
  actions: {
    async testConnection() {
      try {
        this.loading = true
        const response = await axios.get('/api/test')
        return response.data.message
      } catch (error) {
        return '连接失败: ' + error.message
      } finally {
        this.loading = false
      }
    }
  }
})
