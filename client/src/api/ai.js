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
