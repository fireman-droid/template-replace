<template>
  <div class="chat-widget" v-if="!authStore.isAdmin">
    <!-- 1. 聊天主窗口 -->
    <transition name="slide-fade">
      <div
        v-if="isOpen"
        class="chat-window"
        :class="{ fullscreen: isFullscreen }"
      >
        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-info">
            <el-icon class="service-icon">
              <Headset />
            </el-icon>
            <span class="title">技术法律顾问</span>
            <span class="status-dot online"></span>
          </div>
          <div class="header-actions">
            <el-icon
              class="action-btn"
              @click="isFullscreen = !isFullscreen"
              v-if="!isFullscreen"
            >
              <FullScreen />
            </el-icon>
            <svg
              v-else
              class="action-btn"
              @click="isFullscreen = !isFullscreen"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="4 14 10 14 10 20"></polyline>
              <polyline points="20 10 14 10 14 4"></polyline>
              <line x1="14" y1="10" x2="21" y2="3"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <el-icon class="action-btn" @click="toggleChat">
              <ArrowDown />
            </el-icon>
          </div>
        </div>

        <!-- 消息列表区 (暂时放假数据) -->
        <!-- 修改 template 中的 .chat-body 部分 -->
        <div class="chat-body" ref="chatBodyRef">
          <div class="messages-container">
            <!-- 系统欢迎语 -->
            <div class="message-row system">
              <div class="message-bubble">
                您好，我是这里的 AI 法律助手。请问遇到了什么技术问题？
              </div>
            </div>

            <!-- 真实消息循环 -->
            <div
              v-for="(msg, index) in todayMessages"
              :key="index"
              class="message-row"
              :class="msg.type"
            >
              <div class="message-bubble">
                <!-- 思考过程卡片 -->
                <div class="thinking-card" v-if="msg.thinking">
                  <div
                    class="card-header"
                    @click="msg.thinkOpen = !msg.thinkOpen"
                    :class="{ active: msg.thinkOpen }"
                  >
                    <el-icon :class="{ rotate: msg.thinkOpen }">
                      <ArrowRight />
                    </el-icon>
                    <span>深度思考</span>
                  </div>
                  <div class="card-body" v-show="msg.thinkOpen">
                    <div
                      class="markdown-content thinking-text"
                      v-html="renderMarkdown(msg.thinking)"
                    ></div>
                  </div>
                </div>

                <!-- 工具调用卡片 -->
                <div
                  class="action-card"
                  v-for="(act, ai) in msg.actions"
                  :key="ai"
                  :class="act.status"
                >
                  <div class="action-header">
                    <span class="action-icon">{{
                      act.status === "loading" ? "⏳" : "⚡"
                    }}</span>
                    <span class="action-name">{{ act.tool }}</span>
                    <span class="action-status" :class="act.status">
                      {{ act.status === "loading" ? "执行中..." : "完成" }}
                    </span>
                  </div>
                  <div
                    class="action-result"
                    v-if="act.status === 'done' && act.result"
                  >
                    <pre>{{ JSON.stringify(act.result, null, 2) }}</pre>
                  </div>
                </div>

                <!-- 正文内容 -->
                <div
                  class="markdown-content"
                  v-html="renderMarkdown(msg.content)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-footer">
          <textarea
            v-model="inputMessage"
            placeholder="输入您的问题..."
            @keydown.enter.exact.prevent="sendMessage"
            @input="autoResize"
            ref="textareaRef"
            rows="1"
          ></textarea>
          <button class="send-btn" @click="sendMessage">
            <el-icon>
              <Position />
            </el-icon>
          </button>
        </div>
      </div>
    </transition>

    <!-- 2. 悬浮按钮 (平时显示这个) -->
    <button
      class="float-btn"
      @click="toggleChat"
      :class="{ 'is-active': isOpen }"
    >
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
import { ref, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import MarkdownIt from "markdown-it";
import { ElMessageBox } from "element-plus";
import { chatWithAI } from "@/api/ai";
import { deleteCase as deleteCaseApi } from "@/api/cases";
import {
  ChatDotRound,
  Close,
  Position,
  Headset,
  ArrowDown,
  FullScreen,
  ArrowRight,
} from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const renderMarkdown = (text) => {
  return md.render(text || "");
};

const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const isOpen = ref(localStorage.getItem("chatOpen") === "true");
const isFullscreen = ref(false);
const inputMessage = ref("");
const messages = chatStore.messages;
const todayMessages = computed(() => chatStore.todayMessages);
const loading = ref(false);
const chatBodyRef = ref(null);
const textareaRef = ref(null);

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value)
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
  });
};

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  localStorage.setItem("chatOpen", isOpen.value);
};

