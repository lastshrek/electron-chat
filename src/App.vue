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
import Toaster from '@/components/ui/toast/Toaster.vue'
import {wsService} from "@/services/ws";
// import {electronAPI} from "@/electron";

console.log("[App.vue]", `Hello world from Electron!`);

const userStore = useUserStore();

// 初始化用户认证状态
onMounted(() => {
	try {
		userStore.initAuth()
		if (userStore.isAuthenticated) {
			wsService.init()
		}		
	} catch (error) {
		console.error('初始化失败:', error)
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
</script>

