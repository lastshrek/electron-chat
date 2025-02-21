<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:08:47
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-22 00:26:20
 * @FilePath     : /src/views/Contacts/Contacts.vue
 * @Description  : Contacts page
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:08:47
-->
 <template>
	<MainLayout>
		<!-- 联系人列表 -->
		<div class="w-80 border-r bg-slate-50 flex flex-col">
			<!-- 搜索栏 -->
			<div class="p-4 border-b">
				<div class="flex space-x-2">
					<div class="relative flex-1">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
						<input
							v-model="searchQuery"
							type="text"
							class="w-full h-9 pl-9 pr-20 rounded-lg bg-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="搜索用户"
							@keydown="handleKeydown"
						/>
						<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
							<button
								v-if="searchQuery"
								class="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
								@click="clearSearch"
							>
								<XCircle class="w-full h-full" />
							</button>
							<button 
								class="px-2 h-7 rounded text-sm font-medium text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
								:disabled="isSearching || !searchQuery.trim()" 
								@click="handleSearch"
							>
								搜索
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 联系人列表 -->
			<div class="flex-1 overflow-y-auto">
				<div class="divide-y">
					<div v-for="group in filteredGroups" :key="group.id" class="group-item">
						<div
							class="group-header flex items-center px-4 py-2 cursor-pointer hover:bg-slate-100"
							@click="toggleGroup(group.id)"
						>
							<component :is="group.icon" class="w-5 h-5 mr-2" />
							<span class="flex-1">{{ group.title }}</span>
							<!-- 联系人分组显示数量 -->
							<span 
								v-if="group.id === 'contacts' || (group.id === 'new-friends' && group.count > 0)" 
								class="text-sm text-slate-400 mr-2"
							>
								{{ group.count || 0 }}
							</span>
							<component
								:is="group.expanded ? ChevronDown : ChevronRight"
								class="w-4 h-4"
							/>
						</div>

						<!-- 分组内容 -->
						<div v-show="group.expanded" class="bg-slate-50">
							<div
								v-for="item in group.items"
								:key="item.id"
								class="flex items-center px-4 py-2 hover:bg-slate-100 cursor-pointer"
								:class="{ 'bg-slate-200': selectedContact?.id === item.id }"
								@click="handleSelectContact(item)"
							>
								<img :src="item.avatar" :alt="item.name" class="w-10 h-10 rounded-lg mr-3" />
								<div class="flex-1 min-w-0">
									<div class="font-medium">{{ item.name }}</div>
								</div>
							</div>
						</div>

						<!-- 新的朋友列表 -->
						<div v-if="group.id === 'new-friends' && group.expanded">
							<div
								v-for="request in newFriendRequests"
								:key="request.id"
								class="p-4 hover:bg-slate-100 cursor-pointer"
								:class="{ 'bg-slate-200': selectedContact?.id === request.from.id }"
								@click="handleSelectFriendRequest(request)"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center space-x-4">
										<img :src="request.from.avatar" :alt="request.from.username" class="w-12 h-12 rounded-lg" />
										<div class="space-y-1">
											<h3 class="font-medium text-base">{{ request.from.username }}</h3>
											<p class="text-sm text-slate-500">
												{{ request.message || '请求添加您为好友' }}
											</p>
										</div>
									</div>
									<div class="ml-4">
										<template v-if="request.status === 'PENDING'">
											<button
												class="px-3 h-9 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
												@click.stop="handleFriendRequest(request.id, 'accept')"
											>
												同意
											</button>
										</template>
									</div>
								</div>
								<div class="mt-2 text-xs text-slate-400">
									{{ formatTime(request.createdAt) }}
								</div>
							</div>
							<!-- 没有好友请求时显示提示 -->
							<div v-if="newFriendRequests.length === 0" class="p-4 text-center text-slate-500 text-sm">
								暂无好友请求
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 联系人详情 -->
		<div class="flex-1 bg-white flex flex-col">
			<template v-if="selectedContact">
				<!-- 详情头部 -->
				<div class="h-14 border-b flex items-center px-6">
					<h2 class="font-medium">{{ selectedContact.name }}</h2>
				</div>

				<!-- 详情内容 -->
				<div class="flex-1 p-6">
					<div class="max-w-md mx-auto">
						<!-- 头像 -->
						<div class="flex justify-center mb-6">
							<img :src="selectedContact.avatar" :alt="selectedContact.name" class="w-24 h-24 rounded-2xl" />
						</div>

						<!-- 基本信息 -->
						<div class="space-y-4">
							<div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
								<span class="text-sm text-slate-500">用户名</span>
								<span class="font-medium">{{ selectedContact.name }}</span>
							</div>
							<div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
								<span class="text-sm text-slate-500">注册时间</span>
								<span class="font-medium">{{ selectedContact.description }}</span>
							</div>
						</div>

						<!-- 操作按钮 -->
						<div class="mt-6 space-y-3">
							<!-- 当前用户不显示任何按钮 -->
							<template v-if="!isCurrentUser">
								<!-- 好友显示发送消息和通话按钮 -->
								<template v-if="isFriend">
									<button
										class="w-full h-11 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
										@click="handleSendMessage"
									>
										<MessageSquare class="w-5 h-5 mr-2" />
										发送消息
									</button>
									<!-- 通话按钮组 -->
									<div class="flex gap-3 mt-4">
										<button
											class="flex-1 h-11 text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 rounded-md inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
										>
											<Phone class="w-5 h-5 mr-2" />
											语音通话
										</button>
										<button
											class="flex-1 h-11 text-base font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-md inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
										>
											<Video class="w-5 h-5 mr-2" />
											视频通话
										</button>
									</div>
								</template>
								<!-- 好友请求显示同意按钮 -->
								<template v-else-if="isFriendRequest">
									<button
										class="w-full h-11 text-base font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
										@click="handleAcceptFriend"
										:disabled="isRequestPending"
									>
										<UserPlus class="w-5 h-5 mr-2" />
										{{ isRequestPending ? '处理中...' : '同意' }}
									</button>
								</template>
								<!-- 非好友显示添加好友按钮 -->
								<template v-else>
									<button
										class="w-full h-11 text-base font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
										@click="handleAddFriend"
										:disabled="isRequestPending"
									>
										<UserPlus class="w-5 h-5 mr-2" />
										{{ isRequestPending ? '处理中...' : '添加好友' }}
									</button>
								</template>
							</template>
						</div>
					</div>
				</div>
			</template>
			<div v-else class="flex-1 flex items-center justify-center text-slate-400">
				<p>请选择联系人查看详情</p>
			</div>
		</div>
	</MainLayout>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
	Search,
	ChevronRight,
	ChevronDown,
	UserPlus,
	Users,
	Radio,
	User,
	XCircle,
	MessageSquare,
	Phone,
	Video,
} from 'lucide-vue-next'
import MainLayout from '@/components/layout/MainLayout.vue'
import { authApi } from '@/api/auth'
import { useToast } from '@/components/ui/toast'
import { useUserStore } from '@/stores/user'
import { handleApiError } from '@/utils/error'
import { eventBus } from '@/utils/eventBus'
import type { FriendRequest } from "@/types/api"
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'

