/**
 * Docx 生成 Web Worker
 * 将 CPU 密集的 docx 解析/填充/打包操作移出主线程
 *
 * 消息协议：
 *   主线程 -> Worker: { type: 'generate', templateBuffer, formData, rowRepeatCountMap, markData }
 *   Worker -> 主线程: { type: 'progress', stage, percent }
 *   Worker -> 主线程: { type: 'result', blob, fillCount }
 *   Worker -> 主线程: { type: 'error', message }
 */
import { generateFilledDocx } from './docxEngine.js'

self.onmessage = async (e) => {
  const { type, templateBuffer, formData, rowRepeatCountMap, markData } = e.data

  if (type !== 'generate') return

  try {
    const { blob, fillCount } = await generateFilledDocx(
      templateBuffer,
      formData,
      rowRepeatCountMap,
      markData,
      (stage, percent) => {
        self.postMessage({ type: 'progress', stage, percent })
      }
    )

    self.postMessage({ type: 'result', blob, fillCount })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || '文档生成失败' })
  }
}
