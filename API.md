# FastReplace API 接口文档

## 基础信息

- **Base URL**: `http://localhost:5000/api`
- **认证方式**: Bearer Token (JWT)
- **请求头**: 
  - `Content-Type: application/json`
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
      "category": "divorce",
      "fields": [
        {
          "name": "husband_name",
          "label": "男方姓名",
          "type": "text"
        }
      ],
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

**描述**: 创建新模板

**请求参数**:
```json
{
  "name": "买卖合同",
  "description": "商品买卖合同模板",
  "category": "sales",
  "fields": [
    {
      "name": "buyer",
      "label": "买方",
      "type": "text"
    }
  ]
}
```

**响应示例**:
```json
{
  "message": "模板创建成功",
  "template": {
    "id": 4,
    "name": "买卖合同",
    "description": "商品买卖合同模板",
    "category": "sales",
    "fields": [...]
  }
}
```

---

#### 2.2.3 更新模板

**接口**: `PUT /admin/templates/:id`

**描述**: 更新指定模板

**请求参数**:
```json
{
  "name": "买卖合同（更新版）",
  "description": "更新后的描述",
  "category": "sales",
  "fields": [...]
}
```

**响应示例**:
```json
{
  "message": "模板更新成功"
}
```

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
  "category": "divorce",
  "fields": [...],
  "created_at": "2025-11-21T15:17:37.000Z",
  "updated_at": "2025-11-21T15:17:37.000Z"
}
```

---

## 3. 案卷模块 (`/cases`)

> **注意**: 所有案卷接口都需要用户认证

### 3.1 获取案卷列表

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

### 3.2 创建案卷

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

### 3.3 更新案卷

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

### 3.4 删除案卷

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

### 3.5 获取案卷详情

**接口**: `GET /cases/:id`

**描述**: 获取指定案卷的详细信息

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
  "updated_at": "2025-11-21T15:17:37.000Z"
}
```

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

---

## 8. 注意事项

1. 所有需要认证的接口必须在请求头中携带 `Authorization: Bearer {token}`
2. Token 有效期为 7 天
3. 管理员接口需要 `role: admin` 权限
4. 用户只能操作自己创建的案卷
5. 删除模板会将关联案卷的 `template_id` 设置为 NULL
6. 删除用户会级联删除该用户的所有案卷
