import { defineStore } from "pinia";
import { ref, computed } from "vue";

function isToday(timestamp) {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const useChatStore = defineStore(
  "chat",
  () => {
    const messages = ref([]);

    const todayMessages = computed(() =>
      messages.value.filter((m) => isToday(m.timestamp)),
    );

    function addMessage(msg) {
      msg.timestamp = Date.now();
      messages.value.push(msg);
    }

    function cleanOldMessages() {
      messages.value = messages.value.filter((m) => isToday(m.timestamp));
    }

    // 初始化时清理过期消息
    cleanOldMessages();

    return { messages, todayMessages, addMessage, cleanOldMessages };
  },
  { persist: true },
);
