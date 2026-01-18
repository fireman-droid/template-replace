<template>
  <div ref="chartRef" :style="{ width: width, height: height }" class="base-chart"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  // 图表配置项
  option: {
    type: Object,
    required: true
  },
  // 宽度
  width: {
    type: String,
    default: '100%'
  },
  // 高度
  height: {
    type: String,
    default: '400px'
  },
  // 主题：'light' | 'dark' | 自定义主题名
  theme: {
    type: String,
    default: null
  },
  // 是否自动调整大小
  autoResize: {
    type: Boolean,
    default: true
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['chartClick', 'chartMouseover', 'chartMouseout', 'chartReady'])

const chartRef = ref(null)
// 使用 shallowRef 避免深度响应式，提升性能
const chartInstance = shallowRef(null)

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  
  // 销毁已存在的实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 创建新实例
  chartInstance.value = echarts.init(chartRef.value, props.theme)
  
  // 设置配置项
  chartInstance.value.setOption(props.option)
  
  // 绑定事件
  bindEvents()
  
  // 触发 ready 事件
  emit('chartReady', chartInstance.value)
}

// 绑定图表事件
const bindEvents = () => {
  if (!chartInstance.value) return
  
  chartInstance.value.on('click', (params) => {
    emit('chartClick', params)
  })
  
  chartInstance.value.on('mouseover', (params) => {
    emit('chartMouseover', params)
  })
  
  chartInstance.value.on('mouseout', (params) => {
    emit('chartMouseout', params)
  })
}

// 调整图表大小
const resize = () => {
  chartInstance.value?.resize()
}

// 显示加载动画
const showLoading = () => {
  chartInstance.value?.showLoading({
    text: '加载中...',
    color: '#409EFF',
    textColor: '#000',
    maskColor: 'rgba(255, 255, 255, 0.8)',
    zlevel: 0
  })
}

// 隐藏加载动画
const hideLoading = () => {
  chartInstance.value?.hideLoading()
}

// 监听配置变化
watch(
  () => props.option,
  (newOption) => {
    if (chartInstance.value && newOption) {
      chartInstance.value.setOption(newOption, { notMerge: false })
    }
  },
  { deep: true }
)

// 监听加载状态
watch(
  () => props.loading,
  (val) => {
    val ? showLoading() : hideLoading()
  }
)

// 监听主题变化
watch(
  () => props.theme,
  () => {
    initChart()
  }
)

// 监听窗口大小变化
let resizeObserver = null
onMounted(() => {
  initChart()
  
  if (props.autoResize) {
    // 使用 ResizeObserver 监听容器大小变化
    resizeObserver = new ResizeObserver(() => {
      resize()
    })
    resizeObserver.observe(chartRef.value)
    
    // 同时监听窗口 resize 事件
    window.addEventListener('resize', resize)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', resize)
  
  // 销毁图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  chartInstance,
  resize,
  showLoading,
  hideLoading
})
</script>

<style scoped>
.base-chart {
  min-height: 200px;
}
</style>
