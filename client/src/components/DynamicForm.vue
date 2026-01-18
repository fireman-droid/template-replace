<template>
  <div class="dynamic-form">
    <el-collapse v-model="activeCategories">
      <!-- 遍历大分类 -->
      <el-collapse-item v-for="(category, catIndex) in categories" :key="catIndex" :name="catIndex">
        <template #title>
          <div class="category-title">{{ category.title }}</div>
        </template>

        <!-- 子分类（不折叠），当 repeatCount 为 0 且 canRemove 时隐藏 -->
        <div v-for="(subCat, subIndex) in category.subCategories" :key="subIndex" 
          v-show="!isSubCategoryHidden(subCat)" class="sub-category">
          <!-- 左边：标题 + 添加按钮（只有有 markKey 才能添加） -->
          <div class="sub-category-left">
            <div class="sub-category-title">{{ subCat.title }}</div>
            <el-button v-if="subCat.canRepeat && subCat.markKey" type="primary" size="small" class="add-person-btn"
              @click="addPerson(subCat.markKey)">
              + 添加
            </el-button>
          </div>

          <!-- 右边：字段列表（支持多人员） -->
          <div class="sub-category-right">
            <!-- 遍历每个人员实例 -->
            <div v-for="personIndex in getRepeatCount(subCat.markKey)" :key="personIndex" class="person-block">
              <!-- 人员标题栏：始终显示序号和删除按钮 -->
              <div v-if="subCat.canRepeat && getRepeatCount(subCat.markKey) >= 1" class="person-header">
                <span class="person-label">
                  {{ subCat.title.replace(/[（(].*[）)]/, '') }} {{ personIndex }}
                </span>
                <el-button type="danger" size="small" class="delete-person-btn"
                  @click="removePerson(subCat.markKey, personIndex - 1, subCat.fields, subCat.canRemove)">
                  删除
                </el-button>
              </div>

              <!-- 该人员的表单字段 -->
              <el-form :model="formData" label-position="top" class="field-form">
                <el-form-item v-for="field in subCat.fields" :key="getFieldKey(field.fieldKey, personIndex - 1)"
                  :label="field.fieldLabel" :data-field-key="getFieldKey(field.fieldKey, personIndex - 1)">
                  <!-- 文本输入 -->
                  <el-input v-if="field.type === 'text'"
                    v-model="formData[getFieldKey(field.fieldKey, personIndex - 1)]"
                    :placeholder="`请输入${field.fieldLabel}`" />

                  <!-- 日期选择 -->
                  <el-date-picker v-else-if="field.type === 'date'"
                    v-model="formData[getFieldKey(field.fieldKey, personIndex - 1)]" type="date"
                    value-format="YYYY-MM-DD" :placeholder="`请选择${field.fieldLabel}`" style="width: 100%" />

                  <!-- 数字输入 -->
                  <el-input-number v-else-if="field.type === 'number' || field.type === 'amount'"
                    v-model="formData[getFieldKey(field.fieldKey, personIndex - 1)]" style="width: 100%"
                    :controls="false" />

                  <!-- 选项：多选 -->
                  <el-checkbox-group v-else-if="field.type === 'options' && field.isMultiple"
                    v-model="formData[getFieldKey(field.fieldKey, personIndex - 1)]">
                    <el-checkbox v-for="opt in field.options" :key="opt.label" :label="opt.label">
                      {{ opt.label }}
                    </el-checkbox>
                  </el-checkbox-group>

                  <!-- 选项：单选（可取消） -->
                  <div v-else-if="field.type === 'options'" class="radio-group">
                    <span v-for="opt in field.options" :key="opt.label" class="radio-item"
                      :class="{ active: formData[getFieldKey(field.fieldKey, personIndex - 1)] === opt.label }"
                      @click="toggleRadio(getFieldKey(field.fieldKey, personIndex - 1), opt.label)">
                      <span class="radio-circle"></span>
                      {{ opt.label }}
                    </span>
                  </div>

                  <!-- 默认文本 -->
                  <el-input v-else v-model="formData[getFieldKey(field.fieldKey, personIndex - 1)]"
                    :placeholder="`请输入${field.fieldLabel}`" />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  markData: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  repeatCountMap: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'update:repeatCountMap'])

