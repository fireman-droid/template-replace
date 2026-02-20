<template>
  <div class="chat-widget" v-if="!authStore.isAdmin">
    <!-- 1. 聊天主窗口 -->
    <transition name="slide-fade">
      <div v-if="isOpen" class="chat-window">
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-info">
            <el-icon class="service-icon">
              <Headset />
            </el-icon>
            <span class="title">技术法律顾问</span>
            <span class="status-dot online"></span>
          </div>
          <el-icon class="close-btn" @click="toggleChat">
            <Close />
          </el-icon>
        </div>

        <!-- 消息列表区 (暂时放假数据) -->
        <!-- 修改 template 中的 .chat-body 部分 -->
        <div class="chat-body" ref="chatBodyRef">
          <!-- 系统欢迎语 (写死) -->
          <div class="message system">
            <span class="content">您好，我是这里的 AI 法律助手。请问遇到了什么技术问题？</span>
          </div>

          <!-- 真实消息循环 -->
          <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.type">
            <span class="content">{{ msg.content }}</span>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-footer">
          <input v-model="inputMessage" placeholder="输入您的问题..." @keyup.enter="sendMessage" />
          <button class="send-btn" @click="sendMessage">
            <el-icon>
              <Position />
            </el-icon>
          </button>
        </div>
      </div>
    </transition>

    <!-- 2. 悬浮按钮 (平时显示这个) -->
    <button class="float-btn" @click="toggleChat" :class="{ 'is-active': isOpen }">
      <el-icon v-if="!isOpen">
        <ChatDotRound />
      </el-icon>
      <el-icon v-else>
        <ArrowDown />
      </el-icon>
    </button>
  </div>
</template>

<script setup>
import { ref,computed,onMounted, onUnmounted } from 'vue'
import { ChatDotRound, Close, Position, Headset, ArrowDown } from '@element-plus/icons-vue'

// 引入socket
import { io } from 'socket.io-client' // 引入 socket.io
import { useAuthStore } from '@/stores/auth' // 引入用户状态

const authStore = useAuthStore()
const isOpen = ref(localStorage.getItem('chatOpen') === 'true')
const inputMessage = ref('')
const socket = ref(null)
const messages = ref([]) // 存储真实消息

// 生成自己房间号
const myRoomId = computed(() => {
  return authStore.user ? `user_${authStore.user.id}` : 'guest_room'
})

// 初始化 socket
const initSocket = () => {
  socket.value = io('http://localhost:5000') // 开发环境填全路径更稳妥
  socket.value.on('connect', () => {
    console.log('连接成功')
    socket.value.emit('join_room', myRoomId.value)
    if (authStore.isAdmin) {
        socket.value.emit('join_room', 'admin_room')
    }
    socket.value.on('receive_message', (data) => {
      console.log('收到消息:', data)
      // 把消息推入列表
      messages.value.push({
        type: 'admin', // 先假设发消息的都是管理员
        content: data.content
      })
    })
    socket.value.on('load_history', (history) => {
      console.log('📜 加载历史记录:', history)
      // 把历史消息转换成前端格式
      const formattedHistory = history.map(msg => ({
        type: msg.senderType === 'user' ? 'user' : 'admin',
        content: msg.content
      }))
      messages.value = formattedHistory
    })
  })
}

// 切换聊天窗状态
const toggleChat = () => {
  isOpen.value = !isOpen.value
  localStorage.setItem('chatOpen', isOpen.value)
}

// 发送消息 (暂时只清空输入框)
const sendMessage = () => {
  if (!inputMessage.value.trim()) return
  console.log('发送消息:', inputMessage.value)
  const content = inputMessage.value
  // 1. 本地先上屏 (自己看)
  messages.value.push({
    type: 'user',
    content: content
  })
  // 2. 将消息发给服务器
  // 如果我是普通用户，我就发给 'admin_room'
  socket.value.emit('send_message', {
    targetRoom: 'admin_room',
    content: content,
    sender: authStore.username || '匿名用户',
    senderId: authStore.user?.id 
  })
  inputMessage.value = ''
}

onMounted(() => {
  console.log('用户信息:', authStore.user)
  // 如果用户已登录，初始化 Socket
  if (authStore.isAuthenticated) {
    initSocket()
  }
})

onUnmounted(() => {
  socket.value.disconnect()
})
</script>

<style lang="scss" scoped>
/* 定义一些变量，保持和 Home.vue 一致的科技感 */
$primary: #3b82f6;
$accent: #06b6d4;
$bg-dark: #0f172a;
$text-light: #f8fafc;

.chat-widget {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
}

/* --- 悬浮按钮样式 --- */
.float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary, $accent);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba($primary, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba($primary, 0.6);
  }

  &.is-active {
    transform: rotate(180deg);
    background: #475569;
  }
}

/* --- 聊天窗口样式 --- */
.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: rgba($bg-dark, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba($primary, 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  transform-origin: bottom right;
}

.chat-header {
  padding: 15px 20px;
  background: rgba($primary, 0.1);
  border-bottom: 1px solid rgba($primary, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: $text-light;

  .header-info {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;

    .online {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 5px #10b981;
    }
  }

  .close-btn {
    cursor: pointer;

    &:hover {
      color: $accent;
    }
  }
}

.chat-body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* 消息气泡 */
  .message {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.5;

    &.system {
      align-self: center;
      background: rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      font-size: 12px;
      border-radius: 6px;
    }

    &.user {
      align-self: flex-end;
      background: $primary;
      color: white;
      border-bottom-right-radius: 2px;
    }

    &.admin {
      align-self: flex-start;
      background: #334155;
      color: $text-light;
      border-bottom-left-radius: 2px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }
}

.chat-footer {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 10px;

  input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 8px 16px;
    color: white;
    outline: none;
    transition: 0.3s;

    &:focus {
      border-color: $primary;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: $primary;
    color: white;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;

    &:hover {
      background: $accent;
    }
  }
}

/* 动画效果 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
</style>