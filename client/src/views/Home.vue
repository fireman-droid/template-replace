<template>
  <div class="legal-tech-container">
    <div class="cyber-bg">
      <div class="grid-floor"></div>
      <div class="data-stream"></div>
    </div>

    <nav class="navbar">
      <div class="brand">
        <div class="logo-hexagon"><el-icon><ScaleToOriginal /></el-icon></div>
        <div class="brand-info"><span class="brand-name">FastReplace <span class="tag">AI.LAW</span></span></div>
      </div>
      
      <div class="user-zone">
        <button 
          v-if="authStore.isAdmin" 
          class="btn-cyber small admin-entry-btn" 
          @click="handleAdminEntry"
        >
          <el-icon><DataBoard /></el-icon> 管理控制台
        </button>

        <div class="status-indicator"><span class="dot"></span> 引擎就绪</div>
        
        <el-dropdown trigger="click" popper-class="legal-dropdown-popper">
          <div class="user-pill">
            <el-avatar :size="32" class="avatar-glow">{{ authStore.username.charAt(0).toUpperCase() }}</el-avatar>
            <span class="username">{{ authStore.username }}</span>
            <el-icon class="arrow-icon"><CaretBottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
                            <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>

    <main class="main-stage">
      <section class="hero-box">
        <div class="hero-text-group">
          <div class="glitch-badge">LEGAL INTELLIGENCE</div>
          <h1 class="hero-title">法律文书，<br /><span class="typing-effect">模板一键填充</span></h1>
          <p class="hero-desc">智能解析案情要素，一键生成严谨法律文件。<br />支持离婚纠纷、房屋买卖、借贷纠纷等多种场景。</p>
          <div class="cta-group">
            <button class="btn-cyber primary" @click="router.push('/template/select')">
              <span class="btn-content"><el-icon><Plus /></el-icon> 开始起草新案</span>
              <div class="glitch-layer"></div>
            </button>
          </div>
        </div>
        
        <div class="hologram-visual">
          <div class="holo-circle c1"></div>
          <div class="holo-circle c2"></div>
          <div class="holo-circle c3"></div>
          <div class="scanner-line"></div>
          <div class="doc-stack">
            <div class="doc-card doc-main">
              <div class="doc-header">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <div class="doc-content">
                <div class="line l-80"></div>
                <div class="line l-60"></div>
                <div class="line l-90 highlight"></div>
                <div class="line l-40"></div>
              </div>
              <div class="analysis-text">ANALYZING...</div>
            </div>
            <div class="doc-card doc-back"></div>
          </div>
        </div>
      </section>

      <section class="my-projects-section">
        <div class="section-title">
          <h3><el-icon><FolderOpened /></el-icon> 我的案卷库</h3>
          <div class="search-pill">
            <el-icon><Search /></el-icon>
            <input placeholder="检索案卷号" v-model="searchQuery" />
          </div>
        </div>

        <div class="cards-container">
          <div 
            v-for="(item, index) in myProjects" 
            :key="item.id" 
            class="legal-card"
            @click="goToProject(item)"
          >
            <div class="card-glow-border"></div>
            <div class="card-content">
              <div class="card-top">
                <div class="file-type-icon">
                  <el-icon><Document /></el-icon>
                </div>
                
                <div class="card-actions">
                  <el-tag :type="item.statusType" effect="dark" size="small" class="status-tag">{{ item.status }}</el-tag>
                  <div class="delete-btn" @click.stop="handleDelete(item)">
                    <el-icon><Delete /></el-icon>
                  </div>
                </div>
              </div>
              
              <h4 class="project-title">{{ item.title }}</h4>
              <div class="meta-info">
                <!-- <p><el-icon><User /></el-icon> 当事人：{{ item.client }}</p> -->
                <p><el-icon><Timer /></el-icon> {{ item.time }}</p>
              </div>
              <div class="hover-arrow"><el-icon><Right /></el-icon></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ScaleToOriginal, CaretBottom, Plus, Search, FolderOpened, 
  User, Timer, Right, House, ChatDotSquare, Money, Delete,
  DataBoard, Document, SwitchButton
} from '@element-plus/icons-vue'
import { getCaseList, deleteCase } from '@/api'

const router = useRouter()
const authStore = useAuthStore()
const searchQuery = ref('')
const myProjects = ref([])
const loading = ref(false)

// 状态映射
const statusMap = {
  draft: { label: '草稿', type: 'info' },
  completed: { label: '定稿', type: 'success' },
  archived: { label: '已归档', type: 'warning' }
}

// 图标映射（使用 markRaw 避免响应式警告）
const iconMap = {
  divorce: markRaw(ChatDotSquare),
  sales: markRaw(Money),
  house: markRaw(House),
  default: markRaw(ChatDotSquare)
}

