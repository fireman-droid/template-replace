<template>
  <div class="select-container">
    <div class="cyber-dots"></div>
    <div class="scan-line"></div> <header class="fixed-header">
      <div class="header-inner">
        <div class="header-left">
          <button class="back-btn" @click="router.back()">
            <el-icon><Back /></el-icon> 
            <span>返回</span>
          </button>
          <div class="title-box">
            <h2>请选择起草模版</h2>
            <p class="subtitle">AI 引擎将根据模版类型加载对应的法律知识库</p>
          </div>
        </div>
        <div class="header-right">
          <span class="system-status"><span class="blink">●</span> SYSTEM READY</span>
        </div>
      </div>
      <div class="header-line"></div>
    </header>

    <div class="content-wrapper">
      <div class="template-grid">
        <div 
          v-for="tpl in templates" 
          :key="tpl.id" 
          class="template-card"
          @click="selectTemplate(tpl)"
        >
          <div class="holo-border"></div>
          <div class="card-corner top-left"></div>
          <div class="card-corner bottom-right"></div>

          <div class="icon-wrapper">
            <el-icon><component :is="tpl.icon" /></el-icon>
          </div>
          
          <div class="card-body">
            <h3>{{ tpl.name }}</h3>
            <p class="desc">{{ tpl.desc }}</p>
            
            <div class="divider"></div>
            
            <ul class="features">
              <li v-for="f in tpl.features" :key="f">
                <el-icon><Check /></el-icon> {{ f }}
              </li>
            </ul>
          </div>

          <div class="btn-select">
            <span>载入模版</span>
            <el-icon><Right /></el-icon>
          </div>
        </div>
        
        <div class="template-card placeholder-card" v-for="i in 2" :key="`p-${i}`">
          <div class="icon-wrapper disabled"><el-icon><Lock /></el-icon></div>
          <h3>待解锁模版</h3>
          <p class="desc">高级会员专属模版，包含股权激励与融资协议。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Back, Check, UserFilled, House, Money, Right, Lock } from '@element-plus/icons-vue'

const router = useRouter()

const templates = [
  {
    id: 'divorce',
    name: '离婚纠纷协议',
    icon: 'UserFilled',
    desc: '适用于双方自愿离婚，需处理子女抚养及财产分割。',
    features: ['抚养权判定', '房产分割', '债务处理']
  },
  {
    id: 'sales',
    name: '买卖合同纠纷',
    icon: 'Money',
    desc: '适用于动产/不动产交易违约、货款拖欠等商事纠纷。',
    features: ['违约金计算', '风险转移', '质量异议']
  },
  {
    id: 'house',
    name: '房屋租赁/纠纷',
    icon: 'House',
    desc: '适用于房屋租赁违约、押金退还、腾房等居住权纠纷。',
    features: ['装修折旧', '免租期条款', '优先购买权']
  }
]

const selectTemplate = (tpl) => {
  router.push({ path: '/project/edit', query: { type: tpl.id, isNew: 'true' } })
}
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$header-bg: rgba(15, 23, 42, 0.85);
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$card-bg: rgba(30, 41, 59, 0.4);

.select-container {
  min-height: 100vh;
  background: $bg-deep;
  color: $text-main;
  font-family: 'Inter', sans-serif;
  position: relative;
  // 移除垂直居中，让内容自然流动
  display: block; 
}

// 背景特效
.cyber-dots {
  position: fixed;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at 50% 0%, black 40%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.scan-line {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent, rgba($primary, 0.05), transparent);
  animation: scan 8s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

// --- 顶部固定头部 ---
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: $header-bg;
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba($primary, 0.1);
  padding: 0;
  
  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;

    .back-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: $text-sub;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        border-color: $primary;
        color: white;
        background: $primary;
      }
    }

    .title-box {
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .subtitle {
        margin: 4px 0 0;
        font-size: 12px;
        color: $text-sub;
      }
    }
  }

  .header-right {
    .system-status {
      font-size: 12px;
      font-family: monospace;
      color: $accent;
      background: rgba($accent, 0.1);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid rgba($accent, 0.2);
      
      .blink { animation: blink 1.5s infinite; }
    }
  }

  // 底部流光条
  .header-line {
    height: 1px;
    width: 100%;
    background: linear-gradient(90deg, transparent, $primary, $accent, transparent);
    opacity: 0.5;
  }
}

@keyframes blink { 50% { opacity: 0; } }

// --- 内容区域 ---
.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1400px; // 增加最大宽度以容纳5列
  margin: 0 auto;
  padding: 40px 30px;
}

// --- Grid 布局核心修改 ---
.template-grid {
  display: grid;
  // 关键修改：允许最小宽度为 220px，自动填充。
  // 在 1400px 宽屏下，(220+gap) * 5 大约需要 1300px 空间，刚好放下 5 个。
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.template-card {
  background: $card-bg;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 320px; // 统一高度

  // 角落装饰
  .card-corner {
    position: absolute;
    width: 10px;
    height: 10px;
    border: 2px solid rgba($accent, 0.5);
    transition: all 0.3s;
    opacity: 0;
    
    &.top-left { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 12px; }
    &.bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 12px; }
  }

  .icon-wrapper {
    width: 50px;
    height: 50px;
    background: rgba($primary, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: $primary;
    margin-bottom: 16px;
    transition: all 0.3s;
    
    &.disabled { background: rgba(255,255,255,0.05); color: #64748b; }
  }

  .card-body {
    flex: 1;
    h3 { margin: 0 0 8px; font-size: 18px; color: $text-main; }
    .desc { color: $text-sub; font-size: 13px; line-height: 1.5; margin: 0 0 16px; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    
    .divider { height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 16px; }
    
    .features {
      list-style: none;
      padding: 0;
      li {
        display: flex;
        align-items: center;
        gap: 8px;
        color: darken($text-sub, 5%);
        font-size: 12px;
        margin-bottom: 8px;
        .el-icon { color: darken($accent, 10%); }
      }
    }
  }

  .btn-select {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: $primary;
    opacity: 0.7;
    transition: all 0.3s;
    padding-top: 12px;
    border-top: 1px solid transparent;
  }

  // Hover 效果
  &:hover {
    transform: translateY(-5px);
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba($primary, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

    .card-corner { opacity: 1; width: 20px; height: 20px; border-color: $accent; }
    .icon-wrapper { background: $primary; color: white; transform: scale(1.1); box-shadow: 0 0 15px rgba($primary, 0.4); }
    
    .btn-select {
      opacity: 1;
      color: $accent;
      border-top-color: rgba(255,255,255,0.05);
      .el-icon { transform: translateX(4px); transition: transform 0.3s; }
    }
  }
}

// 占位卡片样式
.placeholder-card {
  opacity: 0.6;
  cursor: not-allowed;
  border-style: dashed;
  &:hover { transform: none; border-color: rgba(255,255,255,0.05); }
}
</style>