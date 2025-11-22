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
              <el-dropdown-item divided icon="SwitchButton" @click="handleLogout">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>

    <main class="main-stage">
      <section class="hero-box">
        <div class="hero-text-group">
          <div class="glitch-badge">LEGAL INTELLIGENCE</div>
          <h1 class="hero-title">法律文书，<br /><span class="typing-effect">AI 毫秒级生成</span></h1>
          <p class="hero-desc">智能解析案情要素，一键生成严谨法律文件。<br />支持离婚纠纷、房屋买卖、借贷纠纷等多种场景。</p>
          <div class="cta-group">
            <button class="btn-cyber primary" @click="router.push('/template/select')">
              <span class="btn-content"><el-icon><Plus /></el-icon> 开始起草新案</span>
              <div class="glitch-layer"></div>
            </button>
          </div>
        </div>
        
        <div class="hologram-visual">
          <div class="scanner-line"></div>
          <div class="doc-stack">
            <div class="doc-card doc-1"><div class="doc-header">案件数据分析中...</div><div class="doc-lines"><span class="line l-100"></span><span class="line l-60 highlight"></span></div></div>
            <div class="tech-ring"></div>
          </div>
        </div>
      </section>

      <section class="my-projects-section">
        <div class="section-title">
          <h3><el-icon><FolderOpened /></el-icon> 我的案卷库</h3>
          <div class="search-pill">
            <el-icon><Search /></el-icon>
            <input placeholder="检索案卷号或当事人..." v-model="searchQuery" />
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
                  <el-icon><component :is="item.icon" /></el-icon>
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
                <p><el-icon><User /></el-icon> 当事人：{{ item.client }}</p>
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ScaleToOriginal, CaretBottom, Plus, Search, FolderOpened, 
  User, Timer, Right, House, ChatDotSquare, Money, Delete,
  DataBoard
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

// 图标映射（直接使用组件）
const iconMap = {
  divorce: ChatDotSquare,
  sales: Money,
  house: House,
  default: ChatDotSquare
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
}
.cyber-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; .grid-floor { position: absolute; bottom: -20%; width: 200%; height: 100%; background-image: linear-gradient(rgba($primary, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba($primary, 0.1) 1px, transparent 1px); background-size: 60px 60px; transform: perspective(500px) rotateX(60deg); mask-image: linear-gradient(to top, black, transparent 80%); } }
.navbar { position: sticky; top: 0; z-index: 100; height: 70px; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; background: rgba($bg-deep, 0.7); backdrop-filter: blur(12px); border-bottom: 1px solid rgba($primary, 0.2); .brand { display: flex; gap: 12px; align-items: center; .logo-hexagon { color: #fff; font-size: 20px; } .brand-name { font-size: 22px; font-weight: 700; .tag { font-size: 12px; color: $accent; border: 1px solid $accent; padding: 2px 6px; border-radius: 4px; margin-left: 8px; } } } .user-zone { display: flex; gap: 20px; align-items: center; .status-indicator { color: $accent; font-size: 12px; } .user-pill { display: flex; gap: 10px; align-items: center; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 30px; cursor: pointer; } } }
.main-stage { max-width: 1280px; margin: 0 auto; padding: 60px 20px; z-index: 1; position: relative; }
.hero-box { display: flex; margin-bottom: 80px; .hero-text-group { flex: 1; .glitch-badge { color: $accent; border-left: 2px solid $accent; padding-left: 10px; font-family: monospace; } .hero-title { font-size: 56px; font-weight: 800; margin: 20px 0; .typing-effect { background: linear-gradient(90deg, $text-main, $primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border-right: 4px solid $primary; } } .hero-desc { color: $text-sub; font-size: 18px; margin-bottom: 40px; } } .hologram-visual { width: 400px; position: relative; } }
.btn-cyber { padding: 14px 32px; background: $primary; color: white; border: none; font-weight: 600; clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%); cursor: pointer; &:hover { filter: brightness(1.2); } }

// 管理员入口按钮特别样式
.admin-entry-btn {
  background: linear-gradient(90deg, rgba($danger, 0.8), rgba($primary, 0.8)); 
  clip-path: none; // 取消切割角，使其更像功能按钮
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba($danger, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba($danger, 0.5);
  }
}

// --- My Projects 列表样式 ---
.my-projects-section {
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    h3 { font-size: 24px; display: flex; gap: 10px; align-items: center; }
    .search-pill { background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 20px; display: flex; width: 300px; input { background: transparent; border: none; outline: none; color: white; margin-left: 8px; width: 100%; } }
  }

  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .legal-card {
    background: $bg-card;
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.05);
    transition: all 0.3s;
    overflow: hidden;

    .card-content { padding: 24px; position: relative; z-index: 2; }

    .card-top {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
      .file-type-icon { font-size: 24px; color: $primary; background: rgba($primary, 0.1); padding: 8px; border-radius: 8px; }
      .card-actions {
        display: flex; align-items: center; gap: 10px;
        .delete-btn { color: #64748b; padding: 4px; border-radius: 4px; opacity: 0; transform: translateX(10px); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; &:hover { background: rgba($danger, 0.1); color: $danger; } }
      }
    }

    .project-title { font-size: 18px; margin: 0 0 16px 0; color: $text-main; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta-info { p { margin: 0 0 8px; font-size: 13px; color: $text-sub; display: flex; align-items: center; gap: 8px; } }
    .hover-arrow { position: absolute; bottom: 24px; right: 24px; opacity: 0; transform: translateX(-10px); transition: all 0.3s; color: $accent; }

    &:hover {
      transform: translateY(-5px); border-color: $primary; background: lighten($bg-card, 2%);
      .hover-arrow { opacity: 1; transform: translateX(0); }
      .card-actions .delete-btn { opacity: 1; transform: translateX(0); }
    }
  }
}
</style>