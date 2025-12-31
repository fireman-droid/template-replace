/**
 * 计算 JSON 数据中包含的标记 (markKey) 总数
 * @param {Object} markData - 完整的 JSON 对象
 * @returns {number} - 标记的数量
 */
export function countSpace(markData) {
  let count = 0;

  // 1. 基础校验
  if (!markData || !markData.data || !Array.isArray(markData.data)) {
    return 0;
  }

  // 2. 遍历所有表格 (type: table)
  markData.data.forEach((table) => {
    if (table.type !== "table" || !table.data) return;

    // 3. 遍历表格中的行 (type: table-row)
    table.data.forEach((row) => {
      if (row.type !== "table-row" || !row.data) return;

      // 4. 遍历行中的列 (type: table-col)
      row.data.forEach((col) => {
        if (col.type !== "table-col" || !col.data) return;

        // 5. 遍历列中的组件 (field, table-title, inline-fields, text 等)
        col.data.forEach((item) => {
          count += countItemMarks(item);
        });
      });
    });
  });

  return count;
}

/**
 * 辅助函数：计算单个组件内的标记数量
 * @param {Object} item - 列中的单个组件对象
 * @returns {number}
 */
function countItemMarks(item) {
  let localCount = 0;
  const data = item.data;

  if (!data) return 0;

  // 情况 A: table-title 类型，通常 mark 在 data.mark 对象中
  if (item.type === "table-title") {
    if (data.mark && data.mark.markKey) {
      localCount++;
    }
  }

  // 情况 B: field 或 text 类型，通常 marks 是一个数组
  else if (item.type === "field" || item.type === "text") {
    if (Array.isArray(data.marks)) {
      // 过滤掉无效的 mark，确保有 markKey
      localCount += data.marks.filter((m) => m && m.markKey).length;
    }
  }

  // 情况 C: inline-fields 类型，内部包含子字段数组 (fields)
  else if (item.type === "inline-fields") {
    if (Array.isArray(data.fields)) {
      data.fields.forEach((subField) => {
        // 子字段的结构类似于 field 的 data 部分，直接检查 marks 数组
        if (Array.isArray(subField.marks)) {
          localCount += subField.marks.filter((m) => m && m.markKey).length;
        }
      });
    }
  }

  return localCount;
}

export default countSpace;

// {
//   "type": "multi-table",
//   "data": [
//     {
//       "type": "table",
//       "data": [
//         {
//           "type": "table-row",
//           "data": [
//             {
//               "type": "table-col",
//               "data": [
//                 {
//                   "type": "table-title",
//                   "data": {
//                     "title": "示例标题（如：当事人信息）",
//                     "mark": { "markKey": "uuid-..." }
//                   }
//                 }
//               ]
//             },
//             {
//               "type": "table-col",
//               "data": [
//                 {
//                   "type": "field",
//                   "data": {
//                     "fieldKey": "1",
//                     "fieldLabel": "示例字段（如：姓名）",
//                     "type": "text",
//                     "marks": [
//                       { "markKey": "uuid-..." }
//                     ]
//                   }
//                 },
//                 {
//                   "type": "inline-fields",
//                   "data": {
//                     "fields": [
//                          {
//                              "type": "text", 
//                              "marks": [{ "markKey": "..." }] 
//                          }
//                     ]
//                   }
//                 }
//               ]
//             }
//           ]
//         }
//       ]
//     }
//   ]
// }