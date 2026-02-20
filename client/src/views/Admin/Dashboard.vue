<template>
  <div class="dashboard" v-loading="loading">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card" v-for="card in statCards" :key="card.label">
        <div class="stat-icon" :style="{ background: card.color }">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-label">{{ card.label }}</span>
        </div>
        <span v-if="card.sub" class="stat-sub">{{ card.sub }}</span>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <div class="chart-panel wide">
        <h3 class="panel-title">近 7 天案卷创建趋势</h3>
        <div ref="caseTrendRef" class="chart-box"></div>
      </div>
      <div class="chart-panel narrow">
        <h3 class="panel-title">操作类型分布</h3>
        <div ref="actionPieRef" class="chart-box"></div>
      </div>
    </div>

    <div class="chart-row">
      <div class="chart-panel wide">
        <h3 class="panel-title">近 7 天操作日志趋势</h3>
        <div ref="logTrendRef" class="chart-box"></div>
      </div>
      <div class="chart-panel narrow">
        <h3 class="panel-title">模板使用排行</h3>
        <div ref="templateRankRef" class="chart-box"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { User, Files, Document, Monitor } from '@element-plus/icons-vue'
import { getDashboardStats } from '@/api/admin'
import * as echarts from 'echarts'

const loading = ref(true)
const stats = ref(null)

// 图表 DOM 引用
const caseTrendRef = ref(null)
const logTrendRef = ref(null)
const actionPieRef = ref(null)
const templateRankRef = ref(null)

// 图表实例
let charts = []

const statCards = computed(() => {
  const s = stats.value?.summary
  if (!s) return []
  return [
    { label: '用户总数', value: s.userCount, icon: markRaw(User), color: 'rgba(59,130,246,0.2)', sub: `近 7 天 +${s.newUserCount}` },
    { label: '模板数量', value: s.templateCount, icon: markRaw(Files), color: 'rgba(16,185,129,0.2)' },
    { label: '案卷总数', value: s.caseCount, icon: markRaw(Document), color: 'rgba(245,158,11,0.2)' },
    { label: '操作日志', value: s.logCount, icon: markRaw(Monitor), color: 'rgba(239,68,68,0.2)' }
  ]
})

// 通用暗色主题配置
const darkAxis = {
  axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
  axisTick: { show: false },
  axisLabel: { color: '#94a3b8', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
}

function initCharts() {
  if (!stats.value) return

  const hasData = stats.value.caseTrend?.length > 0

  // 案卷趋势 - 面积折线图
  const caseTrendChart = echarts.init(caseTrendRef.value)
  caseTrendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}<br/>{a}: {c} 个'
    },
    grid: { top: 10, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: hasData ? stats.value.caseTrend.map(d => d.date.slice(5)) : [],
      ...darkAxis
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      name: '数量',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      ...darkAxis
    },
    series: [{
      name: '案卷数',
      type: 'line',
      data: hasData ? stats.value.caseTrend.map(d => d.count) : [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(59,130,246,0.3)' },
        { offset: 1, color: 'rgba(59,130,246,0.02)' }
      ])}
    }],
    graphic: !hasData ? [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '暂无数据',
        fontSize: 14,
        fill: '#94a3b8'
      }
    }] : []
  })
  charts.push(caseTrendChart)

  // 操作日志趋势
  const logTrendChart = echarts.init(logTrendRef.value)
  const hasLogData = stats.value.logTrend?.length > 0
  logTrendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}<br/>{a}: {c} 条'
    },
    grid: { top: 10, right: 20, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: hasLogData ? stats.value.logTrend.map(d => d.date.slice(5)) : [],
      ...darkAxis
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      name: '数量',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      ...darkAxis
    },
    series: [{
      name: '操作日志',
      type: 'line',
      data: hasLogData ? stats.value.logTrend.map(d => d.count) : [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(16,185,129,0.3)' },
        { offset: 1, color: 'rgba(16,185,129,0.02)' }
      ])}
    }],
    graphic: !hasLogData ? [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '暂无数据',
        fontSize: 14,
        fill: '#94a3b8'
      }
    }] : []
  })
  charts.push(logTrendChart)

  // 操作类型饼图
  const actionPieChart = echarts.init(actionPieRef.value)
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const hasActionData = stats.value.actionStats?.length > 0
  actionPieChart.setOption({
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}: {c} 次 ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: hasActionData ? stats.value.actionStats.map((d, i) => ({
        name: d.name,
        value: d.count,
        itemStyle: { color: pieColors[i % pieColors.length] }
      })) : [],
      label: { color: '#94a3b8', fontSize: 11 },
      emphasis: { label: { fontWeight: 'bold', color: '#f8fafc' } }
    }],
    graphic: !hasActionData ? [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '暂无数据',
        fontSize: 14,
        fill: '#94a3b8'
      }
    }] : []
  })
  charts.push(actionPieChart)

  // 模板使用排行 - 横向柱状图
  const templateRankChart = echarts.init(templateRankRef.value)
  const hasRankData = stats.value.templateRank?.length > 0
  const rankData = hasRankData ? [...stats.value.templateRank].reverse() : []
  templateRankChart.setOption({
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#f8fafc' },
      formatter: '{b}: {c} 次'
    },
    grid: { top: 20, right: 60, bottom: 20, left: 80, containLabel: false },
    xAxis: {
      type: 'value',
      minInterval: 1,
      name: '使用次数',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      nameGap: 10,
      ...darkAxis
    },
    yAxis: {
      type: 'category',
      data: rankData.map(d => d.name),
      axisLabel: {
        color: '#94a3b8',
        fontSize: 12,
        width: 70,
        overflow: 'truncate',
        ellipsis: '...'
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisTick: { show: false }
    },
    series: [{
      name: '使用次数',
      type: 'bar',
      data: rankData.map(d => d.count),
      barWidth: 16,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#8b5cf6' }
        ])
      },
      label: {
        show: true,
        position: 'right',
        color: '#94a3b8',
        fontSize: 11,
        formatter: '{c}'
      }
    }],
    graphic: !hasRankData ? [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: '暂无数据',
        fontSize: 14,
        fill: '#94a3b8'
      }
    }] : []
  })
  charts.push(templateRankChart)
}

function handleResize() {
  charts.forEach(c => c.resize())
}

onMounted(async () => {
  try {
    stats.value = await getDashboardStats()
  } catch (e) {
    console.error('加载仪表盘数据失败:', e)
  } finally {
    loading.value = false
  }
  await nextTick()
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>

<style lang="scss" scoped>
$primary: #3b82f6;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$border: rgba(255,255,255,0.08);
$panel-bg: rgba(15, 23, 42, 0.5);

.dashboard {
  min-height: 100%;
}

// 顶部统计卡片
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: $panel-bg;
  border: 1px solid $border;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  transition: border-color 0.3s;

  &:hover { border-color: rgba($primary, 0.3); }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-main;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    .stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
    .stat-label { font-size: 13px; color: $text-sub; margin-top: 2px; }
  }

  .stat-sub {
    position: absolute;
    top: 12px;
    right: 16px;
    font-size: 11px;
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

// 图表行
.chart-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-panel {
  background: $panel-bg;
  border: 1px solid $border;
  border-radius: 12px;
  padding: 20px;

  &.wide { flex: 3; }
  &.narrow { flex: 2; }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-sub;
    margin: 0 0 16px 0;
  }

  .chart-box {
    width: 100%;
    height: 260px;
  }
}

// 响应式
@media (max-width: 1200px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .chart-row { flex-direction: column; }
}
</style>