// 获取案卷列表
const fetchCases = async () => {
  try {
    loading.value = true
    const data = await getCaseList({
      page: 1,
      pageSize: 20,
      keyword: searchQuery.value
    })
    
    // 转换数据格式
    myProjects.value = data.list.map(item => {
      // 根据分类获取图标
      const category = item.category || 'default'
      return {
        id: item.id,
        title: item.title,
        client: item.form_data?.husband_name || item.form_data?.buyer || item.form_data?.landlord || '未填写',
        type: category,
        status: statusMap[item.status]?.label || '草稿',
        statusType: statusMap[item.status]?.type || 'info',
        time: formatTime(item.updated_at),
        icon: iconMap[category] || iconMap.default
      }
    })
  } catch (error) {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false
  }
}

// 格式化时间
const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 搜索防抖
let searchTimer = null
watch(searchQuery, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchCases()
  }, 500)
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const handleAdminEntry = () => {
  router.push('/admin')
}

const goToProject = (project) => {
  router.push({ path: '/project/edit', query: { id: project.id } })
}

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除案卷 "${item.title}" 吗？此操作无法撤销。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      lockScroll: false,
        lockScroll: false
      }
    )
    
    await deleteCase(item.id)
    ElMessage.success('案卷已安全移除')
    fetchCases()
  } catch (error) {
    // 用户取消或错误已在拦截器中处理
  }
}

// 页面加载时获取案卷列表
onMounted(() => {
  fetchCases()
})
</script>

<style lang="scss" scoped>
$bg-deep: #050b14;
$bg-card: #0f172a;
$primary: #3b82f6;
$accent: #06b6d4;
$text-main: #f8fafc;
$text-sub: #94a3b8;
$danger: #ef4444;

.legal-tech-container {
  min-height: 100vh;
  background-color: $bg-deep;
  color: $text-main;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

// 动态背景
.cyber-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 0%, rgba($primary, 0.15), transparent 60%);

  .grid-floor {
    position: absolute;
    bottom: -30%;
    left: -50%;
    width: 200%;
    height: 100%;
    background-image: 
      linear-gradient(rgba($primary, 0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba($primary, 0.2) 1px, transparent 1px);
    background-size: 50px 50px;
    transform: perspective(600px) rotateX(60deg);
    mask-image: linear-gradient(to top, black, transparent 80%);
    animation: grid-move 20s linear infinite;
  }

  .data-stream {
    position: absolute;
    inset: 0;
    opacity: 0.3;
    background: repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 50px,
      rgba($accent, 0.1) 50px,
      rgba($accent, 0.1) 51px
    );
    mask-image: radial-gradient(circle at 50% 50%, black, transparent);
  }
}

