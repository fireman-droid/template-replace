# 测试案卷详情接口

## 测试步骤

### 1. 启动服务器
```bash
cd server
npm run dev
```

### 2. 测试获取案卷详情

**请求**:
```bash
GET http://localhost:5000/api/cases/10
Authorization: Bearer YOUR_TOKEN
```

**预期返回**:
```json
{
  "id": 10,
  "title": "新建案卷草稿",
  "template_id": 4,
  "user_id": 1,
  "status": "draft",
  "form_data": {},
  "created_at": "2025-11-22T13:40:33.000Z",
  "updated_at": "2025-11-22T13:40:33.000Z",
  "template": {
    "id": 4,
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

## 验证要点

✅ 返回数据包含 `template` 字段
✅ `template.fields` 包含字段结构 JSON
✅ `template.mapping` 包含映射表 JSON
✅ `template.file_path` 包含 Word 文件路径

## 前端使用示例

```javascript
// 在 ProjectEdit.vue 中
const handleGetCaseDetail = async (id) => {
  const res = await getCaseDetail(id)
  
  // 案卷信息
  caseName.value = res.title
  
  // 模板信息
  if (res.template) {
    console.log('字段结构:', res.template.fields)
    console.log('映射表:', res.template.mapping)
    console.log('Word文件:', res.template.file_path)
  }
}
```

## 可能的问题

### 问题1: template 为 null
**原因**: 案卷的 `template_id` 为 null 或模板已被删除
**解决**: 确保案卷有关联的模板

### 问题2: fields 或 mapping 为空对象
**原因**: 模板创建时没有设置这些字段
**解决**: 在创建模板时确保传入 fields 和 mapping 数据

### 问题3: 权限错误
**原因**: 尝试访问其他用户的案卷
**解决**: 确保使用正确的用户 token