// 发送消息并流式接收 AI 回复
const sendMessage = async () => {
  const text = inputMessage.value.trim();
  if (!text || loading.value) return;
  inputMessage.value = "";
  if (textareaRef.value) textareaRef.value.style.height = "auto";

  // 用户消息上屏
  chatStore.addMessage({ type: "user", content: text });
  scrollToBottom();

  // AI 回复占位
  const aiMsg = {
    type: "ai",
    content: "",
    thinking: "",
    thinkOpen: true,
    actions: [],
  };
  chatStore.addMessage(aiMsg);
  const aiIndex = messages.length - 1;
  loading.value = true;

  // 构建历史（最近 20 条）
  const history = messages
    .filter((m) => m.type === "user" || m.type === "ai")
    .slice(-22, -2)
    .filter(
      (m) =>
        m.content &&
        !m.content.includes("请求失败") &&
        !m.content.includes("Failed to fetch"),
    )
    .map((m) => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.content,
    }));

  try {
    await chatWithAI(text, history, (data) => {
      console.log(data);
      if (data.type === "thinking") {
        messages[aiIndex].thinking += data.content || "";
      } else if (data.type === "content") {
        messages[aiIndex].content += data.content || "";
      } else if (data.type === "action") {
        if (data.args) {
          // 工具开始执行 → 加一个 loading 状态的卡片
          messages[aiIndex].actions.push({
            tool: data.tool,
            args: data.args,
            status: "loading",
            result: null,
          });
        } else if (data.result) {
          // 工具执行完成 → 更新状态和结果
          const act = messages[aiIndex].actions.find(
            (a) => a.tool === data.tool && a.status === "loading",
          );
          if (act) {
            act.status = "done";
            act.result = data.result;
          }
          // 副作用处理
          if (data.tool === "createCase") {
            window.dispatchEvent(new CustomEvent("case-created"));
          } else if (data.tool === "openCase") {
            router.push(`/project/edit?id=${data.result.case_id}`);
          } else if (data.tool === "deleteCase" && data.result.needConfirm) {
            ElMessageBox.confirm(data.result.message, "⚠️ 危险操作", {
              confirmButtonText: "确认删除",
              cancelButtonText: "取消",
              type: "warning",
            })
              .then(async () => {
                try {
                  await deleteCaseApi(data.result.case_id);
                  chatStore.addMessage({
                    type: "system",
                    content: `✅ 案卷 "${data.result.title}" 已成功删除`,
                  });
                  window.dispatchEvent(new CustomEvent("case-created"));
                } catch (e) {
                  chatStore.addMessage({
                    type: "system",
                    content: `❌ 删除失败: ${e.message}`,
                  });
                }
              })
              .catch(() => {
                chatStore.addMessage({
                  type: "system",
                  content: "已取消删除操作",
                });
              });
          }
        }
      }
      scrollToBottom();
    });

    if (!messages[aiIndex].content) messages[aiIndex].content = "AI 未返回内容";
  } catch (err) {
    messages[aiIndex].content = `请求失败: ${err.message}`;
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
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
  font-family: "Inter", sans-serif;
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
  transition: all 0.3s ease;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    z-index: 10000;
  }
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    cursor: pointer;
    font-size: 18px;

    &:hover {
      color: $accent;
    }
  }
}