// 表单数据
const formData = ref({ ...props.modelValue })

// 监听外部数据变化，同步到内部
watch(() => props.modelValue, (newVal) => {
  // 合并新值到 formData，保留已有数据
  Object.keys(newVal).forEach(key => {
    formData.value[key] = newVal[key]
  })
}, { deep: true })

// 单选切换（点击已选中的可取消）
const toggleRadio = (fieldKey, value) => {
  if (formData.value[fieldKey] === value) {
    formData.value[fieldKey] = '' // 取消选中
  } else {
    formData.value[fieldKey] = value // 选中
  }
}

// ====== 多人员管理 ======
// 记录每个子分类的人员数量，key: markKey，value: 人员数量
const repeatCounts = ref({ ...props.repeatCountMap })

// 监听外部 repeatCountMap 变化，同步到内部
watch(() => props.repeatCountMap, (newVal) => {
  Object.keys(newVal).forEach(key => {
    repeatCounts.value[key] = newVal[key]
  })
}, { deep: true })

// 监听内部 repeatCounts 变化，emit 给父组件
watch(repeatCounts, (newVal) => {
  emit('update:repeatCountMap', newVal)
}, { deep: true })

// 获取某个子分类的人员数量
function getRepeatCount(markKey) {
  if (!markKey) return 1
  return repeatCounts.value[markKey] || 1
}

// 判断子分类是否隐藏（当 canRemove 为 true 且 repeatCount 为 0 时隐藏）
function isSubCategoryHidden(subCat) {
  if (!subCat.canRemove) return false
  if (!subCat.markKey) return false
  // 只有当 repeatCount 显式设置为 0 或更小时才隐藏
  const count = repeatCounts.value[subCat.markKey]
  if (count === undefined) return false // 未设置时默认显示
  return count <= 0
}

// 添加一个人员
function addPerson(markKey) {
  if (!markKey) return
  repeatCounts.value[markKey] = (repeatCounts.value[markKey] || 1) + 1
}

// 删除一个人员
function removePerson(markKey, personIndex, fields, canRemove = false) {
  if (!markKey) return
  const count = repeatCounts.value[markKey] || 1
  
  // 如果不能删除到 0，则保持最少 1 个
  if (count <= 1 && !canRemove) return
  if (count <= 0) return
  
  repeatCounts.value[markKey] = count - 1
  
  // 清理被删除人员的表单数据，并重新编号后续人员数据
  for (const field of fields) {
    // 删除当前人员的数据
    const deletedKey = getFieldKey(field.fieldKey, personIndex)
    delete formData.value[deletedKey]
    
    // 将后续人员的数据往前移
    for (let i = personIndex + 1; i < count; i++) {
      const fromKey = getFieldKey(field.fieldKey, i)
      const toKey = getFieldKey(field.fieldKey, i - 1)
      if (formData.value[fromKey] !== undefined) {
        formData.value[toKey] = formData.value[fromKey]
        delete formData.value[fromKey]
      }
    }
  }
}

// 根据人员索引获取字段 Key
function getFieldKey(baseKey, personIndex) {
  return personIndex === 0 ? baseKey : `${baseKey}_${personIndex}`
}

// 生成 rowRepeatCountMap（用于保存和文档生成）
function getRowRepeatCountMap() {
  const map = {}
  for (const [markKey, count] of Object.entries(repeatCounts.value)) {
    if (count > 1) {
      map[markKey] = count
    }
  }
  return map
}

// 展开的大分类（默认展开第一个）
const activeCategories = ref([0])

// 提取字段的辅助函数
function extractFields(items) {
  const fields = []

  for (const item of items) {
    if (item.type === 'field' && item.data) {
      fields.push({
        fieldKey: item.data.fieldKey,
        fieldLabel: item.data.fieldLabel || '未命名',
        type: item.data.type || 'text',
        isMultiple: item.data.props?.isMultiple || false,
        options: item.data.props?.options || []
      })
    }
    // 处理 inline-fields
    if (item.type === 'inline-fields' && item.data?.fields) {
      for (const f of item.data.fields) {
        fields.push({
          fieldKey: f.fieldKey,
          fieldLabel: f.fieldLabel || '未命名',
          type: f.type || 'text',
          isMultiple: f.props?.isMultiple || false,
          options: f.props?.options || []
        })
      }
    }
  }

  return fields
}

