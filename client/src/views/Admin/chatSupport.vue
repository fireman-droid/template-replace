<template>
  <div class="admin-chat-container">
    <!-- 左侧会话列表 -->
    <div class="session-list">
      <div class="list-header">在线咨询列表</div>
      <div v-for="session in sessions" :key="session.userId" class="session-item"
        :class="{ active: currentSession?.userId === session.userId }" @click="selectSession(session)">
        <div class="avatar">{{ session.username.charAt(0).toUpperCase() }}</div>
        <div class="info">
          <div class="name">{{ session.username }}</div>
          <div class="last-msg">{{ session.lastMessage }}</div>
        </div>
        <div class="badge" v-if="session.unread > 0">{{ session.unread }}</div>
      </div>
    </div>

    <!-- 右侧聊天框 -->
    <div class="chat-main" v-if="currentSession">
      <div class="chat-header">
        正在与 {{ currentSession.username }} 对话
      </div>

      <div class="messages-area" ref="msgAreaRef">
        <div v-for="(msg, i) in currentSession.messages" :key="i" class="msg-row"
          :class="{ 'mine': msg.sender === 'admin' }">
          <div class="bubble">{{ msg.content }}</div>
        </div>
      </div>

      <div class="input-area">
        <el-input v-model="replyText" placeholder="输入回复..." @keyup.enter="sendReply">
          <template #append>
            <el-button @click="sendReply">发送</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div class="empty-state" v-else>
      请选择一个会话开始回复
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const socket = ref(null)
const sessions = ref([]) // 会话列表
const currentSession = ref(null) // 当前选中的会话
const replyText = ref('')
const msgAreaRef = ref(null)

// 初始化 Socket
const initSocket = () => {
  if (socket.value && socket.value.connected) return

  socket.value = io('http://localhost:5000')

  socket.value.on('connect', () => {
    // 管理员必须加入 admin_room 才能收到用户的第一条消息
    socket.value.emit('join_room', 'admin_room')
    console.log('管理员已连接聊天服务')
  })

  // 监听用户发来的消息
  socket.value.on('receive_message', (data) => {
    console.log('管理员收到消息:', data)
    // data: { content, sender, senderId(如果不传需要我们根据 sender 解析或者后端传) }
    // 假设 data.sender 是用户名，我们需要一个唯一标识，建议后端顺便把 userId 传过来
    // 这里暂时用 sender 做唯一标识演示

    handleIncomingMessage(data)
  })
}

// 处理新消息
const handleIncomingMessage = (data) => {
  // 1. 查找会话是否存在
  let session = sessions.value.find(s => s.userId === data.sender) // 先用用户名当ID

  if (!session) {
    // 新会话
    session = {
      userId: data.sender, // 暂用
      username: data.sender,
      lastMessage: data.content,
      unread: 0,
      messages: []
    }
    sessions.value.unshift(session)
  }

  // 2. 更新消息记录
  session.messages.push({
    sender: 'user',
    content: data.content,
    time: new Date()
  })
  session.lastMessage = data.content

  // 3. 处理未读
  if (currentSession.value?.userId !== session.userId) {
    session.unread++
  }
}

const selectSession = (session) => {
  currentSession.value = session
  session.unread = 0
}

const sendReply = () => {
  if (!replyText.value.trim() || !currentSession.value) return

  const content = replyText.value

  // 1. 发送给该用户
  // 目标房间是: user_用户名 (因为我们之前约定是 user_ID，这里需要一致，前后端协议要对齐)
  // 如果之前后端没传ID，这里会有问题。为了简化演示，假设用户名就是ID。
  // 实际上建议修改后端 send_message 把完整 user 对象传过来。

  socket.value.emit('send_message', {
    targetRoom: `user_这里得填对应ID`,
    content: content,
    sender: 'admin'
  })

  // 2. 本地显示
  currentSession.value.messages.push({
    sender: 'admin',
    content: content,
    time: new Date()
  })

  replyText.value = ''
}

onMounted(() => {
  initSocket()
})

onUnmounted(() => {
  if (socket.value) socket.value.disconnect()
})
</script>

<style lang="scss" scoped>
.admin-chat-container {
  display: flex;
  height: calc(100vh - 140px);
  /* 减去顶部导航高度 */
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #334155;
  color: #f8fafc;
}

.session-list {
  width: 250px;
  background: #0f172a;
  border-right: 1px solid #334155;

  .list-header {
    padding: 15px;
    font-weight: bold;
    border-bottom: 1px solid #334155;
  }

  .session-item {
    display: flex;
    padding: 12px;
    cursor: pointer;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:hover,
    &.active {
      background: #334155;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 10px;
    }

    .info {
      flex: 1;
      overflow: hidden;

      .name {
        font-weight: 500;
      }

      .last-msg {
        color: #94a3b8;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .badge {
      background: #ef4444;
      color: white;
      border-radius: 10px;
      padding: 0 6px;
      font-size: 12px;
      height: 18px;
      line-height: 18px;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;

  .chat-header {
    padding: 15px;
    border-bottom: 1px solid #334155;
    background: #1e293b;
    font-weight: bold;
  }

  .messages-area {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .input-area {
    padding: 20px;
    border-top: 1px solid #334155;
  }
}

.msg-row {
  display: flex;

  &.mine {
    justify-content: flex-end;

    .bubble {
      background: #3b82f6;
      border-radius: 8px 0 8px 8px;
    }
  }

  .bubble {
    background: #334155;
    padding: 10px 15px;
    border-radius: 0 8px 8px 8px;
    max-width: 70%;
    line-height: 1.5;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}
</style>