@keyframes grid-move {
  0% { transform: perspective(600px) rotateX(60deg) translateY(0); }
  100% { transform: perspective(600px) rotateX(60deg) translateY(50px); }
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  height: 70px;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba($bg-deep, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba($primary, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);

  .brand {
    display: flex;
    gap: 12px;
    align-items: center;
    .logo-hexagon { color: #fff; font-size: 24px; filter: drop-shadow(0 0 8px $primary); }
    .brand-name { 
      font-size: 22px; 
      font-weight: 700; 
      .tag { 
        font-size: 10px; 
        color: $bg-deep;
        background: $accent;
        padding: 2px 6px; 
        border-radius: 4px; 
        margin-left: 8px; 
        font-weight: 800;
        letter-spacing: 1px;
      } 
    }
  }
  
  .user-zone { 
    display: flex; 
    gap: 20px; 
    align-items: center; 
    .status-indicator { 
      color: $accent; 
      font-size: 12px; 
      display: flex;
      align-items: center;
      gap: 6px;
      .dot {
        width: 8px; height: 8px; background: $accent; border-radius: 50%;
        box-shadow: 0 0 8px $accent;
        animation: pulse 2s infinite;
      }
    } 
    .user-pill { 
      display: flex; gap: 10px; align-items: center; padding: 4px 12px 4px 4px; 
      border: 1px solid transparent;
      border-radius: 30px; cursor: pointer; transition: all 0.3s;
      
      .avatar-glow {
        background: $primary;
        color: white;
        border: 2px solid rgba($bg-deep, 0.5);
        box-shadow: 0 0 10px rgba($primary, 0.3);
        transition: all 0.3s;
      }

      .username {
        font-size: 14px;
        font-weight: 500;
        color: $text-sub;
        transition: color 0.3s;
      }

      .arrow-icon { color: $text-sub; transition: 0.3s; }

      &:hover { 
        background: rgba($primary, 0.1); 
        border-color: rgba($primary, 0.2);
        
        .avatar-glow { transform: scale(1.05); box-shadow: 0 0 15px rgba($primary, 0.5); }
        .username { color: $text-main; }
        .arrow-icon { color: $text-main; transform: rotate(180deg); }
      }
    } 
  }
}

.main-stage { max-width: 1280px; margin: 0 auto; padding: 80px 20px; z-index: 1; position: relative; }

// --- Hero Section 升级 ---
.hero-box {
  display: flex;
  align-items: center;
  margin-bottom: 100px;
  position: relative;

  .hero-text-group {
    flex: 1.2;
    z-index: 2;

    .glitch-badge {
      display: inline-block;
      color: $accent;
      font-family: monospace;
      font-size: 14px;
      letter-spacing: 2px;
      margin-bottom: 16px;
      position: relative;
      text-shadow: 0 0 5px rgba($accent, 0.5);
      &::before {
        content: ''; position: absolute; left: -15px; top: 50%; width: 8px; height: 2px; background: $accent;
      }
    }

    .hero-title {
      font-size: 64px;
      font-weight: 800;
      line-height: 1.1;
      margin: 10px 0 30px;
      
      .typing-effect {
        display: inline-block;
        background: linear-gradient(90deg, #fff, $primary, $accent, #fff);
        background-size: 300% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer-text 5s linear infinite;
        position: relative;
      }
    }

    .hero-desc {
      color: $text-sub;
      font-size: 18px;
      margin-bottom: 50px;
      max-width: 600px;
      line-height: 1.6;
      border-left: 1px solid rgba($text-sub, 0.3);
      padding-left: 20px;
    }

    .cta-group {
      .btn-cyber {
        position: relative;
        padding: 16px 40px;
        background: transparent;
        color: $accent;
        border: 1px solid rgba($accent, 0.5);
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        overflow: hidden;
        transition: 0.3s;
        box-shadow: 0 0 20px rgba($accent, 0.1);
        
        .btn-content { position: relative; z-index: 2; display: flex; align-items: center; gap: 8px; }

        &::before {
          content: '';
          position: absolute; inset: 0;
          background: rgba($accent, 0.1);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        &:hover {
          color: #fff;
          box-shadow: 0 0 30px rgba($accent, 0.3);
          border-color: $accent;
          &::before { transform: scaleX(1); }
        }
      }
    }
  }

  // 全CSS全息图
  .hologram-visual {
    flex: 0.8;
    height: 400px;
    position: relative;
    perspective: 1000px;
    
    // 全息圆环
    .holo-circle {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) rotateX(60deg);
      border-radius: 50%;
      border: 1px solid rgba($primary, 0.3);
      box-shadow: 0 0 15px rgba($primary, 0.1);
      
      &.c1 { width: 300px; height: 300px; animation: spin-cw 10s linear infinite; border-bottom-color: transparent; }
      &.c2 { width: 240px; height: 240px; animation: spin-ccw 15s linear infinite; border-left-color: transparent; border-color: rgba($accent, 0.3); }
      &.c3 { width: 180px; height: 180px; animation: spin-cw 8s linear infinite; border-style: dashed; opacity: 0.5; }
    }

    // 扫描线
    .scanner-line {
      position: absolute;
      width: 100%;
      height: 2px;
      top: 10%;
      background: linear-gradient(90deg, transparent, $accent, transparent);
      box-shadow: 0 0 15px $accent;
      opacity: 0.7;
      animation: scan-vertical 3s ease-in-out infinite alternate;
      z-index: 10;
    }

    // 悬浮文件堆叠
    .doc-stack {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 280px;
      transform-style: preserve-3d;
      animation: float-doc 4s ease-in-out infinite;

      .doc-card {
        position: absolute;
        inset: 0;
        background: rgba($bg-card, 0.8);
        border: 1px solid rgba($primary, 0.4);
        backdrop-filter: blur(5px);
        border-radius: 8px;
        padding: 20px;
        
        &.doc-main {
          z-index: 2;
          transform: translateZ(20px);
          box-shadow: 0 0 30px rgba(0,0,0,0.5);
          display: flex; flex-direction: column;

          .doc-header {
            display: flex; gap: 6px; margin-bottom: 20px;
            .dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.7; }
            .red { background: #ff5f56; }
            .yellow { background: #ffbd2e; }
            .green { background: #27c93f; }
          }
          .doc-content {
            flex: 1;
            .line { height: 6px; background: rgba($text-sub, 0.2); margin-bottom: 12px; border-radius: 2px; }
            .l-80 { width: 80%; }
            .l-60 { width: 60%; }
            .l-90 { width: 90%; }
            .l-40 { width: 40%; }
            .highlight { background: rgba($primary, 0.4); box-shadow: 0 0 10px rgba($primary, 0.2); }
          }
          .analysis-text {
            color: $accent; font-size: 10px; font-family: monospace; text-align: right;
            animation: blink 1s infinite;
          }
        }

        &.doc-back {
          transform: translateZ(-10px) translateX(15px) rotateY(-5deg);
          background: rgba($bg-card, 0.4);
          z-index: 1;
        }
      }
    }
  }
}

// 按钮动画
.btn-cyber {
  padding: 12px 24px;
  background: $primary;
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
  transition: all 0.3s;

  &:hover {
    filter: brightness(1.2);
  }

  &.small {
    padding: 6px 16px;
    font-size: 13px;
  }
}

.admin-entry-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba($accent, 0.3);
  color: $accent;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  box-shadow: 0 0 10px rgba($accent, 0.05);
  
  &:hover {
    background: rgba($accent, 0.1);
    border-color: $accent;
    box-shadow: 0 0 15px rgba($accent, 0.2);
    transform: translateY(-1px);
    color: lighten($accent, 10%);
  }

  &:active {
    transform: translateY(0);
  }
}

// 动画定义
@keyframes spin-cw { from { transform: translate(-50%, -50%) rotateX(60deg) rotate(0deg); } to { transform: translate(-50%, -50%) rotateX(60deg) rotate(360deg); } }
@keyframes spin-ccw { from { transform: translate(-50%, -50%) rotateX(60deg) rotate(0deg); } to { transform: translate(-50%, -50%) rotateX(60deg) rotate(-360deg); } }
@keyframes shimmer-text { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
@keyframes scan-vertical { 0% { top: 10%; opacity: 0; } 50% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
@keyframes float-doc { 0%, 100% { transform: translate(-50%, -50%) translateY(0); } 50% { transform: translate(-50%, -50%) translateY(-15px); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes pulse { 0% { opacity: 0.5; box-shadow: 0 0 0 0 rgba($accent, 0.4); } 70% { opacity: 1; box-shadow: 0 0 0 5px rgba($accent, 0); } 100% { opacity: 0.5; box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
@keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

// --- My Projects 列表 (保持原有布局但增加一点质感) ---
.my-projects-section {
  .section-title {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;
    h3 { font-size: 24px; color: $text-main; display: flex; align-items: center; gap: 10px; }
    .search-pill { 
      background: rgba(255,255,255,0.03); 
      border: 1px solid rgba(255,255,255,0.1);
      padding: 8px 16px; 
      border-radius: 20px; 
      display: flex; 
      width: 300px;
      transition: all 0.3s;
      &:focus-within { border-color: $primary; box-shadow: 0 0 10px rgba($primary, 0.2); background: rgba(0,0,0,0.3); }
      input { background: transparent; border: none; outline: none; color: white; margin-left: 8px; width: 100%; }
    }
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .legal-card {
    background: linear-gradient(145deg, rgba($bg-card, 0.9), rgba($bg-card, 0.6));
    backdrop-filter: blur(10px);
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.05);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    overflow: hidden;
    
    // 发光边框效果
    &::before {
      content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
      background: linear-gradient(90deg, transparent, $primary, transparent);
      opacity: 0; transition: 0.3s;
    }

    .card-content { padding: 24px; position: relative; z-index: 2; }

    .card-top {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
      .file-type-icon { 
        font-size: 24px; color: $primary; 
        background: rgba($primary, 0.1); 
        padding: 10px; border-radius: 10px; 
        transition: 0.3s;
      }
      .card-actions {
        display: flex; align-items: center; gap: 10px;
        .delete-btn { color: #64748b; padding: 4px; border-radius: 4px; opacity: 0; transform: translateX(10px); transition: all 0.3s ease; &:hover { background: rgba($danger, 0.1); color: $danger; } }
      }
    }

    .project-title { font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: $text-main; }
    .meta-info { 
      p { margin: 0 0 8px; font-size: 13px; color: $text-sub; display: flex; align-items: center; gap: 8px; } 
    }
    .hover-arrow { position: absolute; bottom: 24px; right: 24px; opacity: 0; transform: translateX(-10px); transition: 0.3s; color: $accent; }

    &:hover {
      transform: translateY(-8px); 
      border-color: rgba($primary, 0.4);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      &::before { opacity: 1; }
      .file-type-icon { background: $primary; color: white; transform: rotate(-10deg); }
      .hover-arrow { opacity: 1; transform: translateX(0); }
      .card-actions .delete-btn { opacity: 1; transform: translateX(0); }
    }
  }
}
</style>

<style>
/* 覆盖全局滚动条样式，使其与深色背景融合 */
::-webkit-scrollbar-track {
  background: #050b14 !important; /* 强制使用深色背景 */
}
</style>
