/**
 * 单模板处理 Store
 * 专注于处理当前案卷的单个模板文件
 * 包括：加载、解析、预览、下载等操作
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { getCaseTemplateFile } from "@/api";
import JSZip from "jszip";
import { saveAs } from "file-saver"; // 引入文件保存库
import { formatDateCN, formatMoney } from "@/utils/format"; // 引入格式化函数
// import testData from "@/utils/test.json"; // 引入测试数据
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
   * @param {Object} data - 表单数据对象
   */
  async function generateFilledBlob(data) {
    const markData = templateInfo.value.markData;
    // 如果没有加载模板文件，直接返回 null
    if (!templateFile.value) {
      console.warn("⚠️ 无法生成预览：尚未加载模板文件");
      return null;
    }
    // 2. 构建映射 (核心步骤)
    const markKeyMap = buildMarkKeyToFieldKeyMap(markData);

    // 3. 解析 document.xml
    const zip = await JSZip.loadAsync(templateFile.value);
    const xmlContent = await zip.file("word/document.xml").async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, "text/xml");
    // console.log(doc);

    // 4.实现填充
    const fillCount = replaceDocFieldsInDocx(doc, data, markKeyMap);
    // console.log(fillCount);
    // 6. 序列化并重新打包
    const serializer = new XMLSerializer();
    const newXmlContent = serializer.serializeToString(doc);
    zip.file("word/document.xml", newXmlContent);

    // 7. 生成并下载
    const blob = await zip.generateAsync({ type: "blob" });
    return blob;
  }

  // ==========================================
  // 逻辑函数 2: 替换字段 (Vue/Browser 版)
  // ==========================================
  function replaceDocFieldsInDocx(doc, fieldValues, markKeyMap) {
    let fillCount = 0;

    // 浏览器原生获取标签
    const docfieldStarts = Array.from(
      doc.getElementsByTagName("wpsCustomData:docfieldStart")
    );
    const docfieldEnds = Array.from(
      doc.getElementsByTagName("wpsCustomData:docfieldEnd")
    );

    // 构建 End 节点映射
    const endMap = new Map();
    docfieldEnds.forEach((node) => {
      const id = node.getAttribute("id");
      if (id) endMap.set(id, node);
    });

    docfieldStarts.forEach((startNode) => {
      // 1. 解析 markKey
      const docfieldname = startNode.getAttribute("docfieldname");
      // docfieldname = '{"key":"plaintiff_name"}'
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

      // 🔥 4.5 根据字段类型格式化值
      if (mapping.fieldType && value !== true) {
        value = formatValue(value, mapping.fieldType);
      }

      // 5. 处理选项 (Checkbox)
      if (mapping.optionValue) {
        const shouldCheck =
          value === mapping.optionValue ||
          (Array.isArray(value) && value.includes(mapping.optionValue));
        if (mapping.optionReplaceMode === "check") {
          if (shouldCheck) value = true;
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
      if (!altContent) return;

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
      }
    });

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
          const { fieldKey, marks, fieldType } = node.data;
          if (marks && Array.isArray(marks) && fieldKey) {
            marks.forEach((mark) => {
              if (mark.markKey) {
                const info = { fieldKey };
                // 保存字段类型信息（用于格式化）
                if (fieldType) {
                  info.fieldType = fieldType;
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
                  // 保存字段类型信息
                  if (field.fieldType) {
                    info.fieldType = field.fieldType;
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
    // console.log(map);
    return map;
  };

  /**
   * 根据字段类型格式化值
   * @param {any} value - 原始值
   * @param {string} fieldType - 字段类型（date, money, text 等）
   * @returns {string} 格式化后的值
   */
  function formatValue(value, fieldType) {
    if (value === null || value === undefined || value === '') return '';
    
    switch (fieldType) {
      case 'date':
        // 日期格式：1980-05-20 → 1980年5月20日
        return formatDateCN(value);
      
      case 'money':
        // 金额格式：1234567 → ¥1,234,567.00
        return formatMoney(value);
      
      default:
        // 默认直接返回字符串
        return String(value);
    }
  }

  /**
   * 下载填充后的文档
   * @param {Object} formData - 表单数据
   * @param {string} filename - 文件名（可选）
   */
  async function download(formData, filename) {
    try {
      // 1. 生成填充后的 Blob
      const blob = await generateFilledBlob(
        formData,
        templateInfo.value?.markData
      );

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

    // Actions
    clear,
    saveFile,
    loadFile,
    setTemplateInfo,
    generateFilledBlob,
    download,
  };
});
