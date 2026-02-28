# 项目文件说明（FastReplace）

这份文件用于帮助 AI 或新同事快速理解项目结构与每个文件的用途，避免重复全量阅读源码浪费 token。

范围说明：仅覆盖 `template-replace` 目录下的文件；`node_modules` 和 `client/dist` 等构建产物不在清单内。`server/uploads` 与 `server/uploads/temp` 为运行时文件，通常可清理或重新生成。

建议阅读顺序（快速把握主流程）：
1. `README.md`：项目概览、技术栈、启动方式。
2. `server/index.js` + `server/routes/ai.js`：后端入口与 AI 流式解析核心。
3. `client/src/stores/template.js` + `client/src/workers/docxEngine.js`：Word 填充与 Web Worker。
4. `client/src/components/DynamicForm.vue`：markData 驱动的动态表单渲染。
5. `client/src/components/project/ProjectForm.vue`：AI 填充前端交互主流程。

**项目根目录**
| 路径 | 作用 |
| --- | --- |
| `.dockerignore` | Docker 构建忽略清单，减少镜像体积。 |
| `.gitignore` | Git 忽略规则（依赖、构建产物、环境变量等）。 |
| `.npmrc` | pnpm/npm 配置（如 `shamefully-hoist` 等）。 |
| `docker-compose.yml` | 一键部署编排：MySQL + Server + Nginx。 |
| `HIGHLIGHTS.md` | 项目亮点与简历/介绍材料。 |
| `init-db.bat` | Windows 初始化数据库脚本（含固定 root 密码）。 |
| `markData.json` | 大型示例 markData（Word 表格 → 表单结构映射）。 |
| `package.json` | 根工作区脚本与工具依赖（concurrently）。 |
| `pnpm-lock.yaml` | pnpm 锁定文件。 |
| `pnpm-workspace.yaml` | pnpm 工作区配置（client + server）。 |
| `README.md` | 主文档：功能、技术栈、启动说明。 |
| `_inspect2.js` | 本地脚本：对比 docx 与 markData 中的 UUID/书签。 |
| `_inspect3.js` | 本地脚本：解析 docx `docfieldname` 属性内容。 |
| `_inspect_docx.js` | 本地脚本：检查 docx 内部结构与 UUID。 |

**.kiro 需求文档**
| 路径 | 作用 |
| --- | --- |
| `.kiro/specs/template-fill/requirements.md` | 模板填充系统的需求文档。 |
| `.kiro/specs/vue3-express-fullstack/requirements.md` | 预留需求文档（当前为空）。 |

**.vscode**
| 路径 | 作用 |
| --- | --- |
| `.vscode/settings.json` | VSCode 项目设置（当前为空）。 |

**前端：client 根目录**
| 路径 | 作用 |
| --- | --- |
| `client/Dockerfile` | 前端多阶段构建 + Nginx 静态托管。 |
| `client/index.html` | Vite 入口 HTML。 |
| `client/jsconfig.json` | JS/TS 路径别名与编译器选项。 |
| `client/nginx.conf` | Nginx 反代配置（API、SSE、WebSocket）。 |
| `client/package.json` | 前端依赖与脚本（Vite、Vue、Element Plus 等）。 |
| `client/vite.config.js` | Vite 配置（alias、proxy、端口等）。 |

**前端：client/src 根文件**
| 路径 | 作用 |
| --- | --- |
| `client/src/App.vue` | 根组件，渲染 `router-view` 与聊天挂件。 |
| `client/src/main.js` | 应用入口：安装 Pinia、Router、Element Plus、错误追踪。 |
| `client/src/tem.json` | 旧版/实验性模板字段配置示例（非当前核心流程）。 |

**前端：API 层**
| 路径 | 作用 |
| --- | --- |
| `client/src/api/index.js` | API 聚合导出。 |
| `client/src/api/auth.js` | 认证接口封装（注册/登录/当前用户）。 |
| `client/src/api/admin.js` | 管理端接口封装（用户/模板/日志/统计/聊天）。 |
| `client/src/api/cases.js` | 案卷相关接口封装（增删改查/模板/文件）。 |
| `client/src/api/ai.js` | AI 解析接口封装（普通 + SSE 流式）。 |