// 分组数据
interface ContactGroup {
	id: string
	title: string
	icon: any
	expanded: boolean
	count?: number
	items: Array<{
		id: number
		name: string
		avatar: string
		description?: string
	}>
}

// 修改搜索结果类型
interface SearchUser {
	id: number
	username: string
	name: string | null
	avatar: string
	createdAt: string
	isFriend?: boolean
	description?: string
	chatId?: number
}

interface Friend {
	id: number;
	createdAt: string;
	userId: number;
	friendId: number;
	friendUsername: string;
	friendAvatar: string;
}
const TAG = '🧛‍♂️ Contacts'
const searchQuery = ref('')
const isSearching = ref(false)
const searchResults = ref<SearchUser[]>([])
const chatStore = useChatStore()
const { toast } = useToast()

const userStore = useUserStore()
const friends = ref<Friend[]>([])

// 新朋友列表
const newFriendRequests = ref<FriendRequest[]>([])
const router = useRouter()

// 初始化好友请求列表
const initFriendRequests = async () => {
	try {
		const response = await authApi.getFriendRequests('PENDING')
		newFriendRequests.value = response
		// 更新新朋友数量
		contactGroups.value[0].count = newFriendRequests.value.length
	} catch (error) {
		console.error('获取好友请求失败:', error)
		const apiError = handleApiError(error)
		toast({
			variant: 'destructive',
			title: '获取好友请求失败',
			description: apiError.message,
		})
	}
}

// 获取好友列表
const getFriendsList = async () => {
	try {
		if (!userStore.userInfo?.id) {
			console.error("用户ID不存在");
			return;
		}

		console.log("开始获取好友列表，用户ID:", userStore.userInfo.user_id);
		const friendsList = await window.electron.ipcRenderer.invoke("db:getFriends", userStore.userInfo.user_id);
		console.log("获取好友列表成功:", friendsList);

		// 更新联系人分组数据
		const contactsGroup = contactGroups.value.find(g => g.id === 'contacts');
		if (contactsGroup) {
			contactsGroup.count = friendsList.length;
			// 更新好友列表项
			contactsGroup.items = friendsList.map(friend => ({
				id: friend.friendId,
				name: friend.friendUsername,
				avatar: friend.friendAvatar,
				description: `好友添加时间：${formatDate(friend.createdAt)}`,
				chatId: friend.chatId
			}));
		}

		// 保存原始好友数据
		friends.value = friendsList;
	} catch (error) {
		console.error("获取好友列表失败:", error);
		toast({
			variant: 'destructive',
			title: '获取好友列表失败',
			description: '请稍后重试'
		});
	}
};