.chat-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #050a15; // 更深的夜空黑
  // 科技感网格背景
  background-image:
    linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: center center;

  .messages-container {
    max-width: 100%; // 全屏时撑满
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px; // 消息间距
  }

  .message-row {
    display: flex;
    width: 100%;

    &.user {
      justify-content: flex-end;
      .message-bubble {
        background: rgba(59, 130, 246, 0.15); // 半透明蓝
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-right: 3px solid $primary; // 右侧粗边框
        color: #e2e8f0;
        border-radius: 4px 0 0 4px; // 硬朗锐角
        box-shadow:
          0 0 10px rgba(59, 130, 246, 0.2),
          inset 0 0 10px rgba(59, 130, 246, 0.1);
      }
    }

    &.ai {
      justify-content: flex-start;
      .message-bubble {
        background: rgba(6, 182, 212, 0.08); // 半透明青色
        border: 1px solid rgba(6, 182, 212, 0.2);
        border-left: 3px solid $accent; // 左侧青色粗边框
        color: $text-light;
        border-radius: 0 4px 4px 0; // 硬朗锐角
        box-shadow:
          0 0 10px rgba(6, 182, 212, 0.1),
          inset 0 0 10px rgba(6, 182, 212, 0.05);
      }
    }

    &.system {
      justify-content: center;
      .message-bubble {
        background: rgba(0, 0, 0, 0.6);
        border: 1px dashed rgba(6, 182, 212, 0.5); // 虚线边框
        color: $accent; // 青色文字
        font-size: 12px;
        padding: 6px 16px;
        border-radius: 2px;
        max-width: fit-content;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
      }
    }
  }

  .message-bubble {
    max-width: 85%;
    padding: 16px;
    font-size: 15px;
    line-height: 1.6;
    position: relative;
    word-break: break-word;
    backdrop-filter: blur(4px);

    // 思考卡片样式 (类似控制台终端)
    .thinking-card {
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 2px;
      border: 1px solid rgba(16, 185, 129, 0.3); // 绿色边框
      box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.05);

      .card-header {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 12px;
        color: #10b981; // 终端绿
        background: rgba(16, 185, 129, 0.1);
        border-bottom: 1px solid rgba(16, 185, 129, 0.2);
        transition: all 0.2s;
        user-select: none;
        text-transform: uppercase;
        letter-spacing: 1px;

        &:hover {
          background: rgba(16, 185, 129, 0.2);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        .el-icon {
          transition: transform 0.3s ease;
          &.rotate {
            transform: rotate(90deg);
          }
        }
      }

      .card-body {
        padding: 12px;
        background: transparent;
        font-size: 13px;
      }
    }

    // 工具调用卡片样式
    .action-card {
      margin-bottom: 10px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 2px;
      border: 1px solid rgba(245, 158, 11, 0.3);
      overflow: hidden;
      transition: all 0.3s ease;

      &.loading {
        border-color: rgba(245, 158, 11, 0.5);
        animation: action-pulse 1.5s ease-in-out infinite;
      }

      &.done {
        border-color: rgba(16, 185, 129, 0.4);
      }

      .action-header {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        background: rgba(245, 158, 11, 0.08);
        letter-spacing: 0.5px;
      }

      .action-icon {
        font-size: 14px;
      }

      .action-name {
        color: #f59e0b;
        font-family: "JetBrains Mono", "Courier New", monospace;
        font-weight: 600;
      }

      .action-status {
        margin-left: auto;
        font-size: 11px;

        &.loading {
          color: #f59e0b;
        }

        &.done {
          color: #10b981;
        }
      }

      .action-result {
        padding: 8px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.3);

        pre {
          margin: 0;
          font-size: 11px;
          font-family: "JetBrains Mono", "Courier New", monospace;
          color: #94a3b8;
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 150px;
          overflow-y: auto;
        }
      }
    }

    @keyframes action-pulse {
      0%,
      100% {
        box-shadow: 0 0 0 rgba(245, 158, 11, 0);
      }
      50% {
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
      }
    }
  }
}