**前端：组件**
| 路径 | 作用 |
| --- | --- |
| `client/src/components/BaseChart.vue` | ECharts 通用封装组件。 |
| `client/src/components/chatWidget.vue` | 前台悬浮聊天窗口（socket.io）。 |
| `client/src/components/DynamicForm.vue` | 核心：markData → 动态表单渲染与多人员处理。 |
| `client/src/components/TemplatePreview.vue` | 管理端模板详情预览弹窗内容。 |
| `client/src/components/project/ProjectForm.vue` | 案卷编辑表单 + AI 填充流程入口。 |
| `client/src/components/project/ProjectPreview.vue` | 文档预览面板（docx-preview 渲染）。 |

**前端：配置与路由**
| 路径 | 作用 |
| --- | --- |
| `client/src/config/echarts.config.js` | ECharts 统一主题与工具函数配置。 |
| `client/src/router/index.js` | 路由配置与权限守卫。 |

**前端：状态管理（Pinia）**
| 路径 | 作用 |
| --- | --- |
| `client/src/stores/app.js` | 简单全局状态（连通性测试）。 |
| `client/src/stores/auth.js` | 登录态与用户信息管理。 |
| `client/src/stores/editor.js` | 案卷编辑器状态（草稿、表单、保存）。 |
| `client/src/stores/template.js` | 模板加载、填充、下载与 Worker 调度。 |
| `client/src/stores/index.js` | Store 统一导出。 |

**前端：工具库**
| 路径 | 作用 |
| --- | --- |
| `client/src/utils/README.md` | 工具函数库使用说明。 |
| `client/src/utils/index.js` | 工具函数统一导出入口。 |
| `client/src/utils/request.js` | axios 请求封装 + 统一 baseURL 与 token。 |
| `client/src/utils/common.js` | 通用工具函数集合。 |
| `client/src/utils/format.js` | 格式化工具（日期、金额、号码等）。 |
| `client/src/utils/validate.js` | 常用校验（邮箱、手机号、身份证等）。 |
| `client/src/utils/storage.js` | localStorage/sessionStorage 封装。 |
| `client/src/utils/debounce.js` | 防抖工具。 |
| `client/src/utils/throttle.js` | 节流工具。 |
| `client/src/utils/tracker.js` | 前端埋点与错误追踪工具。 |
| `client/src/utils/markDataParser.js` | 统计 markData 中的标记数量。 |
| `client/src/utils/markData.json` | 示例 markData（与根目录 `markData.json` 基本一致）。 |
| `client/src/utils/userData.json` | 示例表单填充值（用于测试/对照）。 |

**前端：页面**
| 路径 | 作用 |
| --- | --- |
| `client/src/views/Home.vue` | 登录后首页与案卷列表。 |
| `client/src/views/Login.vue` | 登录/注册页面。 |
| `client/src/views/SelectTemplate.vue` | 选择模板入口页。 |
| `client/src/views/ProjectEdit.vue` | 案卷编辑器主页面。 |
| `client/src/views/ChartDemo.vue` | ECharts 示例演示页。 |

**前端：管理端页面**
| 路径 | 作用 |
| --- | --- |
| `client/src/views/Admin/Admin.vue` | 管理端布局与导航框架。 |
| `client/src/views/Admin/Dashboard.vue` | 管理端仪表盘与统计图表。 |
| `client/src/views/Admin/UserManagement.vue` | 用户管理列表与角色操作。 |
| `client/src/views/Admin/TemplateManagement.vue` | 模板管理（上传/编辑/预览/删除）。 |
| `client/src/views/Admin/SystemLogs.vue` | 系统日志筛选与列表。 |
| `client/src/views/Admin/chatSupport.vue` | 管理端在线客服聊天面板。 |

**前端：Web Worker**
| 路径 | 作用 |
| --- | --- |
| `client/src/workers/docxEngine.js` | docx 解析/填充/打包纯函数引擎。 |
| `client/src/workers/docxWorker.js` | Web Worker 入口，封装进度回调。 |

**后端：server 根目录**
| 路径 | 作用 |
| --- | --- |
| `server/.env` | 本地环境变量（包含密钥，勿提交）。 |
| `server/.env.example` | 环境变量模板。 |
| `server/Dockerfile` | 后端 Docker 构建文件。 |
| `server/index.js` | 后端入口：Express、路由、SSE、Socket.IO。 |
| `server/init.sql` | 初始建库建表与示例数据。 |
| `server/init_logs_table.sql` | 系统日志表初始化脚本。 |
| `server/migrate-fields.sql` | 模板字段迁移脚本（旧字段合并为 mark_data）。 |
| `server/package.json` | 后端依赖与启动脚本。 |

**后端：配置**
| 路径 | 作用 |
| --- | --- |
| `server/config/db.js` | MySQL 连接池 + Prisma Client。 |
| `server/config/upload.js` | 上传配置（multer，限制 docx）。 |

