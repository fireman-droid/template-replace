/**
 * ECharts 基础配置文件
 * 包含通用配置、主题配置和常用工具函数
 */

// ============================================
// 1. 通用默认配置
// ============================================
export const defaultOption = {
  // 标题配置
  title: {
    show: true,
    text: '',
    subtext: '',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
    },
    subtextStyle: {
      fontSize: 12,
      color: '#999'
    }
  },
  
  // 提示框配置
  tooltip: {
    show: true,
    trigger: 'axis', // 'item' | 'axis' | 'none'
    axisPointer: {
      type: 'shadow' // 'line' | 'shadow' | 'cross'
    },
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderColor: 'transparent',
    textStyle: {
      color: '#fff',
      fontSize: 13
    },
    padding: [10, 15],
    // 自定义格式化（可选）
    // formatter: '{b}: {c}'
  },
  
  // 图例配置
  legend: {
    show: true,
    type: 'scroll', // 'plain' | 'scroll'
    orient: 'horizontal', // 'horizontal' | 'vertical'
    top: 'bottom',
    left: 'center',
    itemWidth: 14,
    itemHeight: 14,
    itemGap: 20,
    textStyle: {
      fontSize: 12,
      color: '#666'
    },
    // 图例图标形状
    icon: 'roundRect' // 'circle' | 'rect' | 'roundRect' | 'triangle' | 'diamond'
  },
  
  // 网格配置（用于直角坐标系）
  grid: {
    show: false,
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '15%',
    containLabel: true
  },
  
  // 工具栏配置
  toolbox: {
    show: false,
    orient: 'horizontal',
    right: 20,
    top: 10,
    feature: {
      saveAsImage: {
        title: '保存图片',
        type: 'png'
      },
      dataView: {
        title: '数据视图',
        readOnly: false
      },
      restore: {
        title: '重置'
      },
      dataZoom: {
        title: {
          zoom: '区域缩放',
          back: '还原'
        }
      },
      magicType: {
        type: ['line', 'bar'],
        title: {
          line: '切换为折线图',
          bar: '切换为柱状图'
        }
      }
    }
  },
  
  // 动画配置
  animation: true,
  animationDuration: 800,
  animationEasing: 'cubicInOut',
  animationDelay: 0
}

// ============================================
// 2. X轴默认配置
// ============================================
export const defaultXAxis = {
  type: 'category',
  boundaryGap: true,
  data: [],
  axisLine: {
    show: true,
    lineStyle: {
      color: '#E0E6F1',
      width: 1
    }
  },
  axisTick: {
    show: false
  },
  axisLabel: {
    show: true,
    fontSize: 12,
    color: '#666',
    rotate: 0, // 标签旋转角度
    interval: 'auto' // 标签显示间隔
  },
  splitLine: {
    show: false
  }
}

// ============================================
// 3. Y轴默认配置
// ============================================
export const defaultYAxis = {
  type: 'value',
  name: '',
  nameTextStyle: {
    fontSize: 12,
    color: '#666',
    padding: [0, 0, 0, 0]
  },
  axisLine: {
    show: false
  },
  axisTick: {
    show: false
  },
  axisLabel: {
    show: true,
    fontSize: 12,
    color: '#666'
  },
  splitLine: {
    show: true,
    lineStyle: {
      color: '#E0E6F1',
      type: 'dashed'
    }
  }
}

// ============================================
// 4. 颜色主题配置
// ============================================
export const colorPalettes = {
  // 默认配色
  default: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666',
    '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
  ],
  
  // 蓝色系
  blue: [
    '#0088FE', '#00C49F', '#00DFC4', '#52B5D8',
    '#7BC4E0', '#A4D3E8', '#CDDFF0', '#E6ECF8'
  ],
  
  // 渐变色
  gradient: [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
  ],
  
  // 商务风
  business: [
    '#2E5BFF', '#8C54FF', '#00C1D4', '#00E396',
    '#FEB019', '#FF4560', '#775DD0', '#546E7A'
  ],
  
  // 科技风
  tech: [
    '#00d4ff', '#7b2ff7', '#f107a3', '#ff8a00',
    '#00ff87', '#60efff', '#c850c0', '#ffcc70'
  ]
}

// ============================================
// 5. 常用系列配置
// ============================================

