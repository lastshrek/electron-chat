<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { MessageSquare, Users, Plus, Settings, LogOut, Video, FileText, LayoutDashboard } from 'lucide-vue-next'
import { eventBus } from '@/utils/eventBus'
import { authApi } from '@/api/auth'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/components/ui/toast'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()
const { toast } = useToast()

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
	try {
		await userStore.logout()
		toast({
			title: '退出成功',
			description: '您已安全退出登录'
		})
		router.push('/login')
	} catch (error) {
		console.error('退出失败:', error)
		toast({
			variant: 'destructive',
			title: '退出失败',
			description: '请稍后重试'
		})
	}
}

// 添加处理设置点击的方法
const handleSettingsClick = () => {
	toast({
		title: "功能开发中",
		description: "设置功能暂未开放，敬请期待",
		duration: 3000
	})
}

// 修改导航配置，添加工作台选项
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
	},
	{
		path: '/meeting',
		icon: Video,
		title: '会议'
	},
	{
		path: '/workspace', // 新增工作台路由
		icon: LayoutDashboard, // 需要从 lucide-vue-next 导入这个图标
		title: '工作台'
	},
	{
		path: '/docs',
		icon: FileText,
		title: '文档协作'
	},
	{
		path: '/settings',
		icon: Settings,
		title: '设置'
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
		<div class="w-16 bg-[#1E2736] flex flex-col">
			<!-- 顶部用户头像 -->
			<div class="p-2 border-b border-[#2A3441]">
				<div class="relative group">
					<img 
						:src="userStore.userInfo?.avatar || '/default-avatar.png'" 
						:alt="userStore.userInfo?.username"
						class="w-12 h-12 rounded-lg object-cover bg-[#2A3441] cursor-pointer"
					/>
					
					<!-- 用户信息悬浮提示 -->
					<div class="absolute left-full ml-2 p-2 bg-black/75 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
						<div class="text-white font-medium">
							{{ userStore.userInfo?.username || '未登录' }}
						</div>
						<div class="text-xs text-[#8B9BB4]">在线</div>
					</div>
				</div>
			</div>

			<!-- 导航菜单 -->
			<nav class="flex-1 p-2 space-y-2">
				<router-link 
					v-for="item in navigation" 
					:key="item.path"
					:to="item.path"
					class="w-12 h-12 rounded-lg flex items-center justify-center text-[#8B9BB4] hover:bg-[#2A3441] hover:text-white transition-colors group relative"
					:class="{ 'bg-[#2A3441] !text-white': route.path === item.path }"
					@click="item.path === '/settings' ? handleSettingsClick() : null"
				>
					<component :is="item.icon" class="w-5 h-5" />
					
					<!-- Slack风格的悬浮提示 -->
					<div class="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
						{{ item.title }}
					</div>
				</router-link>
			</nav>

			<!-- 底部退出按钮 -->
			<div class="p-2 border-t border-[#2A3441]">
				<button 
					@click="handleLogout"
					class="w-12 h-12 rounded-lg flex items-center justify-center text-[#8B9BB4] hover:bg-[#2A3441] hover:text-white transition-colors group relative"
				>
					<LogOut class="w-5 h-5" />
					
					<!-- 退出按钮的悬浮提示 -->
					<div class="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
						退出登录
					</div>
				</button>
			</div>
		</div>

		<!-- 主内容区域 -->
		<div class="flex-1 bg-[#F8FAFC] overflow-auto">
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

/* 添加过渡效果 */
.group:hover .group-hover\:opacity-100 {
	transition-delay: 150ms;
}

/* 确保悬浮提示在其他元素之上 */
.absolute {
	z-index: 50;
}
</style>