// 解析 markData，提取分类结构
const categories = computed(() => {
  const result = []

  if (!props.markData?.data) return result

  // 遍历所有 table
  for (const table of props.markData.data) {
    if (table.type !== 'table' || !table.data) continue

    let currentCategory = null

    for (const row of table.data) {
      if (row.type !== 'table-row' || !row.data) continue

      const cols = row.data

      // 检查第一个 col 是否只有 table-title（大分类标题）
      const firstCol = cols[0]
      if (cols.length === 1 &&
        firstCol?.type === 'table-col' &&
        firstCol.data?.length === 1 &&
        firstCol.data[0].type === 'table-title') {
        // 大分类标题
        if (currentCategory && currentCategory.subCategories.length > 0) {
          result.push(currentCategory)
        }
        currentCategory = {
          title: firstCol.data[0].data.title,
          subCategories: []
        }
        continue
      }

      // 子分类或字段行
      let subTitle = ''
      let subMarkKey = ''
      let canRepeat = false
      let canRemove = false
      let fields = []

      for (const col of cols) {
        if (col.type !== 'table-col' || !col.data) continue

        for (const item of col.data) {
          if (item.type === 'table-title') {
            subTitle = item.data.title
            subMarkKey = item.data.mark?.markKey || ''
            canRepeat = item.data.canRepeatSubjectRow || false
            canRemove = item.data.canRemoveSubjectWhenEmpty || false
          }
        }

        // 提取字段
        fields = fields.concat(extractFields(col.data))
      }

      // 如果有字段，添加到当前分类
      if (fields.length > 0 && currentCategory) {
        // 如果没有子标题，使用"其他"或合并到上一个子分类
        if (!subTitle) {
          if (currentCategory.subCategories.length > 0) {
            // 合并到上一个子分类
            const lastSub = currentCategory.subCategories[currentCategory.subCategories.length - 1]
            lastSub.fields = lastSub.fields.concat(fields)
          } else {
            subTitle = '基本信息'
            currentCategory.subCategories.push({ title: subTitle, fields, markKey: '', canRepeat: false, canRemove: false })
          }
        } else {
          currentCategory.subCategories.push({ title: subTitle, fields, markKey: subMarkKey, canRepeat, canRemove })
        } 
      }
    }

    // 添加最后一个分类
    if (currentCategory && currentCategory.subCategories.length > 0) {
      result.push(currentCategory)
    }
  }
  return result
})

// 根据 fieldKey 找到所在的分类索引并展开
function expandCategoryByFieldKey(fieldKey) {
  for (let catIndex = 0; catIndex < categories.value.length; catIndex++) {
    const category = categories.value[catIndex]
    for (const subCat of category.subCategories) {
      const found = subCat.fields.some(f => f.fieldKey === fieldKey)
      if (found) {
        // 展开该分类
        if (!activeCategories.value.includes(catIndex)) {
          activeCategories.value.push(catIndex)
        }
        return true
      }
    }
  }
  return false
}

// 暴露方法给父组件
defineExpose({
  expandCategoryByFieldKey,
  getRowRepeatCountMap,
  repeatCounts
})