// Markdown 内容样式 (使用 :deep 穿透)
:deep(.markdown-content) {
  overflow-x: auto; // 让整个 markdown 容器可以横向滚动

  p {
    margin: 0 0 8px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: $accent;
    font-weight: 600;
  }

  ul,
  ol {
    padding-left: 20px;
    margin: 8px 0;
    li {
      margin-bottom: 4px;
    }
  }

  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 5px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    color: #e2e8f0;
  }

  pre {
    background: #0f172a;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 10px 0;
    border: 1px solid rgba(255, 255, 255, 0.1);

    code {
      background: transparent;
      padding: 0;
      color: #a5b4fc;
    }
  }

  blockquote {
    border-left: 3px solid $accent;
    margin: 10px 0;
    padding-left: 12px;
    color: #94a3b8;
    background: rgba($accent, 0.1);
    padding: 8px 12px;
    border-radius: 0 4px 4px 0;
  }

  table {
    width: 100%;
    border-collapse: separate; // 改为 separate 以支持发光边框
    border-spacing: 0;
    margin: 10px 0;
    font-size: 14px;
    border: 1px solid rgba(6, 182, 212, 0.3); // 青色外边框
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.1);
    background: rgba(0, 0, 0, 0.3);

    // 关键：在外层包裹滚动，而不是改变 table 的 display
    display: table;

    thead {
      background: rgba(6, 182, 212, 0.15); // 青色半透明表头
      th {
        padding: 10px 14px;
        text-align: left;
        font-weight: 600;
        color: $accent;
        border-bottom: 1px solid rgba(6, 182, 212, 0.4);
        white-space: nowrap;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid rgba(6, 182, 212, 0.1);
        transition: all 0.2s;
        &:hover {
          background: rgba(6, 182, 212, 0.08);
        }
        &:last-child td {
          border-bottom: none;
        }
      }
      td {
        padding: 8px 14px;
        color: #e2e8f0;
        border-bottom: 1px solid rgba(6, 182, 212, 0.1);
      }
    }
  }

  &.thinking-text {
    font-family: "JetBrains Mono", "Courier New", monospace;
    color: #10b981; // 纯粹的终端绿
    font-size: 12px;
    line-height: 1.6;
    text-shadow: 0 0 5px rgba(16, 185, 129, 0.3); // 轻微的发光
  }
}

.chat-footer {
  padding: 15px;
  border-top: 1px solid rgba(6, 182, 212, 0.3); // 底部输入框分割线
  background: rgba(5, 10, 21, 0.9); // 和背景色一致
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  gap: 10px;

  textarea {
    flex: 1;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 2px; // 硬边
    padding: 8px 16px;
    color: $accent; // 输入文字用青色
    outline: none;
    transition: 0.3s;
    resize: none;
    font-family: "JetBrains Mono", inherit;
    font-size: 14px;
    line-height: 1.5;
    min-height: 36px;
    max-height: 120px;
    overflow-y: auto;
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);

    &:focus {
      border-color: $accent;
      box-shadow:
        0 0 8px rgba(6, 182, 212, 0.4),
        inset 0 0 5px rgba(6, 182, 212, 0.1);
      background: rgba(0, 0, 0, 0.8);
    }

    &::placeholder {
      color: rgba(6, 182, 212, 0.3);
    }
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 2px; // 硬边按钮
    border: 1px solid $primary;
    background: rgba(59, 130, 246, 0.1);
    color: $primary;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s;

    &:hover {
      background: rgba(59, 130, 246, 0.3);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      color: white;
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
