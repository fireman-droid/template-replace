# FastReplace API 接口文档

**版本**: v1.0  
**最后更新**: 2025-11-22

## 目录

1. [基础信息](#基础信息)
2. [认证模块](#1-认证模块-auth)
3. [管理员模块](#2-管理员模块-admin)
4. [案卷模块](#3-案卷模块-cases)
5. [通用错误码](#4-通用错误码)
6. [数据字典](#5-数据字典)
7. [测试账号](#6-测试账号)
8. [开发环境](#7-开发环境)
9. [注意事项](#8-注意事项)
10. [API 使用示例](#9-api-使用示例)

---

## 基础信息

- **Base URL**: `http://localhost:5000/api`
- **认证方式**: Bearer Token (JWT)
- **Token 有效期**: 7 天
- **请求头**: 
  - `Content-Type: application/json` (JSON 请求)
  - `Content-Type: multipart/form-data` (文件上传)
  - `Authorization: Bearer {token}` (需要认证的接口)

---

## 1. 认证模块 (`/auth`)

### 1.1 用户注册

**接口**: `POST /auth/register`

**描述**: 注册新用户账号

**请求参数**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "message": "注册成功",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**错误码**:
- `400`: 参数错误或用户名/邮箱已存在
- `500`: 服务器错误

---

### 1.2 用户登录

**接口**: `POST /auth/login`

**描述**: 用户登录获取 token

**请求参数**:
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**错误码**:
- `400`: 参数错误
- `401`: 邮箱或密码错误
- `500`: 服务器错误

---

### 1.3 获取当前用户信息

**接口**: `GET /auth/me`

**描述**: 获取当前登录用户的信息

**请求头**: 需要 `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**错误码**:
- `401`: 未授权或 token 无效
- `500`: 服务器错误

---

## 2. 管理员模块 (`/admin`)

> **注意**: 所有管理员接口都需要管理员权限 (`role: admin`)

### 2.1 用户管理

#### 2.1.1 获取用户列表

**接口**: `GET /admin/users`

**描述**: 获取所有用户列表（分页）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 搜索关键词（用户名或邮箱） |

**响应示例**:
```json
{
  "list": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@test.com",
      "role": "admin",
      "created_at": "2025-11-21T15:17:37.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "pageSize": 10
}
```

---

#### 2.1.2 更新用户角色

**接口**: `PUT /admin/users/:id/role`

**描述**: 切换用户角色（admin/user）

**请求参数**:
```json
{
  "role": "admin"
}
```

**响应示例**:
```json
{
  "message": "角色更新成功"
}
```

**错误码**:
- `400`: 无效的角色
- `403`: 无权限
- `404`: 用户不存在

---

#### 2.1.3 删除用户

**接口**: `DELETE /admin/users/:id`

**描述**: 删除指定用户

**响应示例**:
```json
{
  "message": "用户删除成功"
}
```

**错误码**:
- `400`: 不能删除自己的账号
- `403`: 无权限
- `404`: 用户不存在

---

### 2.2 模板管理

#### 2.2.1 获取模板列表

**接口**: `GET /admin/templates`

**描述**: 获取所有模板列表（分页）

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 搜索关键词 |

**响应示例**:
```json
{
  "list": [
    {
      "id": 1,
      "name": "离婚协议书",
      "description": "标准离婚协议书模板",
      "icon": "UserFilled",
      "features": ["抚养权判定", "房产分割", "债务处理"],
      "fields": {
        "husband_name": "男方姓名",
        "wife_name": "女方姓名"
      },
      "mapping": {
        "husband_name": "男方姓名",
        "wife_name": "女方姓名"
      },
      "file_path": "template-xxx.docx",
      "enabled": true,
      "created_at": "2025-11-21T15:17:37.000Z"
    }
  ],
  "total": 3,
  "page": 1,
  "pageSize": 10
}
```

---

#### 2.2.2 创建模板

**接口**: `POST /admin/templates`

**描述**: 创建新模板（支持文件上传）

**请求方式**: `multipart/form-data`

**请求头**: 
- `Authorization: Bearer {token}` (需要管理员权限)
- `Content-Type: multipart/form-data`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 模板名称 |
| description | string | 否 | 模板描述 |
| docx | file | 否 | Word 模板文件 (.docx) |
| fields | string | 否 | 字段配置 JSON 字符串 |
| mapping | string | 否 | 映射配置 JSON 字符串 |

**字段说明**:
- `fields`: 定义模板中的字段及其显示名称，格式为 `{ "field_key": "字段显示名" }`
- `mapping`: 定义字段在 Word 文档中的占位符映射，格式为 `{ "field_key": "{{占位符}}" }`

**示例**:
```javascript
const formData = new FormData()
formData.append('name', '买卖合同')
formData.append('description', '商品买卖合同模板')
formData.append('docx', file) // File 对象
formData.append('fields', JSON.stringify({ 
  buyer_name: '买方姓名', 
  seller_name: '卖方姓名',
  amount: '交易金额'
}))
formData.append('mapping', JSON.stringify({ 
  buyer_name: '买方姓名', 
  seller_name: '卖方姓名',
  amount: '金额'
}))
```

**响应示例**:
```json
{
  "message": "模板创建成功",
  "template": {
    "id": 4,
    "name": "买卖合同",
    "description": "商品买卖合同模板",
    "fields": {
      "buyer_name": "买方姓名",
      "seller_name": "卖方姓名",
      "amount": "交易金额"
    },
    "mapping": {
      "buyer_name": "买方姓名",
      "seller_name": "卖方姓名",
      "amount": "金额"
    },
    "file_path": "template-1234567890123-123456789.docx"
  }
}
```

**错误码**:
- `400`: 模板名称为必填项 / Fields 或 Mapping 格式错误
- `403`: 无权限（非管理员）
- `500`: 服务器错误

---

#### 2.2.3 更新模板

**接口**: `PUT /admin/templates/:id`

**描述**: 更新指定模板的信息（不包括文件）

**请求头**: 需要 `Authorization: Bearer {token}` 和管理员权限

**请求参数**:
```json
{
  "name": "买卖合同（更新版）",
  "description": "更新后的描述",
  "fields": {
    "buyer_name": "买方姓名",
    "seller_name": "卖方姓名"
  }
}
```

**字段说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 模板名称 |
| description | string | 否 | 模板描述 |
| fields | object | 否 | 字段配置（JSON 对象） |

**响应示例**:
```json
{
  "message": "模板更新成功"
}
```

**错误码**:
- `403`: 无权限（非管理员）
- `404`: 模板不存在
- `500`: 服务器错误

---

#### 2.2.4 删除模板

**接口**: `DELETE /admin/templates/:id`

**描述**: 删除指定模板

**响应示例**:
```json
{
  "message": "模板删除成功"
}
```

---

#### 2.2.5 获取模板详情

**接口**: `GET /admin/templates/:id`

**描述**: 获取指定模板的详细信息

**响应示例**:
```json
{
  "id": 1,
  "name": "离婚协议书",
  "description": "标准离婚协议书模板",
  "icon": "UserFilled",
  "features": ["抚养权判定", "房产分割", "债务处理"],
  "fields": {...},
  "mapping": {...},
  "file_path": "template-xxx.docx",
  "enabled": true,
  "created_at": "2025-11-21T15:17:37.000Z",
  "updated_at": "2025-11-21T15:17:37.000Z"
}
```

---

#### 2.2.6 下载模板文件

**接口**: `GET /admin/templates/:id/download`

**描述**: 下载指定模板的 Word 文件

**请求头**: 需要 `Authorization: Bearer {token}` 和管理员权限

**响应**: 返回文件流，浏览器会自动下载文件

**文件名格式**: `{模板名称}.docx`

**错误码**:
- `403`: 无权限
- `404`: 模板不存在或文件不存在
- `500`: 服务器错误

---

## 3. 案卷模块 (`/cases`)

> **注意**: 所有案卷接口都需要用户认证

### 3.1 获取可用的起草模板列表

**接口**: `GET /cases/templates`

**描述**: 获取所有已启用的起草模板列表（用于选择模板页面）

**请求头**: 需要 `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "templates": [
    {
      "id": 1,
      "name": "离婚纠纷协议",
      "description": "适用于双方自愿离婚，需处理子女抚养及财产分割。",
      "icon": "UserFilled",
      "features": ["抚养权判定", "房产分割", "债务处理"],
      "fields": {
        "husband_name": "男方姓名",
        "wife_name": "女方姓名"
      },
      "mapping": {
        "husband_name": "男方姓名",
        "wife_name": "女方姓名"
      },
      "file_path": "template-xxx.docx",
      "enabled": true
    }
  ],
  "total": 3
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 模板 ID（数据库自增） |
| name | string | 模板名称 |
| description | string | 模板描述 |
| icon | string | 图标名称（Element Plus 图标） |
| features | array | 模板特性列表 |
| fields | object | 字段配置（JSON 对象） |
| mapping | object | 字段映射配置（JSON 对象） |
| file_path | string | Word 模板文件路径 |
| enabled | boolean | 是否启用（仅返回 enabled=true 的模板） |

**错误码**:
- `401`: 未授权
- `500`: 服务器错误

---

### 3.2 获取案卷列表

**接口**: `GET /cases`

**描述**: 获取当前用户的案卷列表

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 搜索关键词（案卷标题） |
| status | string | 否 | 状态筛选（draft/completed/archived） |

**响应示例**:
```json
{
  "list": [
    {
      "id": 1,
      "title": "张三诉李四离婚纠纷案",
      "template_id": 1,
      "template_name": "离婚协议书",
      "user_id": 2,
      "username": "testuser",
      "status": "draft",
      "form_data": {
        "husband_name": "张三",
        "wife_name": "李四"
      },
      "created_at": "2025-11-21T15:17:37.000Z",
      "updated_at": "2025-11-21T15:17:37.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

---

### 3.3 创建案卷

**接口**: `POST /cases`

**描述**: 创建新案卷

**请求参数**:
```json
{
  "title": "张三诉李四离婚纠纷案",
  "template_id": 1,
  "status": "draft",
  "form_data": {
    "husband_name": "张三",
    "wife_name": "李四"
  }
}
```

**响应示例**:
```json
{
  "message": "案卷创建成功",
  "case": {
    "id": 10,
    "title": "张三诉李四离婚纠纷案",
    "template_id": 1,
    "user_id": 2,
    "status": "draft",
    "form_data": {...}
  }
}
```

**错误码**:
- `400`: 案卷标题为必填项
- `401`: 未授权
- `500`: 服务器错误

---

### 3.4 更新案卷

**接口**: `PUT /cases/:id`

**描述**: 更新指定案卷

**请求参数**:
```json
{
  "title": "更新后的标题",
  "template_id": 1,
  "status": "completed",
  "form_data": {...}
}
```

**响应示例**:
```json
{
  "message": "案卷更新成功"
}
```

**错误码**:
- `403`: 无权修改此案卷
- `404`: 案卷不存在

---

### 3.5 删除案卷

**接口**: `DELETE /cases/:id`

**描述**: 删除指定案卷

**响应示例**:
```json
{
  "message": "案卷删除成功"
}
```

**错误码**:
- `403`: 无权删除此案卷
- `404`: 案卷不存在

---

### 3.6 获取案卷详情

**接口**: `GET /cases/:id`

**描述**: 获取指定案卷的详细信息（包含关联的模板信息）

**响应示例**:
```json
{
  "id": 1,
  "title": "张三诉李四离婚纠纷案",
  "template_id": 1,
  "user_id": 2,
  "status": "draft",
  "form_data": {
    "husband_name": "张三",
    "wife_name": "李四"
  },
  "created_at": "2025-11-21T15:17:37.000Z",
  "updated_at": "2025-11-21T15:17:37.000Z",
  "template": {
    "id": 1,
    "name": "离婚协议书",
    "description": "标准离婚协议书模板",
    "fields": {
      "husband_name": "男方姓名",
      "wife_name": "女方姓名"
    },
    "mapping": {
      "husband_name": "男方姓名",
      "wife_name": "女方姓名"
    },
    "file_path": "template-xxx.docx"
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| template | object | 关联的模板信息（如果案卷有关联模板） |
| template.fields | object | 模板字段结构 JSON |
| template.mapping | object | 模板字段映射表 JSON |
| template.file_path | string | Word 模板文件路径 |

**注意**: 如果案卷没有关联模板，`template` 字段为 `null`

**错误码**:
- `403`: 无权访问此案卷
- `404`: 案卷不存在

---

## 4. 通用错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或 token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 5. 数据字典

### 用户角色 (role)
- `admin`: 管理员
- `user`: 普通用户

### 案卷状态 (status)
- `draft`: 草稿
- `completed`: 已完成
- `archived`: 已归档

### 模板分类 (category)
- `divorce`: 离婚纠纷
- `sales`: 买卖合同
- `house`: 房屋租赁

---

## 6. 测试账号

### 管理员账号
- 邮箱: `admin@test.com`
- 密码: `admin123`

### 普通用户账号
- 邮箱: `user@test.com`
- 密码: `user123`

---

## 7. 开发环境

- **后端端口**: 5000
- **前端端口**: 3000
- **数据库**: MySQL 8.0
- **数据库名**: fastreplace
- **Node.js 版本**: 16.x 或更高

---

## 9. API 使用示例

### 9.1 完整的用户注册登录流程

```javascript
// 1. 注册新用户
const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: '123456'
  })
})
const registerData = await registerResponse.json()
console.log(registerData.message) // "注册成功"

// 2. 用户登录获取 token
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: '123456'
  })
})
const loginData = await loginResponse.json()
const token = loginData.token

// 3. 使用 token 获取用户信息
const meResponse = await fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const meData = await meResponse.json()
console.log(meData.user) // 当前用户信息
```

### 9.2 创建案卷的完整流程

```javascript
// 假设已经登录并获得 token
const token = 'your-jwt-token-here'

// 1. 获取可用模板列表
const templatesResponse = await fetch('http://localhost:5000/api/cases/templates', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const templatesData = await templatesResponse.json()
const templateId = templatesData.templates[0].id

// 2. 创建新案卷
const createCaseResponse = await fetch('http://localhost:5000/api/cases', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '张三诉李四离婚纠纷案',
    template_id: templateId,
    status: 'draft',
    form_data: {
      husband_name: '张三',
      wife_name: '李四',
      marriage_date: '2020-01-01'
    }
  })
})
const createCaseData = await createCaseResponse.json()
console.log(createCaseData.message) // "案卷创建成功"

// 3. 获取案卷列表
const casesResponse = await fetch('http://localhost:5000/api/cases?page=1&pageSize=10', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const casesData = await casesResponse.json()
console.log(casesData.list) // 案卷列表
```

### 9.3 管理员上传模板

```javascript
// 假设已经以管理员身份登录
const adminToken = 'admin-jwt-token-here'

// 准备表单数据
const formData = new FormData()
formData.append('name', '劳动合同模板')
formData.append('description', '标准劳动合同模板')

// 添加 Word 文件（从文件输入框获取）
const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]
formData.append('docx', file)

// 添加字段配置
formData.append('fields', JSON.stringify({
  employee_name: '员工姓名',
  company_name: '公司名称',
  position: '职位',
  salary: '薪资'
}))

formData.append('mapping', JSON.stringify({
  employee_name: '员工姓名',
  company_name: '公司名称',
  position: '职位',
  salary: '月薪'
}))

// 上传模板
const uploadResponse = await fetch('http://localhost:5000/api/admin/templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
    // 注意：不要手动设置 Content-Type，浏览器会自动设置为 multipart/form-data
  },
  body: formData
})
const uploadData = await uploadResponse.json()
console.log(uploadData.message) // "模板创建成功"
```

### 9.4 错误处理示例

```javascript
async function apiCall() {
  try {
    const response = await fetch('http://localhost:5000/api/cases', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    // 检查 HTTP 状态码
    if (!response.ok) {
      const errorData = await response.json()
      
      // 根据状态码处理不同错误
      switch (response.status) {
        case 401:
          console.error('未授权，请重新登录')
          // 跳转到登录页
          break
        case 403:
          console.error('无权限访问')
          break
        case 404:
          console.error('资源不存在')
          break
        case 500:
          console.error('服务器错误:', errorData.message)
          break
        default:
          console.error('请求失败:', errorData.message)
      }
      
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('网络错误:', error)
    return null
  }
}
```

---

## 8. 注意事项

### 8.1 认证与权限
1. 所有需要认证的接口必须在请求头中携带 `Authorization: Bearer {token}`
2. Token 有效期为 7 天，过期后需要重新登录
3. 管理员接口需要 `role: admin` 权限，普通用户无法访问
4. 用户只能操作自己创建的案卷，无法访问其他用户的案卷

### 8.2 数据操作
5. 删除模板会将关联案卷的 `template_id` 设置为 NULL
6. 删除用户会级联删除该用户的所有案卷
7. 模板的 `fields` 和 `mapping` 字段存储为 JSON 格式
8. 案卷的 `form_data` 字段存储用户填写的表单数据（JSON 格式）

### 8.3 文件上传
9. 上传模板文件时使用 `multipart/form-data` 格式
10. 支持的文件格式：`.docx`（Word 文档）
11. 文件会自动重命名为 `{原文件名}-{时间戳}-{随机数}.docx` 格式
12. 文件存储路径：`server/uploads/templates/`

### 8.4 分页与搜索
13. 所有列表接口都支持分页，默认 `page=1, pageSize=10`
14. 搜索关键词会匹配相关字段（用户名、邮箱、模板名称、案卷标题等）
15. 分页响应格式统一为：`{ list: [], total: number, page: number, pageSize: number }`

### 8.5 错误处理
16. 所有错误响应都包含 `message` 字段说明错误原因
17. 开发环境下会返回详细的错误堆栈信息（`error` 和 `stack` 字段）
18. 生产环境建议隐藏详细错误信息，只返回通用错误消息
