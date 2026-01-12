import request from '@/utils/request'

export function parseWithAI(formData) {
  return request({
    url: '/ai/parse',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000  // AI 请求需要更长时间，设置 120 秒
  })
}

/**
 * 流式 AI 解析
 * @param {FormData} formData - 表单数据
 * @param {Function} onEvent - 事件回调函数
 * @returns {Promise}
 */
export async function parseWithAIStream(formData, onEvent) {
  const authStore = (await import('@/stores/auth')).useAuthStore()
  const token = authStore.token

  const response = await fetch('/api/ai/parse-stream', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  // console.log(response)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // 解析 SSE 数据
    const text = decoder.decode(value)
    const lines = text.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))  // 去掉 "data: " 前缀
          onEvent(data)  // 调用回调函数
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}