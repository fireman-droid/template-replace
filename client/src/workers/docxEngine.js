/**
 * Docx 处理引擎（纯函数，无 Vue/Pinia 依赖）
 * 可在主线程或 Web Worker 中运行
 */
import JSZip from 'jszip'
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  wpsCustomData: 'http://www.wps.cn/officeDocument/2020/wpsCustomData',
}

// ==================== 日期格式化（内联，避免依赖 Vue 工具） ====================

function formatDateCN(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${year}年${month}月${day}日`
}

// ==================== markKey 映射构建 ====================

export function buildMarkKeyToFieldKeyMap(mData) {
  const map = new Map()
  if (!mData || !mData.data) return map

  function traverse(node) {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach((item) => traverse(item))
      return
    }
    if (typeof node === 'object') {
      if (node.type === 'field' && node.data) {
        const { fieldKey, marks, type } = node.data
        if (marks && Array.isArray(marks) && fieldKey) {
          marks.forEach((mark) => {
            if (mark.markKey) {
              const info = { fieldKey }
              if (type) info.fieldType = type
              if (mark.markProps?.optionValue) {
                info.optionValue = mark.markProps.optionValue
                info.optionReplaceMode = mark.markProps.optionReplaceMode
              }
              map.set(mark.markKey, info)
            }
          })
        }
      } else if (node.type === 'inline-fields' && node.data?.fields) {
        node.data.fields.forEach((field) => {
          if (field.fieldKey && field.marks) {
            field.marks.forEach((mark) => {
              if (mark.markKey) {
                const info = { fieldKey: field.fieldKey }
                if (field.type) info.fieldType = field.type
                if (mark.markProps?.optionValue) {
                  info.optionValue = mark.markProps.optionValue
                  info.optionReplaceMode = mark.markProps.optionReplaceMode
                }
                map.set(mark.markKey, info)
              }
            })
          }
        })
      }
      Object.values(node).forEach((value) => traverse(value))
    }
  }
  traverse(mData)
  return map
}

// ==================== DOM 辅助函数 ====================

function findParentByNodeName(node, nodeName) {
  let current = node
  while (current) {
    if (current.nodeName === nodeName) return current
    current = current.parentNode
  }
  return null
}

function removeNode(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node)
}

function removeContentBetween(startNode, endNode) {
  const parent = startNode.parentNode
  if (!parent || endNode.parentNode !== parent) return
  let current = startNode
  while (current) {
    const next = current.nextSibling
    removeNode(current)
    if (current === endNode) break
    current = next
  }
}

function createFillNode(doc, value) {
  const run = doc.createElementNS(NS.w, 'w:r')
  const rPr = doc.createElementNS(NS.w, 'w:rPr')
  const rFonts = doc.createElementNS(NS.w, 'w:rFonts')
  rFonts.setAttributeNS(NS.w, 'w:eastAsia', 'SimSun')
  rPr.appendChild(rFonts)
  run.appendChild(rPr)

  if (value === true) {
    const sym = doc.createElementNS(NS.w, 'w:sym')
    sym.setAttributeNS(NS.w, 'w:font', 'Wingdings 2')
    sym.setAttributeNS(NS.w, 'w:char', '0052')
    run.appendChild(sym)
  } else {
    const t = doc.createElementNS(NS.w, 'w:t')
    t.textContent = String(value)
    run.appendChild(t)
  }
  return run
}

function formatValue(value, fieldType) {
  if (value === null || value === undefined || value === '') return ''
  switch (fieldType) {
    case 'date':
      return formatDateCN(value)
    default:
      return String(value)
  }
}

// ==================== 行复制逻辑 ====================

function addVMergeRestart(doc, cell) {
  let tcPr = cell.getElementsByTagName('w:tcPr')[0]
  if (!tcPr) {
    tcPr = doc.createElementNS(NS.w, 'w:tcPr')
    cell.insertBefore(tcPr, cell.firstChild)
  }
  const existingVMerge = tcPr.getElementsByTagName('w:vMerge')[0]
  if (existingVMerge) existingVMerge.remove()
  const vMerge = doc.createElementNS(NS.w, 'w:vMerge')
  vMerge.setAttributeNS(NS.w, 'w:val', 'restart')
  tcPr.appendChild(vMerge)
}

function addVMergeContinue(doc, cell) {
  let tcPr = cell.getElementsByTagName('w:tcPr')[0]
  if (!tcPr) {
    tcPr = doc.createElementNS(NS.w, 'w:tcPr')
    cell.insertBefore(tcPr, cell.firstChild)
  }
  const existingVMerge = tcPr.getElementsByTagName('w:vMerge')[0]
  if (existingVMerge) existingVMerge.remove()
  const vMerge = doc.createElementNS(NS.w, 'w:vMerge')
  tcPr.appendChild(vMerge)
}

function clearCellContent(cell) {
  const children = Array.from(cell.childNodes)
  children.forEach((child) => {
    if (child.nodeName !== 'w:tcPr') cell.removeChild(child)
  })
  const doc = cell.ownerDocument
  const p = doc.createElementNS(NS.w, 'w:p')
  cell.appendChild(p)
}

function duplicateRowsByRepeatCount(doc, rowRepeatCountMap) {
  if (!rowRepeatCountMap || Object.keys(rowRepeatCountMap).length === 0) return

  for (const [markKey, repeatCount] of Object.entries(rowRepeatCountMap)) {
    const docfieldStarts = Array.from(
      doc.getElementsByTagName('wpsCustomData:docfieldStart')
    )
    let targetRow = null
    for (const startNode of docfieldStarts) {
      const docfieldname = startNode.getAttribute('docfieldname')
      if (!docfieldname) continue
      try {
        const parsed = JSON.parse(docfieldname)
        if (parsed.key === markKey) {
          targetRow = findParentByNodeName(startNode, 'w:tr')
          break
        }
      } catch (e) { continue }
    }

    if (!targetRow || !targetRow.parentNode) continue
    if (repeatCount <= 0) { targetRow.parentNode.removeChild(targetRow); continue }
    if (repeatCount <= 1) continue

    const cells = targetRow.getElementsByTagName('w:tc')
    if (cells.length < 2) continue

    addVMergeRestart(doc, cells[0], repeatCount)

    const parent = targetRow.parentNode
    let lastInsertedRow = targetRow

    for (let i = 1; i < repeatCount; i++) {
      const clonedRow = targetRow.cloneNode(true)
      const clonedCells = clonedRow.getElementsByTagName('w:tc')
      if (clonedCells.length > 0) {
        clearCellContent(clonedCells[0])
        addVMergeContinue(doc, clonedCells[0])
      }
      const clonedStarts = clonedRow.getElementsByTagName('wpsCustomData:docfieldStart')
      Array.from(clonedStarts).forEach((node) => {
        node.setAttribute('subindex', String(i))
        const oldId = node.getAttribute('id')
        if (oldId) node.setAttribute('id', `${oldId}_${i}`)
      })
      const clonedEnds = clonedRow.getElementsByTagName('wpsCustomData:docfieldEnd')
      Array.from(clonedEnds).forEach((node) => {
        const oldId = node.getAttribute('id')
        if (oldId) node.setAttribute('id', `${oldId}_${i}`)
      })
      if (lastInsertedRow.nextSibling) {
        parent.insertBefore(clonedRow, lastInsertedRow.nextSibling)
      } else {
        parent.appendChild(clonedRow)
      }
      lastInsertedRow = clonedRow
    }
  }
}

// ==================== 字段替换 ====================

function replaceDocFieldsInDocx(doc, fieldValues, markKeyMap) {
  let fillCount = 0
  const docfieldStarts = Array.from(
    doc.getElementsByTagName('wpsCustomData:docfieldStart')
  )
  const docfieldEnds = Array.from(
    doc.getElementsByTagName('wpsCustomData:docfieldEnd')
  )
  const endMap = new Map()
  docfieldEnds.forEach((node) => {
    const id = node.getAttribute('id')
    if (id) endMap.set(id, node)
  })

  docfieldStarts.forEach((startNode) => {
    const docfieldname = startNode.getAttribute('docfieldname')
    const subindex = Number(startNode.getAttribute('subindex') || '0')
    if (!docfieldname) return

    let markKey = ''
    try { markKey = JSON.parse(docfieldname).key } catch (e) { return }

    const mapping = markKeyMap.get(markKey)
    if (!mapping) return

    const fieldKey = subindex === 0 ? mapping.fieldKey : `${mapping.fieldKey}_${subindex}`

    if (!(fieldKey in fieldValues)) {
      const id = startNode.getAttribute('id')
      const endNode = endMap.get(id)
      removeNode(startNode)
      if (endNode) removeNode(endNode)
      return
    }

    let value = fieldValues[fieldKey]
    if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
      value = value.map((item) => item[0])
    }
    if (mapping.fieldType && value !== true && !Array.isArray(value)) {
      value = formatValue(value, mapping.fieldType)
    }

    if (mapping.optionValue) {
      const shouldCheck =
        value === mapping.optionValue ||
        (Array.isArray(value) && value.includes(mapping.optionValue))
      if (mapping.optionReplaceMode === 'check') {
        if (shouldCheck) {
          value = true
        } else {
          const id = startNode.getAttribute('id')
          const endNode = endMap.get(id)
          removeNode(startNode)
          if (endNode) removeNode(endNode)
          return
        }
      }
    }

    const altContent = findParentByNodeName(startNode, 'mc:AlternateContent')
    if (!altContent) return

    const fillNode = createFillNode(doc, value)
    if (altContent.parentNode) {
      if (altContent.parentNode.nodeName === 'w:tc') {
        if (altContent.previousSibling) {
          altContent.previousSibling.appendChild(fillNode)
        } else {
          altContent.parentNode.appendChild(fillNode)
        }
      } else {
        altContent.parentNode.insertBefore(fillNode, altContent)
      }
      fillCount++
    }

    const id = startNode.getAttribute('id')
    const endNode = endMap.get(id)
    const endAltContent = findParentByNodeName(endNode, 'mc:AlternateContent')
    if (altContent && endAltContent) {
      removeContentBetween(altContent, endAltContent)
    }
  })

  return fillCount
}

// ==================== 主入口：生成填充后的 Blob ====================

/**
 * 生成填充后的 docx Blob
 * @param {ArrayBuffer} templateBuffer - 模板文件 ArrayBuffer
 * @param {Object} formData - 表单数据
 * @param {Object} rowRepeatCountMap - 行重复计数
 * @param {Object} markData - 模板的 markData 配置
 * @param {Function} [onProgress] - 进度回调 (stage, percent)
 * @returns {Promise<Blob>}
 */
export async function generateFilledDocx(
  templateBuffer,
  formData,
  rowRepeatCountMap,
  markData,
  onProgress
) {
  const report = onProgress || (() => {})

  // 1. 构建映射
  report('mapping', 10)
  const markKeyMap = buildMarkKeyToFieldKeyMap(markData)

  // 2. 解压 ZIP
  report('unzip', 20)
  const zip = await JSZip.loadAsync(templateBuffer)

  // 3. 解析 document.xml
  report('parse', 35)
  const xmlContent = await zip.file('word/document.xml').async('string')
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlContent, 'text/xml')

  // 4. 行复制
  report('duplicate', 50)
  duplicateRowsByRepeatCount(doc, rowRepeatCountMap)

  // 5. 字段替换
  report('replace', 65)
  const fillCount = replaceDocFieldsInDocx(doc, formData, markKeyMap)

  // 6. 序列化
  report('serialize', 80)
  const serializer = new XMLSerializer()
  const newXmlContent = serializer.serializeToString(doc)
  zip.file('word/document.xml', newXmlContent)

  // 7. 重新打包
  report('zip', 90)
  const blob = await zip.generateAsync({ type: 'blob' })

  report('done', 100)
  return { blob, fillCount }
}
