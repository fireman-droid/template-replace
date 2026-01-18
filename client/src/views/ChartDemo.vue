<template>
  <div class="chart-demo-page">
    <h1>📊 ECharts 示例图表</h1>
    
    <!-- 折线图示例 -->
    <div class="chart-section">
      <h2>📈 折线图</h2>
      <BaseChart 
        :option="lineChartOption" 
        height="350px"
        @chart-click="handleChartClick"
      />
    </div>

    <!-- 柱状图示例 -->
    <div class="chart-section">
      <h2>📊 柱状图</h2>
      <BaseChart 
        :option="barChartOption" 
        height="350px"
      />
    </div>

    <!-- 饼图示例 -->
    <div class="chart-section">
      <h2>🥧 饼图</h2>
      <BaseChart 
        :option="pieChartOption" 
        height="400px"
      />
    </div>

    <!-- 组合图示例 -->
    <div class="chart-section">
      <h2>📉 组合图（折线+柱状）</h2>
      <BaseChart 
        :option="mixedChartOption" 
        height="400px"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseChart from '@/components/BaseChart.vue'
import {
  defaultOption,
  defaultXAxis,
  defaultYAxis,
  colorPalettes,
  lineSeriesConfig,
  barSeriesConfig,
  pieSeriesConfig,
  createBarGradient
} from '@/config/echarts.config.js'

// 模拟数据
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const salesData = [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1200, 1100, 1350, 1500]
const visitData = [620, 732, 701, 834, 990, 1030, 920, 1150, 1000, 900, 1050, 1200]

// =====================
// 折线图配置
// =====================
const lineChartOption = computed(() => ({
  ...defaultOption,
  title: {
    ...defaultOption.title,
    text: '月度数据趋势',
    subtext: '2024年度统计'
  },
  color: colorPalettes.gradient,
  xAxis: {
    ...defaultXAxis,
    data: months
  },
  yAxis: {
    ...defaultYAxis,
    name: '数量'
  },
  series: [
    {
      ...lineSeriesConfig,
      name: '销售额',
      data: salesData,
      areaStyle: {
        opacity: 0.3
      }
    },
    {
      ...lineSeriesConfig,
      name: '访问量',
      data: visitData,
      areaStyle: {
        opacity: 0.3
      }
    }
  ]
}))

// =====================
// 柱状图配置
// =====================
const barChartOption = computed(() => ({
  ...defaultOption,
  title: {
    ...defaultOption.title,
    text: '各部门业绩对比'
  },
  color: colorPalettes.business,
  xAxis: {
    ...defaultXAxis,
    data: ['研发部', '市场部', '销售部', '运营部', '人事部', '财务部']
  },
  yAxis: {
    ...defaultYAxis,
    name: '万元'
  },
  series: [
    {
      ...barSeriesConfig,
      name: 'Q1业绩',
      data: [320, 280, 450, 180, 120, 200]
    },
    {
      ...barSeriesConfig,
      name: 'Q2业绩',
      data: [380, 320, 520, 220, 140, 250]
    }
  ]
}))

// =====================
// 饼图配置
// =====================
const pieChartOption = computed(() => ({
  ...defaultOption,
  title: {
    ...defaultOption.title,
    text: '销售渠道占比'
  },
  color: colorPalettes.tech,
  tooltip: {
    ...defaultOption.tooltip,
    trigger: 'item'
  },
  series: [
    {
      ...pieSeriesConfig,
      name: '销售渠道',
      data: [
        { value: 1048, name: '线上商城' },
        { value: 735, name: '线下门店' },
        { value: 580, name: '代理商' },
        { value: 484, name: '企业客户' },
        { value: 300, name: '其他' }
      ]
    }
  ]
}))

// =====================
// 混合图配置
// =====================
const mixedChartOption = computed(() => ({
  ...defaultOption,
  title: {
    ...defaultOption.title,
    text: '销售与增长率分析'
  },
  color: ['#5470c6', '#91cc75', '#ee6666'],
  legend: {
    ...defaultOption.legend,
    data: ['销售额', '成本', '增长率']
  },
  xAxis: {
    ...defaultXAxis,
    data: months
  },
  yAxis: [
    {
      ...defaultYAxis,
      name: '金额(万)',
      position: 'left'
    },
    {
      ...defaultYAxis,
      name: '增长率(%)',
      position: 'right',
      splitLine: { show: false }
    }
  ],
  series: [
    {
      ...barSeriesConfig,
      name: '销售额',
      yAxisIndex: 0,
      data: [120, 150, 180, 220, 250, 280, 300, 350, 320, 310, 380, 420],
      itemStyle: {
        color: createBarGradient('#667eea', '#764ba2')
      }
    },
    {
      ...barSeriesConfig,
      name: '成本',
      yAxisIndex: 0,
      data: [80, 100, 120, 150, 170, 190, 200, 230, 210, 200, 250, 280],
      itemStyle: {
        color: createBarGradient('#43e97b', '#38f9d7')
      }
    },
    {
      ...lineSeriesConfig,
      name: '增长率',
      yAxisIndex: 1,
      data: [15, 18, 22, 25, 20, 18, 15, 20, 25, 22, 28, 30],
      smooth: true
    }
  ]
}))

// 图表点击事件处理
const handleChartClick = (params) => {
  console.log('图表点击:', params)
  // 可以在这里处理点击事件，比如跳转、弹窗等
}
</script>

<style scoped>
.chart-demo-page {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.chart-demo-page h1 {
  text-align: center;
  color: #fff;
  font-size: 28px;
  margin-bottom: 32px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.chart-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.chart-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}
</style>