onMounted(async () => {
	// 初始化好友请求列表
	await initFriendRequests()

	// 监听新的好友请求
	eventBus.on('friend-request', data => {
		newFriendRequests.value.unshift(data.data.request)
		contactGroups.value[0].count = newFriendRequests.value.length
	})

	// 在组件挂载时获取好友列表
	getFriendsList()
})

onUnmounted(() => {
	eventBus.off('friend-request')
})

// 初始化分组数据
const contactGroups = ref<ContactGroup[]>([
	{
		id: 'new-friends',
		title: '新的朋友',
		icon: UserPlus,
		expanded: false,
		count: 0, // 初始化为 0
		items: [], // 初始化为空数组
	},
	{
		id: 'groups',
		title: '群聊',
		icon: Users,
		expanded: false,
		items: [
			{
				id: 3,
				name: '前端交流群',
				avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FE',
				description: '98人',
			},
			{
				id: 4,
				name: '产品设计群',
				avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PD',
				description: '45人',
			},
		],
	},
	{
		id: 'official',
		title: '公众号',
		icon: Radio,
		expanded: false,
		items: [
			{
				id: 5,
				name: '技术日报',
				avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TD',
				description: '每日技术资讯',
			},
			{
				id: 6,
				name: '前端周刊',
				avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=FW',
				description: '前端技术分享',
			},
		],
	},
	{
		id: 'contacts',
		title: '联系人',
		icon: User,
		expanded: false,
		items: [],
	},
])

const toggleGroup = (groupId: string) => {
	const group = contactGroups.value.find(g => g.id === groupId)
	if (group) {
		group.expanded = !group.expanded
		// 如果是新朋友分组被展开，清除主布局中的角标
		if (group.id === 'new-friends' && group.expanded) {
			eventBus.emit('clear-friend-request-count')
		}
	}
}

const filteredGroups = computed(() => {
	if (!searchQuery.value) return contactGroups.value
	console.log(TAG, 'filteredGroups', contactGroups.value)
	return contactGroups.value.map(group => ({
		...group,
		expanded: true,
		items: group.items.filter(item => item.name.toLowerCase().includes(searchQuery.value.toLowerCase())),
	}))
})

// 添加请求状态
const isRequestPending = ref(false)

// 选中的联系人
const selectedContact = ref<SearchUser | null>(null)

const handleSelectContact = (contact: typeof selectedContact.value) => {
	selectedContact.value = contact
}

// 格式化日期
const formatDate = (dateString: string) => {
	const date = new Date(dateString)
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	})
}

// 格式化时间
const formatTime = (time: string) => {
	const date = new Date(time)
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	const hours = Math.floor(diff / (1000 * 60 * 60))
	const minutes = Math.floor(diff / (1000 * 60))

	if (days > 0) {
		return `${days} 天前`
	} else if (hours > 0) {
		return `${hours} 小时前`
	} else if (minutes > 0) {
		return `${minutes} 分钟前`
	} else {
		return '刚刚'
	}
}

// 搜索用户
const handleSearch = async () => {
	const keyword = searchQuery.value.trim()
	if (!keyword) {
		searchResults.value = []
		return
	}

	try {
		isSearching.value = true
		const response = await authApi.searchUsers(keyword)
		console.log('搜索结果', response)
		handleSearchResult(response)

		if (response.length === 0) {
			toast({
				title: '未找到用户',
				description: '请尝试其他关键词',
			})
		}
	} catch (error) {
		console.error('搜索用户失败:', error)
		toast({
			variant: 'destructive',
			title: '搜索失败',
			description: '请稍后重试',
		})
	} finally {
		isSearching.value = false
	}
}

// 清空搜索
const clearSearch = () => {
	searchQuery.value = ''
	searchResults.value = []
}

// 合并搜索结果和分组数据
const displayGroups = computed(() => {
	if (searchResults.value.length === 0) return contactGroups.value

	return [
		{
			id: 'search-results',
			title: '搜索结果',
			icon: Search,
			expanded: true,
			items: searchResults.value.map(user => ({
				id: user.id,
				name: user.name || user.username,
				avatar: user.avatar,
				description: `注册时间：${formatDate(user.createdAt)}`,
				isFriend: user.isFriend, // 传递好友状态
			})),
		},
	]
})

// 判断是否是当前用户
const isCurrentUser = computed(() => {
	if (!selectedContact.value) return false
	return selectedContact.value.id === userStore.userInfo?.id
})