// 监听表单数据变化
watch(formData, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style scoped lang="scss">
$bg-deep: #050b14;
$primary: #3b82f6;
$accent: #06b6d4;
$border: rgba(255, 255, 255, 0.1);
$text-white: #ffffff;
$text-gray: #94a3b8;

.dynamic-form {

  // 大分类标题
  .category-title {
    font-size: 16px;
    font-weight: 700;
    color: $accent;
    letter-spacing: 1px;
  }

  // 子分类
  .sub-category {
    display: flex;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    overflow: hidden;

    .sub-category-left {
      flex: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: rgba(6, 182, 212, 0.08);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      padding: 20px 15px;
    }

    .sub-category-title {
      font-size: 14px;
      font-weight: 600;
      color: $accent;
      text-align: center;
      line-height: 1.5;
    }

    .add-person-btn {
      margin-top: 5px;
    }

    .sub-category-right {
      flex: 6;
      padding: 20px;
      min-width: 0;
    }

    // 人员区块
    .person-block {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);

      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
    }

    .person-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding: 8px 12px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 6px;
    }

    .person-label {
      font-size: 13px;
      font-weight: 600;
      color: $primary;
    }
  }

  // 字段表单
  .field-form {
    padding: 0 10px;
  }

  // 自定义单选按钮
  .radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;

    .radio-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #e2e8f0;
      font-size: 14px;
      padding: 4px 0;

      .radio-circle {
        width: 14px;
        height: 14px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        position: relative;
        transition: all 0.2s;

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          transition: transform 0.2s;
        }
      }

      &:hover .radio-circle {
        border-color: #3b82f6;
      }

      &.active {
        color: #3b82f6;

        .radio-circle {
          border-color: #3b82f6;

          &::after {
            transform: translate(-50%, -50%) scale(1);
          }
        }
      }
    }
  }
}
</style>


<style lang="scss">
// 滚动条样式
.dynamic-form {
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3b82f6, #06b6d4);
    border-radius: 4px;

    &:hover {
      background: linear-gradient(180deg, #60a5fa, #22d3ee);
    }
  }
}

// Element Plus Collapse 样式覆盖（全局）
.dynamic-form {
  .el-collapse {
    border: none;
    --el-collapse-header-bg-color: transparent;
    --el-collapse-content-bg-color: transparent;
  }

  .el-collapse-item__header {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 0 15px;
    height: 48px;
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    &.is-active {
      border-color: rgba(6, 182, 212, 0.3);
      background: rgba(6, 182, 212, 0.05);
    }
  }

  .el-collapse-item__wrap {
    background: transparent;
    border: none;
  }

  .el-collapse-item__content {
    padding: 15px 10px;
    color: #e2e8f0;
  }

  .el-collapse-item__arrow {
    color: #94a3b8;
  }

  // 表单样式
  .el-form-item__label {
    color: #ffffff !important;
    font-weight: 500;
    font-size: 13px;
    line-height: 1.5;
    white-space: normal;
    word-break: break-word;
  }

  .el-input__wrapper {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: none !important;
  }

  .el-input__inner {
    color: #ffffff !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  .el-input__wrapper.is-focus {
    border-color: #3b82f6 !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
  }

  .el-checkbox,
  .el-radio {
    color: #e2e8f0;
    margin-right: 15px;
    margin-bottom: 8px;

    .el-checkbox__label,
    .el-radio__label {
      color: #e2e8f0;
    }

    .el-checkbox__inner,
    .el-radio__inner {
      background: transparent;
      border-color: rgba(255, 255, 255, 0.4);
    }

    &.is-checked {

      .el-checkbox__inner,
      .el-radio__inner {
        background: #3b82f6;
        border-color: #3b82f6;
      }

      .el-checkbox__label,
      .el-radio__label {
        color: #3b82f6;
      }
    }
  }

  .el-date-editor {
    --el-input-bg-color: rgba(255, 255, 255, 0.05);
    --el-input-border-color: rgba(255, 255, 255, 0.15);
    --el-input-text-color: #ffffff;
  }

  .el-input-number {
    .el-input__wrapper {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
  }
}
  // 按钮美化
  .add-person-btn {
    background: rgba(6, 182, 212, 0.1) !important;
    border: 1px solid rgba(6, 182, 212, 0.5) !important;
    color: #06b6d4 !important;
    transition: all 0.3s;
    
    &:hover {
      background: rgba(6, 182, 212, 0.2) !important;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.3) !important;
      border-color: #06b6d4 !important;
      color: #fff !important;
      transform: translateY(-1px);
    }
  }

  .delete-person-btn {
    background: rgba(239, 68, 68, 0.1) !important;
    border: 1px solid rgba(239, 68, 68, 0.5) !important;
    color: #ef4444 !important;
    transition: all 0.3s;

    &:hover {
      background: rgba(239, 68, 68, 0.2) !important;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.3) !important;
      border-color: #ef4444 !important;
      color: #fff !important;
      transform: translateY(-1px);
    }
  }
</style>
