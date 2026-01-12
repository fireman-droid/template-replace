# 🚀 项目演进规划：商业化级智能生成系统

> **核心目标**: 从"前端实验性Demo"转型为"前后端分离的工业级产品"。
> **架构原则**: 前端负责交互与数据采集，后端负责核心计算与文档生成。

## 一、 核心架构重组 (Architecture Refactoring)

### 1.1 前后端职责重新划分（瘦前端，胖后端）
*   **当前痛点**: 前端承载了过重的 XML 解析与替换逻辑，导致无法处理复杂文档（如多页循环、PDF转换），且核心逻辑易被破解。
*   **重构方案**:
    *   **前端 (Client)**: 退化为纯粹的 **"数据采集器"**。只负责展示 AI 解析结果、提供动态表单让用户修改数据，最终将干净的 JSON 数据提交给服务器。
    *   **后端 (Server)**: 升级为 **"文档生成引擎"**。接收数据与模板 ID，在服务器端进行高保真的文档渲染与格式转换（转 PDF），返回最终文件流。

### 1.2 存储方案升级
*   模版文件不再存储于服务器本地磁盘，改为接入**云对象存储 (OSS)**。

---

## 二、 业务功能升级 (Business Features)

### 2.1 动态列表与复杂表单支持（难，可先完成其他的）
*   **需求**: 解决现有版本无法动态添加"多个被告"、"多条证据链"的问题。
*   **方案**:
    *   **前端**: 表单组件支持**数组 (Array)** 类型，用户可点击"+"号动态新增数据行。
    *   **后端**: 模版引擎需支持**循环语法 (Loop)**，根据传入数组的长度，自动复制表格行或段落，实现无限行的数据填充。

### 2.2 AI 智能增强
*   **Prompt 工程化**: 建立针对不同案由（如借贷、离婚）的专用提示词库，提升特定场景的字段提取准确率。
*   **流式响应 (Streaming)**: 改造 API 通信模式，实现 AI 解析过程中的**打字机效果**。用户不需要干等 30 秒，而是能看到表单字段被逐个填入，大幅提升体验。

### 2.3 权限与管理系统
*   **动态路由**: 根据用户角色（管理员/VIP/普通用户），后端动态下发菜单权限，前端只渲染其有权访问的页面。

---

## 三、 核心业务流程图解 (Core Workflows)

> 以下是项目三大核心功能的处理链路，开发时请严格遵循此时序。

### 3.1 动态表单生成流程 (Dynamic Form)

> **核心逻辑迁移说明**: 原本前端 `template.js` 中解析 `markData` 并构建 `categories` 的逻辑迁移至后端。

1.  **上传模版 (Frontend)**:
    *   管理员上传 Word 模版文件 (`.docx`)。
    *   前端仅做文件校验（格式、大小），然后 POST 给后端。

2.  **解析模版 (Backend)**:
    *   **解压**: 将 `.docx` 作为 Zip 解压，读取 `word/document.xml` 和 `customXml/` 目录。
    *   **提取占位符**: 遍历 XML，查找所有 `<wpsCustomData:docfieldStart>` 标签。
    *   **读取元数据**: 从 `docfieldname` 属性解析 JSON，提取 `key` 作为 `markKey`。
    *   **读取字段信息**: 从 `customXml/itemN.xml` 中解析 `markData`，它包含：
        *   `fieldKey`: 字段唯一标识 (如 `plaintiff_name`)。
        *   `fieldLabel`: 字段显示名称 (如 "原告姓名")。
        *   `fieldType`: 字段类型 (`text` / `date` / `number` / `options`)。
        *   `options`: 如果是选项类型，包含可选值列表及 `isMultiple` 多选标识。
        *   `categoryTitle` / `subCategoryTitle`: 字段所属的大分类/子分类标题。
    *   **构建 JSON Schema**: 将上述信息组装为层级结构：
        ```json
        {
          "categories": [
            {
              "title": "原告信息",
              "subCategories": [
                {
                  "title": "基本信息",
                  "fields": [
                    { "fieldKey": "plaintiff_name", "fieldLabel": "姓名", "type": "text" },
                    { "fieldKey": "plaintiff_birth", "fieldLabel": "出生日期", "type": "date" }
                  ]
                }
              ]
            }
          ]
        }
        ```
    *   **存储**: 将 Schema 存入数据库，与模版 ID 关联。Word 原文件存入 OSS。

