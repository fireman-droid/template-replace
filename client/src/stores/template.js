/**
 * 单模板处理 Store
 * 专注于处理当前案卷的单个模板文件
 * 包括：加载、解析、预览、下载等操作
 */
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getCaseTemplateFile } from "@/api";
import PizZip from "pizzip"; // 引入解压库
import { saveAs } from "file-saver"; // 引入文件保存库
import testData from "@/utils/test.json"; // 引入测试数据
export const useTemplateStore = defineStore("template", () => {
  // ==================== State ====================
  // 模板文件（Blob 对象）
  const templateFile = ref(null);

  // 模板信息（从案卷详情中获取）
  const templateInfo = ref(null);

  // 解析后的 XML 内容（如果需要编辑模板）
  const parsedXml = ref(null);

  // 模板中的占位符列表
  const placeholders = ref([]);

  // 加载状态
  const loading = ref(false);

  // 错误信息
  const error = ref(null);

  // zip 对象（用于操作 docx 文件）
  const zip = ref(null);

  // ==================== Getters ====================

  // 是否已加载模板文件
  const hasFile = computed(() => !!templateFile.value);

  // 是否有模板信息
  const hasInfo = computed(() => !!templateInfo.value);

  // 是否已解析
  const isParsed = computed(() => !!parsedXml.value);

  // 模板文件大小（格式化）
  const fileSize = computed(() => {
    if (!templateFile.value) return "0 KB";
    const bytes = templateFile.value.size;
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  });

  // 占位符数量
  const placeholderCount = computed(() => placeholders.value.length);

  // ==================== Actions ====================

  /**
   * 加载模板文件
   * @param {number} caseId - 案卷 ID
   * @returns {Promise<Blob>} 模板文件 Blob
   */
  async function loadFile(caseId) {
    try {
      loading.value = true;
      error.value = null;

      const blob = await getCaseTemplateFile(caseId);
      // console.log(blob)
      templateFile.value = blob;

      console.log("模板文件加载成功:", fileSize.value);
      return blob;
    } catch (err) {
      error.value = err.message || "加载模板文件失败";
      console.error("加载模板文件失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 设置模板信息
   * @param {Object} info - 模板信息（从案卷详情中获取）
   */
  function setInfo(info) {
    templateInfo.value = info;
    console.log("模板信息已设置:", info?.name);
  }

  /**
   * 解析模板文件（提取 XML 内容）
   * 用于需要编辑模板内容的场景
   * @returns {Promise<string>} XML 内容
   */
  async function parseXml() {
    if (!templateFile.value) {
      throw new Error("没有可解析的模板文件");
    }

    try {
      loading.value = true;

      // 1. 将 Blob 转为 ArrayBuffer
      const arrayBuffer = await templateFile.value.arrayBuffer();

      // 2. 使用 PizZip 加载 ArrayBuffer
      zip.value = new PizZip(arrayBuffer);

      // 3. 获取 word/document.xml 文件
      const documentXml = zip.value.file("word/document.xml");

      if (!documentXml) {
        throw new Error("无效的 Word 文档：找不到 document.xml");
      }

      // 4. 读取 XML 内容
      parsedXml.value = documentXml.asText();

      console.log("模板 XML 解析成功，长度:", parsedXml.value);
      return parsedXml.value;
    } catch (err) {
      error.value = "解析模板失败";
      console.error("解析模板失败:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取文件的 ArrayBuffer
   * 用于某些库需要 ArrayBuffer 格式的场景
   * @returns {Promise<ArrayBuffer>}
   */
  async function getArrayBuffer() {
    if (!templateFile.value) {
      throw new Error("没有可用的模板文件");
    }

    return await templateFile.value.arrayBuffer();
  }

  /**
   * 获取文件的 Base64 编码
   * 用于需要传输或存储的场景
   * @returns {Promise<string>}
   */
  async function getBase64() {
    if (!templateFile.value) {
      throw new Error("没有可用的模板文件");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(templateFile.value);
    });
  }

  /**
   * 兼容性节点查找函数
   * @param {Element} parent - 父节点
   * @param {string} tagName - 要查找的标签名（不含命名空间前缀）
   * @returns {HTMLCollection} 找到的节点列表
   * 功能：在 Word XML 中查找节点，兼容带命名空间和不带命名空间的情况
   */
  const getNodes = (parent, tagName) => {
    // 先尝试查找带 w: 命名空间的标签
    let list = parent.getElementsByTagName("w:" + tagName);
    // 如果没找到，尝试不带命名空间的标签
    if (list.length === 0) list = parent.getElementsByTagName(tagName);
    return list;
  };

  /**
   * 下载填充的文件
   * @param {string} filename - 文件名（可选）
   */
  const download = async () => {
    try {
      // 如果还没有解析 XML，先解析
      if (!parsedXml.value) {
        await parseXml();
      }

      // 使用导入的测试数据
      const data = testData;

      // 2. 提取 word/document.xml（Word 文档的主要内容）
      const docXml = parsedXml.value;
      
      if (!docXml) {
        throw new Error("无法获取模板 XML 内容");
      }

      // 3. 解析 XML 文档
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXml, "application/xml");
      // 4. 查找所有内容控件（sdt = Structured Document Tag）
      const sdts = getNodes(xmlDoc, "sdt");
      // 如果没有找到控件，说明模板格式不对
      if (sdts.length === 0) {
        console.warn("未找到任何内容控件");
        return;
      }

      // 5. 遍历所有控件，填充数据
      let count = 0;
      for (let i = 0; i < sdts.length; i++) {
        const sdt = sdts[i];

        // 获取控件的标签（tag），标签的 w:val 属性存储了字段名
        const tagNode = getNodes(sdt, "tag")[0];
        if (!tagNode) continue;

        // 获取字段名（如 "p_name", "p_phone" 等）
        const key = tagNode.getAttribute("w:val");
        if (data[key] === undefined) continue; // 如果 JSON 中没有这个字段，跳过

        count++;
        const val = data[key];

        // 获取控件的内容区域
        const content = getNodes(sdt, "sdtContent")[0];
        if (content) {
          // 获取所有文本节点（t = text）
          const tNodes = getNodes(content, "t");
          if (tNodes.length > 0) {
            // 根据数据类型填充内容
            if (typeof val === "boolean") {
              // 布尔值：true 显示 ■（选中），false 显示 □（未选中）
              tNodes[0].textContent = val ? "■" : "□";
            } else {
              // 其他类型：转为字符串填充
              tNodes[0].textContent = String(val);
            }
            // 清空其他多余的文本节点
            for (let j = 1; j < tNodes.length; j++) {
              tNodes[j].textContent = "";
            }
          }
        }
      }

      // 6. 将修改后的 XML 序列化回字符串
      const serializer = new XMLSerializer();
      const newXml = serializer.serializeToString(xmlDoc);

      // 7. 替换 zip 中的 document.xml
      zip.value.file("word/document.xml", newXml);

      // 8. 生成新的 docx 文件（Blob 格式）
      const blob = zip.value.generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      // 9. 触发浏览器下载
      saveAs(blob, '生成的模版.docx');

      console.log(`✅ 成功！已填充 ${count} 个字段`);
    } catch (e) {
      console.error("生成出错:", e);
      alert("生成出错: " + e.message);
    }
  };

  /**
   * 清空所有模板数据
   */
  function clear() {
    templateFile.value = null;
    templateInfo.value = null;
    parsedXml.value = null;
    placeholders.value = [];
    error.value = null;
    console.log("模板数据已清空");
  }

  /**
   * 重新加载模板
   * @param {number} caseId - 案卷 ID
   */
  async function reload(caseId) {
    clear();
    await loadFile(caseId);
  }

  return {
    // State
    templateFile,
    templateInfo,
    parsedXml,
    placeholders,
    loading,
    error,

    // Getters
    hasFile,
    hasInfo,
    isParsed,
    fileSize,
    placeholderCount,

    // Actions
    loadFile,
    setInfo,
    parseXml,
    download,
    getArrayBuffer,
    getBase64,
    clear,
    reload,
    getNodes,
  };
});
