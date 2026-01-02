import request from '@/utils/request'

export function parseWithAI(formData) {
  return request({
    url: '/ai/parse',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000  // AI 请求需要更长时间，设置 60 秒
  })
}