// 折线图系列
export const lineSeriesConfig = {
  type: 'line',
  smooth: true, // 平滑曲线
  showSymbol: true,
  symbol: 'circle',
  symbolSize: 6,
  lineStyle: {
    width: 2
  },
  emphasis: {
    focus: 'series'
  },
  // 区域填充
  areaStyle: null // 设置为 {} 启用渐变填充
}

// 柱状图系列
export const barSeriesConfig = {
  type: 'bar',
  barWidth: 'auto', // 可设置具体值如 '20px' 或百分比
  barMaxWidth: 50,
  barMinHeight: 0,
  itemStyle: {
    borderRadius: [4, 4, 0, 0] // 顶部圆角
  },
  emphasis: {
    focus: 'series'
  }
}

// 饼图系列
export const pieSeriesConfig = {
  type: 'pie',
  radius: ['40%', '70%'], // 环形图
  center: ['50%', '50%'],
  avoidLabelOverlap: true,
  itemStyle: {
    borderRadius: 8,
    borderColor: '#fff',
    borderWidth: 2
  },
  label: {
    show: true,
    formatter: '{b}: {d}%'
  },
  emphasis: {
    label: {
      show: true,
      fontSize: 16,
      fontWeight: 'bold'
    },
    itemStyle: {
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowColor: 'rgba(0, 0, 0, 0.3)'
    }
  }
}

// ============================================
// 6. 工具函数
// ============================================

/**
 * 合并配置项
 * @param {Object} customOption - 自定义配置
 * @returns {Object} 合并后的配置
 */
export const mergeOption = (customOption) => {
  return {
    ...defaultOption,
    ...customOption
  }
}

/**
 * 创建渐变色
 * @param {Array} colors - 颜色数组 [{offset: 0, color: '#xxx'}, ...]
 * @param {String} direction - 方向 'horizontal' | 'vertical'
 */
export const createGradient = (colors, direction = 'vertical') => {
  const isVertical = direction === 'vertical'
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: isVertical ? 0 : 1,
    y2: isVertical ? 1 : 0,
    colorStops: colors
  }
}

/**
 * 创建柱状图渐变色
 */
export const createBarGradient = (startColor, endColor) => {
  return createGradient([
    { offset: 0, color: startColor },
    { offset: 1, color: endColor }
  ])
}

/**
 * 创建面积图渐变填充
 */
export const createAreaGradient = (color, opacity = [0.8, 0.1]) => {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: color.replace(')', `, ${opacity[0]})`).replace('rgb', 'rgba') },
      { offset: 1, color: color.replace(')', `, ${opacity[1]})`).replace('rgb', 'rgba') }
    ]
  }
}

/**
 * 格式化大数字
 * @param {Number} value - 数值
 * @returns {String} 格式化后的字符串
 */
export const formatLargeNumber = (value) => {
  if (value >= 100000000) {
    return (value / 100000000).toFixed(2) + '亿'
  } else if (value >= 10000) {
    return (value / 10000).toFixed(2) + '万'
  }
  return value.toString()
}

/**
 * 创建雷达图指示器
 * @param {Array} names - 名称数组
 * @param {Number} max - 最大值
 */
export const createRadarIndicator = (names, max = 100) => {
  return names.map(name => ({
    name,
    max
  }))
}

// ============================================
// 7. 响应式配置
// ============================================
export const responsiveOption = {
  // 小屏幕（移动端）
  small: {
    grid: {
      left: '5%',
      right: '5%',
      bottom: '20%',
      top: '20%'
    },
    legend: {
      top: 'bottom',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 10
      }
    },
    xAxis: {
      axisLabel: {
        fontSize: 10,
        rotate: 45
      }
    }
  },
  // 中等屏幕（平板）
  medium: {
    grid: {
      left: '4%',
      right: '4%',
      bottom: '15%',
      top: '15%'
    }
  },
  // 大屏幕（桌面）
  large: {
    ...defaultOption
  }
}

/**
 * 根据屏幕宽度获取响应式配置
 * @param {Number} width - 屏幕宽度
 */
export const getResponsiveOption = (width) => {
  if (width < 768) {
    return responsiveOption.small
  } else if (width < 1200) {
    return responsiveOption.medium
  }
  return responsiveOption.large
}
