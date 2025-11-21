import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import SelectTemplate from '../views/SelectTemplate.vue'
import ProjectEdit from '../views/ProjectEdit.vue'
import Admin from '../views/Admin.vue' // 引入新页面

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
  // 新增管理后台路由
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
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
  } 
  // 简单的管理员权限检查
  else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // 如果不是管理员，踢回首页
    next('/')
  }
  else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  }
  else {
    next()
  }
})

export default router