import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 首屏必需：同步加载
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

// 非首屏：路由懒加载（Vite 自动 code splitting，按需下载）
const SelectTemplate = () => import('../views/SelectTemplate.vue')
const ProjectEdit = () => import('../views/ProjectEdit.vue')

// 管理后台：独立 chunk，普通用户永远不会下载这些代码
const AdminLayout = () => import(/* webpackChunkName: "admin" */ '../views/Admin/Admin.vue')
const Dashboard = () => import(/* webpackChunkName: "admin" */ '../views/Admin/Dashboard.vue')
const UserManagement = () => import(/* webpackChunkName: "admin" */ '../views/Admin/UserManagement.vue')
const TemplateManagement = () => import(/* webpackChunkName: "admin" */ '../views/Admin/TemplateManagement.vue')
const SystemLogs = () => import(/* webpackChunkName: "admin" */ '../views/Admin/SystemLogs.vue')
const ChatSupport = () => import(/* webpackChunkName: "admin" */ '../views/Admin/chatSupport.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/template/select',
    name: 'SelectTemplate',
    component: SelectTemplate,
    meta: { requiresAuth: true }
  },
  {
    path: '/project/edit',
    name: 'ProjectEdit',
    component: ProjectEdit,
    meta: { requiresAuth: true }
  },
  // --- 管理后台路由 ---
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/templates'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: Dashboard,
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: UserManagement,
        meta: { title: '用户管理' }
      },
      {
        path: 'templates',
        name: 'AdminTemplates',
        component: TemplateManagement,
        meta: { title: '模版核心' }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: SystemLogs,
        meta: { title: '系统日志' }
      },
      {
        path: 'chat',
        name: 'AdminChat',
        component: ChatSupport,
        meta: { title: '在线客服' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router