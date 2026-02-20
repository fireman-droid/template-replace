import request, { getApiBaseUrl, getAuthHeaders } from '@/utils/request'

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
 * 流式 AI 解析（支持取消、超时、健壮的 SSE 解析）
 * @param {FormData} formData - 表单数据
 * @param {Function} onEvent - 事件回调函数
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] - 外部 AbortController 的 signal，用于取消请求
 * @param {number} [options.timeout] - 超时时间（毫秒），默认 180000（3 分钟）
 * @returns {Promise<{requestId: string|null, fieldCount: number, cancelled: boolean}>}
 */
export async function parseWithAIStream(formData, onEvent, options = {}) {
  const { signal: externalSignal, timeout = 180000 } = options

  // 合并外部 signal 与超时 signal
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort('AI 请求超时'), timeout)

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason)
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true })
    }
  }

  let requestId = null
  let fieldCount = 0
  let cancelled = false

  try {
    const response = await fetch(`${getApiBaseUrl()}/ai/parse-stream`, {
      method: 'POST',
      body: formData,
      headers: getAuthHeaders(),
      signal: controller.signal
    })

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new Error(`请求过于频繁，请 ${retryAfter || '稍后'} 秒后再试`)
    }

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' // 缓冲未完整的 SSE 行

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 按双换行分割 SSE 事件（标准 SSE 分隔符）
      const parts = buffer.split('\n')
      buffer = parts.pop() || '' // 最后一段可能不完整，保留

      for (const line of parts) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        try {
          const data = JSON.parse(trimmed.slice(6))
          if (data.requestId) requestId = data.requestId
          if (data.type === 'field') fieldCount++
          onEvent(data)
        } catch (e) {
          // 不完整的 JSON，跳过（下一个 chunk 会补全）
        }
      }
    }

    // 处理缓冲区中剩余的数据
    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6))
        if (data.requestId) requestId = data.requestId
        if (data.type === 'field') fieldCount++
        onEvent(data)
      } catch (e) {
        // 忽略
      }
    }
  } catch (err) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      cancelled = true
      onEvent({ type: 'error', message: '已取消 AI 填充' })
    } else {
      throw err
    }
  } finally {
    clearTimeout(timeoutId)
  }

  return { requestId, fieldCount, cancelled }
}