3.  **获取表单 (Frontend)**:
    *   前端请求 `GET /api/template/:id/schema`。
    *   后端返回上述 JSON Schema。
    *   前端 `DynamicForm.vue` 组件根据 Schema 动态渲染 `el-collapse`、`el-input`、`el-date-picker`、`el-checkbox-group` 等组件。

---

### 3.2 AI 智能填充流程 (AI Parsing)

> **核心逻辑说明**: 基于现有 `server/routes/ai.js` 中的 Function Calling 模式，进行工程化升级。

1.  **输入 (Frontend)**:
    *   用户粘贴案情文本，或上传案卷文件 (PDF/Word/TXT)。
    *   前端将文本内容 + 当前表单的完整 `fieldList` (包含 `fieldKey` 和 `fieldLabel`) 一并 POST 给后端。

2.  **文件解析 (Backend)**:

3.  **构建 AI Tool Schema (Backend)**:
    *   根据 `fieldList` 动态生成 `fillTable` 工具定义：
        ```json
        {
          "type": "function",
          "function": {
            "name": "fillTable",
            "parameters": {
              "properties": {
                "plaintiff_name": { "type": "string", "description": "原告姓名" },
                "defendant_name": { "type": "string", "description": "被告姓名" }
              }
            }
          }
        }
        ```
    *   AI 的 `description` 字段非常重要，它决定了提取的准确性。

4.  **调用大模型 (Backend)**:
    *   组装 System Prompt (包含法律专业指南、日期/金额格式规范、身份识别规则)。
    *   将用户文本作为 User Message。
    *   强制 AI 调用 `fillTable` 工具 (`tool_choice: { function: { name: "fillTable" } }`)。
    *   解析 AI 返回的 `tool_calls[0].function.arguments` JSON。

5.  **回填 (Frontend)**:
    *   后端返回 AI 提取结果 `{ "plaintiff_name": "张三", "defendant_name": "李四" }`。
    *   前端遍历结果，自动 `formData[key] = value` 回填到表单中。
    *   **流式增强 (可选)**: 使用 SSE，后端每解析出一个字段就推送一次，前端实时更新，产生"打字机"动画效果。

### 3.3 文档生成与下载流程 (Document Generation)

> **核心逻辑迁移说明**: 原本前端 `template.js` 中的 `replaceDocFieldsInDocx` 函数逻辑完全迁移至后端。

1.  **提交 (Frontend)**: 
    *   用户在界面上确认表单各项信息无误。
    *   点击“生成文档”，前端将 `templateId` 和 `formData` (JSON对象) POST 给后端。
    *   `axios` 请求必须设置 `responseType: 'blob'`。
    
