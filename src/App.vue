<template>
	<router-view v-slot="{ Component }">
		<keep-alive :include="['home', 'contacts']">
			<component :is="Component" />
		</keep-alive>
	</router-view>
	<Toaster />
</template>
<script setup lang="ts">
import {onMounted, onUnmounted} from "vue";
import {useUserStore} from "@/stores/user";
import {useChatStore} from "./stores/chat";
import Toaster from '@/components/ui/toast/Toaster.vue'
import {wsService} from "@/services/ws";
import {eventBus} from "@/utils/eventBus";
// import {electronAPI} from "@/electron";

console.log("[App.vue]", `Hello world from Electron!`);

const userStore = useUserStore();
const chatStore = useChatStore();

// 初始化用户认证状态
onMounted(async () => {
	try {
		// 先初始化认证状态
		userStore.initAuth();
		
		// 然后从数据库恢复用户状态
		const restored = await userStore.restoreFromDB();
		
		if (restored && userStore.isAuthenticated) {
			// 初始化 socket 连接
			chatStore.initSocket();
			// 初始化 WebSocket 服务
			wsService.init();
		}
	} catch (error) {
		console.error('初始化失败:', error);
	}
})

// 清理 WebSocket 连接
onUnmounted(() => {
	try {
		wsService.disconnect()
	} catch (error) {
		console.error('断开连接失败:', error)
	}
})

// 在好友同步完成后初始化聊天
const initializeChat = async () => {
	try {
		const chatStore = useChatStore();
		await chatStore.initialize();
	} catch (error) {
		console.error("初始化聊天失败:", error);
	}
};

// 监听好友同步完成事件
onMounted(() => {
	if (window.electron?.ipcRenderer) {
		window.electron.ipcRenderer.on('friendsSynced', async () => {
			console.log("收到好友同步完成事件");
			await initializeChat();
		});
	}
});

// 清理事件监听
onUnmounted(() => {
	if (window.electron?.ipcRenderer) {
		window.electron.ipcRenderer.off('friendsSynced');
	}
});
</script>

