<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { MessageSquare, Users, Plus, Settings, LogOut } from 'lucide-vue-next'
import { eventBus } from '@/utils/eventBus'
import { authApi } from '@/api/auth'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const userStore = useUserStore()
const chatStore = useChatStore()

// 当前激活的导航项
const activeNav = ref(router.currentRoute.value.name)

const friendRequestCount = ref(0)
const unreadCount = ref(chatStore.unreadTotal)

// 初始化好友请求数量
const initFriendRequests = async () => {
	try {
		const response = await authApi.getFriendRequests('PENDING')
		friendRequestCount.value = response.length
	} catch (error) {
		console.error('获取好友请求失败:', error)
	}
}

// 监听好友请求事件
onMounted(async () => {
	// 只在联系人页面初始化好友请求
	// if (router.currentRoute.value.name === 'contacts') {
	// 	await initFriendRequests()
	// }

	eventBus.on('friend-request', () => {
		friendRequestCount.value++
	})

	eventBus.on('clear-friend-request-count', () => {
		clearFriendRequestCount()
	})

	eventBus.on('unread-count-updated', handleUnreadUpdate)
})

// 清除好友请求数量
const clearFriendRequestCount = () => {
	friendRequestCount.value = 0
}

// 处理导航点击
const handleNavClick = (nav: string) => {
	activeNav.value = nav
	if (nav === 'contacts') {
		router.push('/contacts')
		// 点击联系人时获取最新的好友请求数量
		initFriendRequests()
		// 点击联系人时清除角标
		clearFriendRequestCount()
		// 通知其他组件清除角标
		eventBus.emit('clear-friend-request-count')
	} else {
		router.push('/')
	}
}

const handleLogout = async () => {
	await userStore.logout()
	router.push('/login')
}

// 监听未读消息更新
const handleUnreadUpdate = (count: number) => {
	unreadCount.value = count
}

onUnmounted(() => {
	eventBus.off('friend-request')
	eventBus.off('clear-friend-request-count')
	eventBus.off('unread-count-updated', handleUnreadUpdate)
})
</script>

<template>
	<div class="h-screen flex">
		<!-- 左侧导航栏 -->
		<div class="w-16 bg-slate-900 flex flex-col items-center shrink-0">
			<!-- 用户头像 -->
			<div class="py-4">
				<img
					:src="userStore.userInfo?.avatar"
					:alt="userStore.userInfo?.name || 'avatar'"
					class="w-10 h-10 rounded-lg hover:rounded-3xl transition-all duration-300"
				/>
			</div>

			<!-- 导航菜单 -->
			<div class="flex-1 w-full">
				<nav class="flex flex-col items-center space-y-4 py-4">
					<button
						:class="[
							'w-10 h-10 rounded-lg text-slate-400 inline-flex items-center justify-center hover:text-white hover:bg-slate-800 hover:rounded-3xl transition-all duration-300 relative',
							activeNav === 'home' ? 'text-white bg-slate-800' : 'text-slate-400',
						]"
						@click="handleNavClick('home')"
					>
						<MessageSquare class="h-5 w-5" />
						<!-- 添加未读消息数量显示 -->
						<div
							v-if="unreadCount > 0"
							class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
						>
							{{ unreadCount }}
						</div>
					</button>
					<button
						:class="[
							'w-10 h-10 rounded-lg text-slate-400 inline-flex items-center justify-center hover:text-white hover:bg-slate-800 hover:rounded-3xl transition-all duration-300 relative',
							activeNav === 'contacts' && 'text-white bg-slate-800 rounded-3xl',
						]"
						@click="handleNavClick('contacts')"
						title="联系人"
					>
						<Users class="h-5 w-5" />
						<!-- 添加好友请求数量显示 -->
						<div
							v-if="friendRequestCount > 0"
							class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
						>
							{{ friendRequestCount }}
						</div>
					</button>
				</nav>
			</div>

			<!-- 底部按钮组 -->
			<div class="py-4 flex flex-col items-center space-y-4">
				<button
					class="w-10 h-10 rounded-lg text-slate-400 inline-flex items-center justify-center hover:text-white hover:bg-slate-800 hover:rounded-3xl transition-all duration-300"
				>
					<Plus class="h-5 w-5" />
				</button>
				<button
					class="w-10 h-10 rounded-lg text-slate-400 inline-flex items-center justify-center hover:text-white hover:bg-slate-800 hover:rounded-3xl transition-all duration-300"
				>
					<Settings class="h-5 w-5" />
				</button>
				<button
					class="w-10 h-10 rounded-lg text-slate-400 inline-flex items-center justify-center hover:text-white hover:bg-slate-800 hover:rounded-3xl transition-all duration-300"
					@click="handleLogout"
				>
					<LogOut class="h-5 w-5" />
				</button>
			</div>
		</div>

		<!-- 内容区域 - 添加 min-w-0 防止子元素溢出 -->
		<div class="flex-1 flex min-w-0">
			<slot></slot>
		</div>
	</div>
</template>

<style scoped>
/* 自定义滚动条样式 */
:deep(.overflow-y-auto::-webkit-scrollbar) {
	width: 4px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-track) {
	background: transparent;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
	background-color: rgba(156, 163, 175, 0.5);
	border-radius: 2px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
	background-color: rgba(156, 163, 175, 0.8);
}
</style>