**后端：中间件**
| 路径 | 作用 |
| --- | --- |
| `server/middleware/auth.js` | JWT 认证与管理员权限控制。 |
| `server/middleware/errorLogger.js` | 请求日志、错误处理、404 处理。 |
| `server/middleware/rateLimiter.js` | 内存滑动窗口限流。 |

**后端：数据模型**
| 路径 | 作用 |
| --- | --- |
| `server/models/User.js` | 用户表 CRUD 与密码校验。 |
| `server/models/Template.js` | 模板表 CRUD 与 mark_data 解析。 |
| `server/models/Case.js` | 案卷表 CRUD。 |
| `server/models/SystemLog.js` | 系统日志记录与查询。 |

**后端：Prisma**
| 路径 | 作用 |
| --- | --- |
| `server/prisma/schema.prisma` | Prisma 数据模型定义。 |

**后端：路由**
| 路径 | 作用 |
| --- | --- |
| `server/routes/auth.js` | 注册/登录/获取用户信息。 |
| `server/routes/admin.js` | 管理端接口（用户/模板/日志/统计/聊天）。 |
| `server/routes/cases.js` | 案卷接口（列表、详情、模板文件等）。 |
| `server/routes/ai.js` | AI 解析主逻辑（Function Calling + SSE）。 |

**后端：工具**
| 路径 | 作用 |
| --- | --- |
| `server/utils/logger.js` | 操作日志写入工具与常量。 |

**后端：上传与临时文件（运行时）**
| 路径 | 作用 |
| --- | --- |
| `server/uploads/temp/7fdb1c08a63d48837df95d380a4201ce` | AI 上传临时文件（无扩展名，运行时生成）。 |
| `server/uploads/temp/94a6497ec0cf232796b664dac626d6b1` | AI 上传临时文件（无扩展名，运行时生成）。 |
| `server/uploads/temp/9b5f92f3b963925bf121334950a9bb1d` | AI 上传临时文件（无扩展名，运行时生成）。 |
| `server/uploads/templates/cmeb64e32005fl19a6zyvycvy-1767356059226-368169441.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmeb64e32005fl19a6zyvycvy-1771508311977-694801938.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmeb64e32005fl19a6zyvycvy-1771508337755-82160144.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmeb64e32005fl19a6zyvycvy-1771508800660-508052343.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmeb64e32005fl19a6zyvycvy-1771508843483-395341862.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1766651272714-88607683.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1766716947768-568257976.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1766717115700-991404189.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1766717417274-180478807.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1766717989078-346334273.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmec4w6ls00ji6td8hlleokho-1771509109497-185317128.docx` | 已上传的模板文件（示例/运行时）。 |
| `server/uploads/templates/cmjwpyde80irokjxlsz1mkq87-1767349451910-174864324.docx` | 已上传的模板文件（示例/运行时）。 |

**样例模板与解压结构（信用卡纠纷）**
| 路径 | 作用 |
| --- | --- |
| `信用卡纠纷/markData.json` | 示例模板的 markData 配置。 |
| `信用卡纠纷/信用卡纠纷.docx` | 示例 Word 模板文件。 |
| `信用卡纠纷/信用卡纠纷.zip` | 示例 docx 的 zip 形式。 |
| `信用卡纠纷/信用卡纠纷/[Content_Types].xml` | docx 内部文件类型声明。 |
| `信用卡纠纷/信用卡纠纷/_rels/.rels` | docx 关系定义（根级）。 |
| `信用卡纠纷/信用卡纠纷/docProps/app.xml` | docx 应用属性。 |
| `信用卡纠纷/信用卡纠纷/docProps/core.xml` | docx 核心属性（作者、时间等）。 |
| `信用卡纠纷/信用卡纠纷/docProps/custom.xml` | docx 自定义属性。 |
| `信用卡纠纷/信用卡纠纷/word/document.xml` | docx 主文档内容（文本与占位符）。 |
| `信用卡纠纷/信用卡纠纷/word/fontTable.xml` | docx 字体表。 |
| `信用卡纠纷/信用卡纠纷/word/settings.xml` | docx 文档设置。 |
| `信用卡纠纷/信用卡纠纷/word/styles.xml` | docx 样式表。 |
| `信用卡纠纷/信用卡纠纷/word/theme/theme1.xml` | docx 主题配置。 |
| `信用卡纠纷/信用卡纠纷/word/_rels/document.xml.rels` | docx 文档关系定义。 |

