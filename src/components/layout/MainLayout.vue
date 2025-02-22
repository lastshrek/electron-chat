<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { MessageSquare, Users, Plus, Settings, LogOut, Video } from 'lucide-vue-next'
import { eventBus } from '@/utils/eventBus'
import { authApi } from '@/api/auth'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()

// 当前激活的导航项
const activeNav = ref(router.currentRoute.value.name)

const friendRequestCount = ref(0)
const unreadCount = computed(() => chatStore.unreadTotal)

// 初始化好友请求数量
const initFriendRequests = async () => {
	try {
		const requests = await authApi.getFriendRequests('PENDING')
		console.log('获取好友请求成功:', requests)
		
		// requests 现在是数组类型
		friendRequestCount.value = Array.isArray(requests) ? requests.length : 0
		
	} catch (error) {
		console.error('获取好友请求失败:', error)
		friendRequestCount.value = 0
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

// 导航配置
const navigation = [
	{
		path: '/chat',
		icon: MessageSquare,
		title: '消息'
	},
	{
		path: '/contacts',
		icon: Users,
		title: '通讯录'
	}
]

// 默认头像
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'

// 处理头像点击
const handleAvatarClick = () => {
	// 实现头像点击逻辑
}

onUnmounted(() => {
	eventBus.off('friend-request')
	eventBus.off('clear-friend-request-count')
})
</script>

<template>
	<div class="h-screen flex">
		<!-- 左侧导航栏 -->
		<div class="w-16 bg-slate-800 flex flex-col items-center py-4 space-y-4">
			<!-- 头像 -->
			<div class="relative">
				<img
					:src="userStore.userInfo?.avatar || defaultAvatar"
					:alt="userStore.userInfo?.username"
					class="w-10 h-10 rounded-full cursor-pointer"
					@click="handleAvatarClick"
				/>
				<!-- 未读消息提示 -->
				<div
					v-if="unreadCount > 0"
					class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
				>
					<span class="text-xs text-white">{{ unreadCount }}</span>
				</div>
			</div>

			<!-- 导航按钮 -->
			<RouterLink
				v-for="nav in navigation"
				:key="nav.path"
				:to="nav.path"
				class="w-10 h-10 rounded-lg flex items-center justify-center"
				:class="{
					'bg-slate-700 text-white': route.path === nav.path,
					'text-slate-400 hover:text-white hover:bg-slate-700/50': route.path !== nav.path
				}"
				:title="nav.title"
			>
				<component :is="nav.icon" class="w-5 h-5" />
			</RouterLink>

			<!-- 在线会议按钮 -->
			<RouterLink
				to="/meeting"
				class="w-10 h-10 rounded-lg flex items-center justify-center"
				:class="{
					'bg-slate-700 text-white': route.path === '/meeting',
					'text-slate-400 hover:text-white hover:bg-slate-700/50': route.path !== '/meeting'
				}"
				title="在线会议"
			>
				<Video class="w-5 h-5" />
			</RouterLink>
		</div>

		<!-- 主内容区域 -->
		<div class="flex-1 flex flex-col overflow-hidden">
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
