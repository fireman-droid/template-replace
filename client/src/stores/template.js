/**
 * 单模板处理 Store
 * 专注于处理当前案卷的单个模板文件
 * 包括：加载、解析、预览、下载等操作
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { getCaseTemplateFile } from "@/api";
import JSZip from "jszip";
import { ElMessage } from "element-plus";
import { formatDateCN } from "@/utils/format";

export const useTemplateStore = defineStore("template", () => {
  // ==================== State ====================
  // 模板文件（Blob 对象）
  const templateFile = ref(null);

  // 模板信息（从案卷详情中获取）
  const templateInfo = ref(null);

  // 加载状态
  const loading = ref(false);

  // 错误信息
  const error = ref(null);

  // 文档生成进度 (0-100)，供 UI 绑定
  const generateProgress = ref(0);

  // ==================== Getters ====================

  // 用于操作word模版
  const NS = {
    // word命名空间
    w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    // 标记兼容性 - 处理不同版本的兼容性
    mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
    // wps的标记
    wpsCustomData: "http://www.wps.cn/officeDocument/2020/wpsCustomData",
  };

  // ==================== Actions ====================
  /**
   * 加载模板文件，用于预览
   * @param {number} caseId - 案卷 ID
   */
  async function loadFile(caseId) {
    loading.value = true;
    error.value = null;

    try {
      // 1. 调用 API 获取模板文件
      const response = await getCaseTemplateFile(caseId);

      // 2. 将响应转换为 Blob
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 3. 存储到 state
      templateFile.value = blob;

      return blob;
    } catch (err) {
      error.value = err.message || "加载模板文件失败";
      ElMessage.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 填充templateInfo，获取模版信息
   * @param {*} data
   * @returns
   */
  function setTemplateInfo(data) {
    if (!data) {
      templateInfo.value = null;
      markData.value = null;
      return;
    }
    templateInfo.value = data;
  }

  /**
   * 清空所有模板数据
   * 用于离开编辑器或切换案卷时重置状态
   */
  function clear() {
    templateFile.value = null;
    templateInfo.value = null;
    loading.value = false;
    error.value = null;
  }

  /**
   * 【核心】生成填充后的文档 Blob (用于预览和下载)
   * 通过 Web Worker 在后台线程执行，避免主线程卡顿
   * @param {Object} data - 表单数据对象
   * @param {Object} rowRepeatCountMap - 行重复计数 {markKey: count}
   */
  async function generateFilledBlob(data, rowRepeatCountMap = {}) {
    const markData = templateInfo.value.markData;
    if (!templateFile.value) {
      console.warn("⚠️ 无法生成预览：尚未加载模板文件");
      return null;
    }

    generateProgress.value = 0;

    // 将 Blob 转为 ArrayBuffer 以便传递给 Worker
    const templateBuffer = await templateFile.value.arrayBuffer();

    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('../workers/docxWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          generateProgress.value = msg.percent;
        } else if (msg.type === 'result') {
          generateProgress.value = 100;
          worker.terminate();
          resolve(msg.blob);
        } else if (msg.type === 'error') {
          worker.terminate();
          reject(new Error(msg.message));
        }
      };

      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(err.message || '文档生成 Worker 异常'));
      };

      worker.postMessage({
        type: 'generate',
        templateBuffer,
        formData: JSON.parse(JSON.stringify(data)),
        rowRepeatCountMap: { ...rowRepeatCountMap },
        markData: JSON.parse(JSON.stringify(markData))
      });
    });
  }

  /**
   * 根据 rowRepeatCountMap 复制/删除表格行
   * 左边标题单元格合并，右边内容行复制
   * @param {Document} doc - Word XML 文档
   * @param {Object} rowRepeatCountMap - {markKey: repeatCount}
   */
  function duplicateRowsByRepeatCount(doc, rowRepeatCountMap) {
    if (!rowRepeatCountMap || Object.keys(rowRepeatCountMap).length === 0) {
      return;
    }

    // 处理每个 markKey
    for (const [markKey, repeatCount] of Object.entries(rowRepeatCountMap)) {
      // 找到该 markKey 对应的第一个 docfieldStart
      const docfieldStarts = Array.from(
        doc.getElementsByTagName("wpsCustomData:docfieldStart")
      );

      let targetRow = null;
      for (const startNode of docfieldStarts) {
        const docfieldname = startNode.getAttribute("docfieldname");
        if (!docfieldname) continue;
        
        try {
          const parsed = JSON.parse(docfieldname);
          if (parsed.key === markKey) {
            // 找到该占位符所在的表格行 (w:tr)
            targetRow = findParentByNodeName(startNode, "w:tr");
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!targetRow || !targetRow.parentNode) continue;

      // 当 repeatCount 为 0 时，删除整行
      if (repeatCount <= 0) {
        targetRow.parentNode.removeChild(targetRow);
        continue;
      }
      
      // 当 repeatCount 为 1 时，不需要操作
      if (repeatCount <= 1) continue;

      // 获取行内的所有单元格
      const cells = targetRow.getElementsByTagName("w:tc");
      if (cells.length < 2) continue; // 至少需要两个单元格（标题+内容）

      const firstCell = cells[0]; // 左边标题单元格
      
      // 为第一行的左边单元格添加行合并开始标记
      addVMergeRestart(doc, firstCell, repeatCount);

      // 复制行 repeatCount - 1 次
      const parent = targetRow.parentNode;
      let lastInsertedRow = targetRow;
      
      for (let i = 1; i < repeatCount; i++) {
        const clonedRow = targetRow.cloneNode(true);
        
        // 获取克隆行的第一个单元格，清空内容并设置为合并继续
        const clonedCells = clonedRow.getElementsByTagName("w:tc");
        if (clonedCells.length > 0) {
          const clonedFirstCell = clonedCells[0];
          // 清空左边单元格的内容（保留格式）
          clearCellContent(clonedFirstCell);
          // 设置为合并继续
          addVMergeContinue(doc, clonedFirstCell);
        }
        
        // 更新克隆行中所有 docfieldStart 的 subindex
        const clonedStarts = clonedRow.getElementsByTagName("wpsCustomData:docfieldStart");
        Array.from(clonedStarts).forEach((node) => {
          node.setAttribute("subindex", String(i));
        });
        
        // 更新 ID
        const clonedEnds = clonedRow.getElementsByTagName("wpsCustomData:docfieldEnd");
        Array.from(clonedEnds).forEach((node) => {
          const oldId = node.getAttribute("id");
          if (oldId) {
            node.setAttribute("id", `${oldId}_${i}`);
          }
        });
        
        Array.from(clonedStarts).forEach((node) => {
          const oldId = node.getAttribute("id");
          if (oldId) {
            node.setAttribute("id", `${oldId}_${i}`);
          }
        });
        
        // 在上一行之后插入克隆行
        if (lastInsertedRow.nextSibling) {
          parent.insertBefore(clonedRow, lastInsertedRow.nextSibling);
        } else {
          parent.appendChild(clonedRow);
        }
        
        lastInsertedRow = clonedRow;
      }
    }
  }

  /**
   * 为单元格添加行合并开始标记
   */
  function addVMergeRestart(doc, cell, rowSpan) {
    let tcPr = cell.getElementsByTagName("w:tcPr")[0];
    if (!tcPr) {
      tcPr = doc.createElementNS(NS.w, "w:tcPr");
      cell.insertBefore(tcPr, cell.firstChild);
    }
    
    // 移除已有的 vMerge
    const existingVMerge = tcPr.getElementsByTagName("w:vMerge")[0];
    if (existingVMerge) {
      existingVMerge.remove();
    }
    
    // 添加 vMerge 开始
    const vMerge = doc.createElementNS(NS.w, "w:vMerge");
    vMerge.setAttributeNS(NS.w, "w:val", "restart");
    tcPr.appendChild(vMerge);
  }

  /**
   * 为单元格添加行合并继续标记
   */
  function addVMergeContinue(doc, cell) {
    let tcPr = cell.getElementsByTagName("w:tcPr")[0];
    if (!tcPr) {
      tcPr = doc.createElementNS(NS.w, "w:tcPr");
      cell.insertBefore(tcPr, cell.firstChild);
    }
    
    // 移除已有的 vMerge
    const existingVMerge = tcPr.getElementsByTagName("w:vMerge")[0];
    if (existingVMerge) {
      existingVMerge.remove();
    }
    
    // 添加 vMerge 继续（没有 val 属性表示继续合并）
    const vMerge = doc.createElementNS(NS.w, "w:vMerge");
    tcPr.appendChild(vMerge);
  }

  /**
   * 清空单元格内容（保留一个空段落）
   */
  function clearCellContent(cell) {
    // 保留 w:tcPr，删除其他内容
    const children = Array.from(cell.childNodes);
    children.forEach((child) => {
      if (child.nodeName !== "w:tcPr") {
        cell.removeChild(child);
      }
    });
    
    // 添加一个空段落（Word 单元格必须有至少一个段落）
    const doc = cell.ownerDocument;
    const p = doc.createElementNS(NS.w, "w:p");
    cell.appendChild(p);
  }

  // ==========================================
  // 逻辑函数 2: 替换字段 (Vue/Browser 版)
  // ==========================================
  function replaceDocFieldsInDocx(doc, fieldValues, markKeyMap) {
    // console.log('\n🚀 ========== 开始填充 Word 文档 ==========');
    let fillCount = 0;

    // 浏览器原生获取标签
    const docfieldStarts = Array.from(
      doc.getElementsByTagName("wpsCustomData:docfieldStart")
    );
    const docfieldEnds = Array.from(
      doc.getElementsByTagName("wpsCustomData:docfieldEnd")
    );

    // console.log('📍 找到占位符数量:', docfieldStarts.length);

    // 构建 End 节点映射
    const endMap = new Map();
    docfieldEnds.forEach((node) => {
      const id = node.getAttribute("id");
      if (id) endMap.set(id, node);
    });

    docfieldStarts.forEach((startNode, index) => {
      // 1. 解析 markKey
      const docfieldname = startNode.getAttribute("docfieldname");
      // { "key": "75665f78-9785-404e-9ede-2db6347a24f7" }

      // 用于多个相同字段
      const subindex = Number(startNode.getAttribute("subindex") || "0");
      if (!docfieldname) return;

      let markKey = "";
      try {
        markKey = JSON.parse(docfieldname).key;
      } catch (e) {
        return;
      }

      // 2. 获取映射
      const mapping = markKeyMap.get(markKey);
      if (!mapping) return;

      // 3. 确定 UserData 中的 key
      const fieldKey =
        subindex === 0 ? mapping.fieldKey : `${mapping.fieldKey}_${subindex}`;
      
      // 4. 检查是否有数据
      if (!(fieldKey in fieldValues)) {
        // 没数据，删除占位符
        const id = startNode.getAttribute("id");
        const endNode = endMap.get(id);
        removeNode(startNode);
        if (endNode) removeNode(endNode);
        return;
      }

      let value = fieldValues[fieldKey];

      // 扁平化嵌套数组
      if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
        value = value.map((item) => item[0]);
      }

      // 根据字段类型格式化值（跳过数组）
      if (mapping.fieldType && value !== true && !Array.isArray(value)) {
        value = formatValue(value, mapping.fieldType);
      }

      // 5. 处理选项 (Checkbox)
      if (mapping.optionValue) {
        const shouldCheck =
          value === mapping.optionValue ||
          (Array.isArray(value) && value.includes(mapping.optionValue))
        if (mapping.optionReplaceMode === "check") {
          if (shouldCheck) {
            value = true;
          }
          else {
            // 不选中的删掉
            const id = startNode.getAttribute("id");
            const endNode = endMap.get(id);
            removeNode(startNode);
            if (endNode) removeNode(endNode);
            return;
          }
        }
      }

      // 6. 查找容器 (AlternateContent)
      const altContent = findParentByNodeName(startNode, "mc:AlternateContent");
      if (!altContent) {
        return;
      }
      
      // 7. 创建新节点
      const fillNode = createFillNode(doc, value);
      
      // 8. 插入 DOM
      if (altContent.parentNode) {
        if (altContent.parentNode.nodeName === "w:tc") {
          // 表格内
          if (altContent.previousSibling) {
            altContent.previousSibling.appendChild(fillNode);
          } else {
            // 如果它是第一个节点，可能需要更复杂的处理，这里简化为追加到父级
            altContent.parentNode.appendChild(fillNode);
          }
        } else {
          // 普通段落，插入到 AlternateContent 前面
          altContent.parentNode.insertBefore(fillNode, altContent);
        }
        fillCount++;
      }

      // 9. 清理旧节点
      const id = startNode.getAttribute("id");
      const endNode = endMap.get(id);
      const endAltContent = findParentByNodeName(
        endNode,
        "mc:AlternateContent"
      );

      if (altContent && endAltContent) {
        removeContentBetween(altContent, endAltContent);
        // console.log(`🧹 [${index}] 清理旧节点完成`);
      }
    });

    // console.log(`\n🎉 填充完成！总共填充了 ${fillCount} 个字段`);
    return fillCount;
  }
  // ==========================================
  // 辅助工具函数
  // ==========================================

  // 创建节点
  function createFillNode(doc, value) {
    const run = doc.createElementNS(NS.w, "w:r");
    const rPr = doc.createElementNS(NS.w, "w:rPr");

    // 设置中文字体
    const rFonts = doc.createElementNS(NS.w, "w:rFonts");
    rFonts.setAttributeNS(NS.w, "w:eastAsia", "SimSun");
    rPr.appendChild(rFonts);
    run.appendChild(rPr);

    if (value === true) {
      // Checkbox 符号
      const sym = doc.createElementNS(NS.w, "w:sym");
      sym.setAttributeNS(NS.w, "w:font", "Wingdings 2");
      sym.setAttributeNS(NS.w, "w:char", "0052");
      run.appendChild(sym);
    } else {
      // 文本
      const t = doc.createElementNS(NS.w, "w:t");
      t.textContent = String(value);
      run.appendChild(t);
    }
    return run;
  }

  function findParentByNodeName(node, nodeName) {
    let current = node;
    while (current) {
      // 浏览器 DOM nodeName 可能是大写或保留原样，XML通常大小写敏感
      if (current.nodeName === nodeName) return current;
      current = current.parentNode;
    }
    return null;
  }

  // 删除不需要的节点
  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function removeContentBetween(startNode, endNode) {
    const parent = startNode.parentNode;
    if (!parent || endNode.parentNode !== parent) return;

    let current = startNode;
    while (current) {
      const next = current.nextSibling;
      removeNode(current);
      if (current === endNode) break;
      current = next;
    }
  }

  // 触发下载
  function saveFile(blob, filename) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * 根据字段类型格式化值
   * @param {any} value - 原始值
   * @param {string} fieldType - 字段类型（date, money, text 等）
   * @returns {string} 格式化后的值
   */
  function formatValue(value, fieldType) {
    if (value === null || value === undefined || value === "") return "";

    switch (fieldType) {
      case "date":
        // 日期格式：1980-05-20 → 1980年5月20日
        return formatDateCN(value);

      default:
        // 默认直接返回字符串
        return String(value);
    }
  }

  // 进行map构建
  const buildMarkKeyToFieldKeyMap = (mData) => {
    const map = new Map();
    if (!mData || !mData.data) return map;
    
    function traverse(node) {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item));
        return;
      }
      if (typeof node === "object") {
        // 处理 field
        if (node.type === "field" && node.data) {
          const { fieldKey, marks, type } = node.data;
          if (marks && Array.isArray(marks) && fieldKey) {
            marks.forEach((mark) => {
              if (mark.markKey) {
                const info = { fieldKey };
                if (type) {
                  info.fieldType = type;
                }
                if (mark.markProps?.optionValue) {
                  info.optionValue = mark.markProps.optionValue;
                  info.optionReplaceMode = mark.markProps.optionReplaceMode;
                }
                map.set(mark.markKey, info);
              }
            });
          }
        }
        // 处理 inline-fields
        else if (node.type === "inline-fields" && node.data?.fields) {
          node.data.fields.forEach((field) => {
            if (field.fieldKey && field.marks) {
              field.marks.forEach((mark) => {
                if (mark.markKey) {
                  const info = { fieldKey: field.fieldKey };
                  if (field.type) {
                    info.fieldType = field.type;
                  }
                  if (mark.markProps?.optionValue) {
                    info.optionValue = mark.markProps.optionValue;
                    info.optionReplaceMode = mark.markProps.optionReplaceMode;
                  }
                  map.set(mark.markKey, info);
                }
              });
            }
          });
        }
        Object.values(node).forEach((value) => traverse(value));
      }
    }
    traverse(mData);
    return map;
  };

  /**
   * 下载填充后的文档
   * @param {Object} formData - 表单数据
   * @param {Object} rowRepeatCountMap - 行重复计数
   * @param {string} filename - 文件名（可选）
   */
  async function download(formData, rowRepeatCountMap = {}, filename) {
    try {
      // 1. 生成填充后的 Blob
      const blob = await generateFilledBlob(formData, rowRepeatCountMap);

      if (!blob) {
        ElMessage.error("生成文档失败");
        return;
      }

      // 2. 生成文件名
      const defaultName = `${
        templateInfo.value?.name || "文档"
      }_${Date.now()}.docx`;
      const finalName = filename || defaultName;

      // 3. 触发下载
      saveFile(blob, finalName);

      ElMessage.success("下载成功");
    } catch (error) {
      console.error("下载失败:", error);
      ElMessage.error("下载失败");
    }
  }

  return {
    // // State
    templateFile,
    templateInfo,
    loading,
    error,

    // Getters
    generateProgress,

    // Actions
    clear,
    saveFile,
    loadFile,
    setTemplateInfo,
    generateFilledBlob,
    download,
  };
});