// 判断是否已经是好友
const isFriend = computed(() => {
	if (!selectedContact.value) return false
	// 如果是搜索结果，使用 isFriend 字段
	if ('isFriend' in selectedContact.value) {
		return selectedContact.value.isFriend
	}
	// 如果是联系人列表中的用户，默认为好友
	return true
})

// 判断是否是好友请求
const isFriendRequest = computed(() => {
	if (!selectedContact.value) return false
	return newFriendRequests.value.some(req => req.from.id === selectedContact.value?.id)
})

// 处理添加好友
const handleAddFriend = async () => {
	if (!selectedContact.value) return
	if (isRequestPending.value) return

	try {
		isRequestPending.value = true
		// 使用当前用户 ID 作为 fromId
		await authApi.sendFriendRequest(userStore.userInfo!.id, selectedContact.value.id)
		toast({
			title: '已发送好友请求',
			description: `等待 ${selectedContact.value.name || selectedContact.value.username} 确认`,
		})
	} catch (error) {
		const apiError = handleApiError(error)
		toast({
			variant: 'destructive',
			title: '发送好友请求失败',
			description: apiError.message,
		})
	} finally {
		isRequestPending.value = false
	}
}

// 处理搜索结果
const handleSearchResult = (response: SearchUser[]) => {
	searchResults.value = response.map(user => ({
		...user,
		isFriend: false,
		description: `注册时间：${formatDate(user.createdAt)}`,
	}))
}

// 处理发送消息
const handleSendMessage = () => {
	if (!selectedContact.value) return;
	
	const chatId = selectedContact.value.chatId;
	if (!chatId) {
		toast({
			title: '聊天记录不存在',
		});
		return;
	}

	// 打印路由信息
	console.log('Current route:', router.currentRoute.value);
	console.log('Target route:', {
		name: 'chat',
		params: {
			chatId: chatId.toString()
		}
	});

	// 使用和 Home.vue 相同的跳转方式
	router.push({
		name: 'chat',  // 使用命名路由
		params: {
			chatId: chatId.toString()  // 确保转换为字符串
		}
	}).then(() => {
		console.log('Route changed to:', router.currentRoute.value);
	}).catch(err => {
		console.error('Route change failed:', err);
	});
	
	// 清除未读消息
	chatStore.clearUnread(chatId);
};

// 处理好友请求响应
const handleFriendRequest = async (requestId: number, action: 'accept' | 'reject') => {
	try {
		// 使用新定义的接口
		await authApi.respondToFriendRequest(requestId, action === 'accept' ? 'ACCEPTED' : 'REJECTED')

		// 从列表中移除该请求
		newFriendRequests.value = newFriendRequests.value.filter(req => req.id !== requestId)
		// 更新新朋友数量
		contactGroups.value[0].count = newFriendRequests.value.length

		toast({
			title: action === 'accept' ? '已同意' : '已拒绝',
			description: `您已${action === 'accept' ? '同意' : '拒绝'}了好友请求`,
		})
	} catch (error) {
		const apiError = handleApiError(error)
		toast({
			variant: 'destructive',
			title: '操作失败',
			description: apiError.message,
		})
	}
}

// 处理回车键搜索
const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Enter' && !e.shiftKey) {
		handleSearch()
	} else if (e.key === 'Escape') {
		clearSearch()
	}
}

// 处理分组展开/收起
const handleGroupToggle = (group: ContactGroup) => {
	group.expanded = !group.expanded
	// 如果是新朋友分组被展开，清除主布局中的角标
	if (group.id === 'new-friends' && group.expanded) {
		eventBus.emit('clear-friend-request-count')
	}
}

// 处理选择好友请求
const handleSelectFriendRequest = (request: FriendRequest) => {
	// 将好友请求的发送者信息转换为 SearchUser 类型
	const fromUser: SearchUser = {
		id: request.from.id,
		username: request.from.username,
		name: request.from.name,
		avatar: request.from.avatar,
		createdAt: request.createdAt,
		isFriend: false,
		description: request.message || '请求添加您为好友',
	}
	handleSelectContact(fromUser)
}

// 处理同意好友请求
const handleAcceptFriend = async () => {
	if (!selectedContact.value) return
	if (isRequestPending.value) return

	try {
		isRequestPending.value = true
		// 查找对应的好友请求
		const request = newFriendRequests.value.find(req => req.from.id === selectedContact.value?.id)
		if (request) {
			await handleFriendRequest(request.id, 'accept')
			// 更新选中联系人的好友状态
			if (selectedContact.value) {
				selectedContact.value.isFriend = true
			}
		}
	} finally {
		isRequestPending.value = false
	}
}
</script>



<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
	width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
	background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
	background-color: rgba(156, 163, 175, 0.5);
	border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background-color: rgba(156, 163, 175, 0.8);
}

/* 分组动画 */
.group {
	transition: all 0.2s ease;
}
</style>
