import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 引入页面组件
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import SelectTemplate from '../views/SelectTemplate.vue'
import ProjectEdit from '../views/ProjectEdit.vue'

// 引入管理后台组件 (建议按需加载，这里为了演示直接引入)
import AdminLayout from '../views/Admin/Admin.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import UserManagement from '../views/admin/UserManagement.vue'
import TemplateManagement from '../views/admin/TemplateManagement.vue'
import SystemLogs from '../views/admin/SystemLogs.vue'

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
  // --- 管理后台路由重构 ---
  {
    path: '/admin',
    component: AdminLayout, // Admin.vue 现在只作为布局容器
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/templates' // 默认跳转到模版管理
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