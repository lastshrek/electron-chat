<template>
	<component :is="layout">
		<router-view />
	</component>
	<Toaster />
</template>

<script setup lang="ts">
	import {onMounted, onUnmounted, computed} from "vue";
	import {useUserStore} from "@/stores/user";
	import {useChatStore} from "./stores/chat";
	import Toaster from "@/components/ui/toast/Toaster.vue";
	import {wsService} from "@/services/ws";
	import {useRoute} from "vue-router";
	import MainLayout from "@/components/layout/MainLayout.vue";
	import EmptyLayout from "@/components/layout/EmptyLayout.vue";

	const userStore = useUserStore();
	const chatStore = useChatStore();
	const route = useRoute();

	// 根据路由的 meta.layout 属性决定使用哪个布局
	const layout = computed(() => {
		const layoutName = route.meta.layout || "empty";
		return layoutName === "main" ? MainLayout : EmptyLayout;
	});

	// 初始化用户认证状态
	onMounted(async () => {
		try {
			// 先初始化认证状态
			userStore.initAuth();

			// 从本地存储恢复用户状态
			if (userStore.isAuthenticated) {
				// 初始化 socket 连接
				chatStore.initSocket();
				// 初始化 WebSocket 服务
				wsService.init();
			}
		} catch (error) {
			console.error("初始化失败:", error);
		}
	});

	// 清理 WebSocket 连接
	onUnmounted(() => {
		try {
			wsService.disconnect();
		} catch (error) {
			console.error("断开连接失败:", error);
		}
	});
</script>