2.  **处理 (Backend)**:
    *   **加载**: 根据 `templateId` 从 OSS 或本地读取 `.docx` 文件流，解压后获取 `word/document.xml`。
    *   **匹配占位符**: 
        *   遍历 XML，查找所有 `<wpsCustomData:docfieldStart>` 和 `<wpsCustomData:docfieldEnd>` 标签对。
        *   读取 `docfieldStart` 节点的 `docfieldname` 属性，它是一个 JSON 字符串，格式如：`{"key": "uuid-xxxx"}`
        （提取单个document.xml中的一个例子）
        。<w:p w14:paraId="45B0D373">
            <w:pPr>
              <w:pStyle w:val="11"/>
              <w:keepNext w:val="0"/>
              <w:keepLines w:val="0"/>
              <w:pageBreakBefore w:val="0"/>
              <w:widowControl w:val="0"/>
              <w:kinsoku/>
              <w:wordWrap/>
              <w:overflowPunct/>
              <w:topLinePunct w:val="0"/>
              <w:autoSpaceDE w:val="0"/>
              <w:autoSpaceDN w:val="0"/>
              <w:bidi w:val="0"/>
              <w:adjustRightInd w:val="0"/>
              <w:snapToGrid w:val="0"/>
              <w:spacing w:before="0" w:line="360" w:lineRule="exact"/>
              <w:ind w:left="0" w:right="0"/>
              <w:textAlignment w:val="auto"/>
              <w:rPr>
                <w:rFonts w:hint="eastAsia" w:asciiTheme="minorEastAsia" w:hAnsiTheme="minorEastAsia" w:eastAsiaTheme="minorEastAsia" w:cstheme="minorEastAsia"/>
                <w:color w:val="231F20"/>
                <w:sz w:val="21"/>
              </w:rPr>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:hint="eastAsia" w:asciiTheme="minorEastAsia" w:hAnsiTheme="minorEastAsia" w:eastAsiaTheme="minorEastAsia" w:cstheme="minorEastAsia"/>
                <w:color w:val="231F20"/>
                <w:sz w:val="21"/>
              </w:rPr>
              <w:t>
                姓名：
              </w:t>
            </w:r>
            <mc:AlternateContent>
              <mc:Choice Requires="wpsCustomData">
                <wpsCustomData:docfieldStart id="1" docfieldname="{"key":"c69e4698-3d91-41f3-a8af-0a91492d36f1"}" hidden="0" print="1" readonly="0" index="1"/>
              </mc:Choice>
            </mc:AlternateContent>
            <w:r>
              <w:rPr>
                <w:rFonts w:hint="eastAsia" w:asciiTheme="minorEastAsia" w:hAnsiTheme="minorEastAsia" w:eastAsiaTheme="minorEastAsia" w:cstheme="minorEastAsia"/>
                <w:color w:val="231F20"/>
                <w:sz w:val="21"/>
              </w:rPr>
              <w:t xml:space="preserve">
              </w:t>
            </w:r>
          </w:p>
        *   通过markData和前端传来的FormData对应所在位置，修改document.xml
            markData请查看文件夹文件
            FromData:
            {
              "1": "打撒发斯蒂芬",
              "3": "2025-12-31",
              "4": "阿斯顿发斯蒂芬"
            }
            markData中fieldKey和这里的"1"的键名对应，同时markData的markKey与document.xml中的docfieldname的key对应,因此可以找到字段填充的位置
    *   **置换**: 
        *   **文本/日期/数字**: 根据 `fieldType` 调用 `formatValue` 格式化数据，然后查找 `docfieldStart` 所在的 `<mc:AlternateContent>` 容器，在其前方插入新的 `<w:r><w:t>值</w:t></w:r>` 文本节点。
        *   **选项 (Options)**: 
            *   判断 `optionValue` 是否与用户填写的值匹配（支持数组多选）。
            *   如果匹配 (`shouldCheck = true`)，保留该选项节点。
            *   如果不匹配，**直接删除**该 `docfieldStart/End` 及其整个 `<mc:AlternateContent>` 容器（实现 "不选中的项整段消失" 效果）。
        *   **表格循环 (New)**: 如果数据是数组，定位到该占位符所在的表格行 (`<w:tr>`)，复制该行 N 次并分别填入数组各项数据。
        *   **特殊字符转义**: 用户输入中的 `<`, `>`, `&` 需转义为 `&lt;`, `&gt;`, `&amp;`，避免 XML 解析错误。
    *   **清理**: 
        *   所有成功填充的 `<mc:AlternateContent>` 容器本身需要移除（只保留新插入的文本）。
        *   未匹配到数据的占位符标签对也需删除，避免最终文档中残留乱码。

3.  **输出 (Backend)**: 
    *   将处理完的 XML 重新打包为 `.docx` (Zip压缩)。
    *   设置响应头 `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`。
    *   可以通过流 (Stream) 的形式直接管道传输给 Response，无需在大文件生成时占用过多内存。

4.  **下载 (Frontend)**:
    *   接收 Blob 数据，创建 `<a>` 标签模拟点击下载。
