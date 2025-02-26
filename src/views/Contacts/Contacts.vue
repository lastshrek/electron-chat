<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:08:47
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-26 19:00:23
 * @FilePath     : /src/views/Contacts/Contacts.vue
 * @Description  : Contacts page
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:08:47
-->
<template>
	<div class="flex h-full w-full">
		<!-- 左侧列表，固定宽度 -->
		<div class="w-80 border-r bg-slate-50 flex-shrink-0 h-full overflow-y-auto">
			<!-- 搜索框 -->
			<div class="p-4 border-b">
				<div class="relative">
					<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="搜索联系人"
						class="w-full pl-9 pr-16 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						v-model="searchKeyword"
						@input="debounceSearch"
						@keyup.enter="handleSearch"
					/>
					<!-- 搜索按钮 -->
					<button
						v-if="!searchKeyword"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700 transition-colors"
						@click="handleSearch"
					>
						<ArrowRight class="w-4 h-4" />
					</button>
					<!-- 清除按钮 -->
					<button
						v-else
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
						@click="clearSearch"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- 联系人分组列表 -->
			<div class="contacts-list" v-if="!searchKeyword">
				<div v-for="group in contactGroups" :key="group.id" class="group">
					<div class="flex items-center p-2 cursor-pointer hover:bg-slate-100" @click="toggleGroup(group)">
						<component :is="group.expanded ? ChevronDown : ChevronRight" class="w-4 h-4 mr-2" />
						<component :is="group.icon" class="w-4 h-4 mr-2" />
						<span class="text-sm">{{ group.title }}</span>
						<span class="ml-2 text-xs text-slate-400">({{ group.count }})</span>
					</div>

					<!-- 好友请求列表 -->
					<div v-if="group.id === 'new-friends'" class="pl-4">
						<div v-show="group.expanded">
							<div
								v-for="request in newFriendRequests"
								:key="request.id"
								class="flex items-center p-2 cursor-pointer hover:bg-slate-100"
								@click="
									handleSelectContact({
										id: request.from.id,
										username: request.from.username,
										name: request.from.username,
										avatar: request.from.avatar,
										description: `好友请求 - ${request.from.username}`,
										isFriend: false,
									})
								"
							>
								<div class="relative">
									<img :src="request.from.avatar" :alt="request.from.username" class="w-8 h-8 rounded-full mr-2" />
									<div
										class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
									>
										<span class="text-white text-xs">!</span>
									</div>
								</div>
								<span class="text-sm">{{ request.from.username }}</span>
								<span class="ml-2 text-xs text-blue-500">(请求添加好友)</span>
							</div>
							<div v-if="!newFriendRequests.length" class="p-2 text-sm text-gray-500">暂无好友请求</div>
						</div>
					</div>

					<!-- 组织架构内容 -->
					<div v-if="group.id === 'organization'" class="pl-4">
						<div v-show="group.expanded">
							<div v-if="organizationStructure.length > 0">
								<OrganizationTree
									v-for="node in organizationStructure"
									:key="node.id"
									:node="node"
									@select-department="handleSelectDepartment"
								/>
							</div>
							<div v-else class="p-2 text-sm text-gray-500">加载组织架构中...</div>
						</div>
					</div>

					<!-- 好友列表内容 -->
					<div v-if="group.id === 'friends'" class="pl-4">
						<div v-show="group.expanded">
							<div
								v-for="friend in friends"
								:key="friend.id"
								class="flex items-center p-2 cursor-pointer hover:bg-slate-100"
								@click="
									handleSelectContact({
										id: friend.id,
										username: friend.username,
										name: friend.name || friend.username,
										avatar: friend.avatar,
										description: friend.isFriend ? `好友 - ${friend.username}` : `用户 - ${friend.username}`,
										isFriend: true,
									})
								"
							>
								<img :src="friend.avatar" :alt="friend.username" class="w-8 h-8 rounded-full mr-2" />
								<span class="text-sm">{{ friend.name || friend.username }}</span>
							</div>
							<div v-if="!friends.length" class="p-2 text-sm text-gray-500">暂无好友</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 搜索结果 -->
			<div v-else class="contacts-list">
				<div class="group">
					<div class="flex items-center p-2 bg-blue-50">
						<Search class="w-4 h-4 mr-2 text-blue-500" />
						<span class="text-sm font-medium text-blue-700">搜索结果</span>
						<span class="ml-2 text-xs text-blue-500">({{ filteredFriends.length }})</span>
					</div>

					<div class="pl-4">
						<div
							v-for="user in filteredFriends"
							:key="user.id"
							class="flex items-center p-2 cursor-pointer hover:bg-slate-100"
							@click="
								handleSelectContact({
									id: user.id,
									username: user.username,
									name: user.name || user.username,
									avatar: user.avatar,
									description: user.isFriend ? `好友 - ${user.username}` : `用户 - ${user.username}`,
									isFriend: user.isFriend,
								})
							"
						>
							<img :src="user.avatar" :alt="user.username" class="w-8 h-8 rounded-full mr-2" />
							<span class="text-sm">{{ user.name || user.username }}</span>
							<span v-if="user.isFriend" class="ml-2 text-xs text-green-500">(好友)</span>
							<span v-else class="ml-2 text-xs text-blue-500">(非好友)</span>
						</div>

						<!-- 搜索无结果提示 -->
						<div v-if="filteredFriends.length === 0" class="p-4 text-center text-gray-500">未找到匹配的用户</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 右侧内容区域 -->
		<div class="flex-1 h-full flex flex-col overflow-hidden bg-white">
			<!-- 聊天详情 -->
			<div v-if="displayMode === 'chat'" class="h-full flex flex-col w-full">
				<div v-if="selectedContact" class="h-full">
					<!-- 详情头部 -->
					<div class="h-14 border-b flex items-center px-6">
						<h2 class="font-medium">
							{{ selectedContact.name || selectedContact.username }}
						</h2>
					</div>

					<!-- 详情内容 -->
					<div class="flex-1 p-6">
						<div class="max-w-md mx-auto">
							<!-- 头像 -->
							<div class="flex justify-center mb-6">
								<img
									:src="selectedContact.avatar"
									:alt="selectedContact.name || selectedContact.username || '用户头像'"
									class="w-24 h-24 rounded-2xl"
								/>
							</div>

							<!-- 基本信息 -->
							<div class="space-y-4">
								<div class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
									<span class="text-sm text-slate-500">用户名</span>
									<span class="font-medium">{{ selectedContact.name || selectedContact.username }}</span>
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
				</div>
				<div v-else class="h-full flex items-center justify-center text-gray-500">请选择联系人开始聊天</div>
			</div>

			<!-- 部门用户列表 -->
			<div v-else class="h-full flex flex-col w-full">
				<!-- 部门信息头部 -->
				<div v-if="selectedDepartment" class="flex-shrink-0 p-4 border-b w-full">
					<h2 class="text-lg font-medium flex items-center">
						<Users class="w-5 h-5 mr-2" />
						{{ selectedDepartment.name }}
						<span class="ml-2 text-sm text-gray-500">({{ selectedDepartment.userCount }}人)</span>
					</h2>
				</div>

				<!-- 用户列表，可滚动 -->
				<div class="flex-1 overflow-y-auto p-4 w-full">
					<!-- 加载状态 -->
					<div v-if="isLoadingUsers" class="h-full flex items-center justify-center">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
					</div>

					<!-- 用户列表 -->
					<template v-else>
						<div v-if="sortedDepartmentUsers.length > 0" class="grid grid-cols-2 gap-4 w-full">
							<div
								v-for="user in sortedDepartmentUsers"
								:key="user.id"
								class="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
								@click="handleDepartmentUserClick(user)"
							>
								<img
									:src="user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`"
									:alt="user.name"
									class="w-10 h-10 rounded-full mr-3"
								/>
								<div class="flex-1 min-w-0">
									<div class="font-medium truncate">{{ user.name }}</div>
									<div class="text-sm text-gray-500 truncate">
										{{ user.dutyName || '暂无职位' }}
									</div>
								</div>
							</div>
						</div>

						<!-- 未展开状态 -->
						<div
							v-else-if="selectedDepartment && !checkDepartmentInExpandedPath(selectedDepartment.id)"
							class="h-full flex flex-col items-center justify-center"
						>
							<Building2 class="w-12 h-12 mb-2 text-gray-400" />
							<p class="text-gray-500">请展开部门查看成员</p>
						</div>

						<!-- 空状态 -->
						<div v-else class="h-full flex flex-col items-center justify-center">
							<Users class="w-12 h-12 mb-2 text-gray-400" />
							<p class="text-gray-500">该部门暂无成员</p>
						</div>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
	Search,
	ChevronRight,
	ChevronDown,
	UserPlus,
	Users,
	MessageSquare,
	Phone,
	Video,
	Building2,
	ArrowRight,
	X,
} from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import { toastService } from '@/services/toast'
import { useUserStore } from '@/stores/user'
import { handleApiError } from '@/utils/error'
import { eventBus } from '@/utils/eventBus'
import type { FriendRequest, OrganizationNode, DepartmentUser, Friend } from '@/types/api'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import OrganizationTree from '@/components/OrganizationTree.vue'
// 导入拼音排序工具
import { pinyin } from 'pinyin-pro'
import router from '@/router'

// 定义常量
const TAG = '👨‍🚀 Contacts.vue'

// 初始化 store
const userStore = useUserStore()
const chatStore = useChatStore()

// 搜索相关
const searchKeyword = ref('')

// 添加防抖函数
let searchTimeout: number | null = null

const debounceSearch = () => {
	if (searchTimeout) {
		clearTimeout(searchTimeout)
	}

	searchTimeout = setTimeout(() => {
		handleSearch()
	}, 300) as unknown as number
}

// 类型定义
interface SearchUser {
	id: number
	username: string
	name: string
	avatar: string
	description?: string
	isFriend?: boolean
	chatId?: number
}

interface FriendListItem {
	id: number
	username: string
	name: string
	avatar: string
	description: string
	isFriend: boolean
}

interface ContactGroup {
	id: 'friends' | 'organization' | 'new-friends'
	title: string
	icon: any
	expanded: boolean
	count: number
	items: SearchUser[]
}

// 状态变量
const friends = ref<FriendListItem[]>([])
const selectedContact = ref<SearchUser | null>(null)
const selectedDepartment = ref<OrganizationNode | null>(null)
const departmentUsers = ref<DepartmentUser[]>([])
const isLoadingUsers = ref(false)

// 联系人分组
const contactGroups = ref<ContactGroup[]>([
	{
		id: 'new-friends',
		title: '新的朋友',
		icon: UserPlus,
		expanded: true,
		count: 0,
		items: [],
	},
	{
		id: 'friends',
		title: '我的好友',
		icon: Users,
		expanded: true,
		count: 0,
		items: [],
	},
	{
		id: 'organization',
		title: '组织架构',
		icon: Building2,
		expanded: false,
		count: 0,
		items: [],
	},
])

// 过滤后的好友列表
const filteredFriends = ref<FriendListItem[]>([])

// 新朋友列表
const newFriendRequests = ref<FriendRequest[]>([])

// 获取好友列表
const getFriendsList = async () => {
	try {
		const response = (await authApi.getFriends()) as unknown as Friend[]
		console.log('获取到的好友列表:', response)

		// 将好友列表转换为统一格式
		friends.value = response.map(friend => ({
			id: friend.friend.id,
			username: friend.friend.username,
			name: friend.friend.username, // 使用 username 作为 name
			avatar: friend.friend.avatar,
			description: `好友 - ${friend.friend.username}`,
			isFriend: true,
		}))

		// 初始化过滤后的好友列表
		filteredFriends.value = friends.value

		// 更新好友分组计数
		const friendsGroup = contactGroups.value.find(group => group.id === 'friends')
		if (friendsGroup) {
			friendsGroup.count = friends.value.length
		}
	} catch (error) {
		console.error('获取好友列表失败:', error)
		toastService.error('获取好友列表失败', '请稍后重试')
	}
}

// 初始化好友请求
const initFriendRequests = async () => {
	try {
		console.log(TAG, '开始获取好友请求')
		const response = await authApi.getFriendRequests('PENDING')
		console.log(TAG, '获取到的好友请求:', response)

		// 使用双重类型断言来安全地转换类型
		const requests = response as unknown as FriendRequest[]
		newFriendRequests.value = requests

		// 更新新朋友数量
		const newFriendsGroup = contactGroups.value.find(group => group.id === 'new-friends')
		if (newFriendsGroup) {
			newFriendsGroup.count = newFriendRequests.value.length
		}
	} catch (error) {
		console.error(TAG, '获取好友请求失败:', error)
		const apiError = handleApiError(error)
		toastService.error('获取好友请求失败', apiError.message)
	}
}

onMounted(async () => {
	await Promise.all([initFriendRequests(), getFriendsList(), initOrganizations()])

	// 监听新的好友请求
	eventBus.on('friend-request', data => {
		newFriendRequests.value.unshift(data.data.request)
		contactGroups.value[0].count = newFriendRequests.value.length
	})
})

onUnmounted(() => {
	eventBus.off('friend-request')
})

// 切换分组展开状态
const toggleGroup = (group: ContactGroup) => {
	console.log('切换分组状态:', group.id, group.expanded)
	group.expanded = !group.expanded
}

// 添加请求状态
const isRequestPending = ref(false)

// 添加状态变量来区分显示模式
const displayMode = ref<'chat' | 'department'>('chat')

// 检查部门是否在展开的路径上
const checkDepartmentInExpandedPath = (departmentId: string): boolean => {
	// 递归检查节点及其父节点是否展开
	const checkPath = (nodes: OrganizationNode[]): boolean => {
		for (const node of nodes) {
			if (node.id === departmentId) {
				return true // 找到目标节点
			}

			// 如果当前节点展开且有子节点，继续检查子节点
			if (node.expanded && node.children && node.children.length > 0) {
				const foundInChildren = checkPath(node.children)
				if (foundInChildren) {
					return true
				}
			}
		}
		return false
	}

	// 从根节点开始检查
	return checkPath(organizationStructure.value)
}

// 处理部门选择
const handleSelectDepartment = async (department: OrganizationNode, isExpanding: boolean) => {
	displayMode.value = 'department'
	selectedDepartment.value = department

	if (isExpanding) {
		// 展开节点时加载用户列表
		await fetchDepartmentUsers(department.id)
	} else {
		// 收起节点时清空用户列表
		departmentUsers.value = []
	}
}

// 排序后的用户列表
const sortedDepartmentUsers = computed(() => {
	return [...departmentUsers.value].sort((a, b) => {
		// 获取姓名的拼音
		const pinyinA = pinyin(a.name || '', { toneType: 'none' })
		const pinyinB = pinyin(b.name || '', { toneType: 'none' })

		// 按拼音排序
		return pinyinA.localeCompare(pinyinB)
	})
})

// 获取部门用户的方法
const fetchDepartmentUsers = async (departmentId: string) => {
	try {
		isLoadingUsers.value = true
		const response = await authApi.getDepartmentUsers(departmentId)
		if (response && Array.isArray(response)) {
			departmentUsers.value = response
		} else {
			departmentUsers.value = []
			console.error(TAG, '获取部门用户数据格式错误')
		}
	} catch (error) {
		console.error(TAG, '获取部门用户失败:', error)
		toastService.error('获取部门用户失败', '请稍后重试')
		departmentUsers.value = []
	} finally {
		isLoadingUsers.value = false
	}
}

// 修改用户选择处理方法
const handleSelectContact = (contact: SearchUser) => {
	displayMode.value = 'chat'
	selectedContact.value = contact
}

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
		toastService.success('已发送好友请求', `等待 ${selectedContact.value.name || selectedContact.value.username} 确认`)
	} catch (error) {
		const apiError = handleApiError(error)
		toastService.error('发送好友请求失败', apiError.message)
	} finally {
		isRequestPending.value = false
	}
}

// 处理发送消息
const handleSendMessage = () => {
	if (!selectedContact.value) return

	const chatId = selectedContact.value.chatId
	if (!chatId) {
		toastService.error('聊天记录不存在', '')
		return
	}

	// 打印路由信息
	console.log('Current route:', router.currentRoute.value)
	console.log('Target route:', {
		name: 'chat',
		params: {
			chatId: chatId.toString(),
		},
	})

	// 使用和 Home.vue 相同的跳转方式
	router
		.push({
			name: 'chat', // 使用命名路由
			params: {
				chatId: chatId.toString(), // 确保转换为字符串
			},
		})
		.then(() => {
			console.log('Route changed to:', router.currentRoute.value)
		})
		.catch(err => {
			console.error('Route change failed:', err)
		})

	// 清除未读消息
	chatStore.clearUnread(chatId)
}

// 处理好友请求响应
const handleFriendRequest = async (request: FriendRequest) => {
	try {
		isRequestPending.value = true
		await authApi.respondToFriendRequest(request.id, 'ACCEPTED')

		// 更新新朋友分组
		const newFriendsGroup = contactGroups.value.find(group => group.id === 'new-friends')
		if (newFriendsGroup) {
			newFriendsGroup.items = newFriendsGroup.items.filter(item => item.id !== request.from.id)
			newFriendsGroup.count = newFriendsGroup.items.length
		}

		// 更新好友分组
		const friendsGroup = contactGroups.value.find(group => group.id === 'friends')
		if (friendsGroup) {
			friendsGroup.items.push({
				id: request.from.id,
				username: request.from.username,
				name: request.from.username, // 使用 username 作为 name
				avatar: request.from.avatar,
				description: `好友 - ${request.from.username}`,
				isFriend: true,
			})
			friendsGroup.count = friendsGroup.items.length
		}

		toastService.success('添加好友成功', `已添加 ${request.from.username} 为好友`)
	} catch (error) {
		console.error(TAG, '处理好友请求失败:', error)
		toastService.error('处理好友请求失败', '请稍后重试')
	} finally {
		isRequestPending.value = false
	}
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
			await handleFriendRequest(request)
			// 更新选中联系人的好友状态
			if (selectedContact.value) {
				selectedContact.value.isFriend = true
			}
		}
	} finally {
		isRequestPending.value = false
	}
}

// 组织架构数据
const organizationStructure = ref<OrganizationNode[]>([])

// 初始化组织架构
const initOrganizations = async () => {
	try {
		const response = await authApi.getOrganizations()

		// 直接使用 response，因为它已经是数组了
		if (Array.isArray(response) && response.length > 0) {
			const orgData = response[0] // 获取根节点
			// 处理数据，保持后端返回的用户数量字段
			const processNode = (node: OrganizationNode): OrganizationNode => {
				// 处理子节点
				if (node.children && node.children.length > 0) {
					node.children = node.children.map(childNode => processNode(childNode))
				}

				// 直接返回节点，保持原有的 userCount 和 totalUserCount
				return {
					...node,
					// 如果后端没有返回这些字段，使用默认值 0
					userCount: node.userCount || 0,
					totalUserCount: node.totalUserCount || 0,
				}
			}

			// 处理整个组织架构树
			organizationStructure.value = [processNode(orgData)]

			// 添加到分组中
			const orgGroup = contactGroups.value.find(group => group.id === 'organization')
			if (orgGroup) {
				orgGroup.count = countTotalDepartments(organizationStructure.value)
				// 默认展开组织架构
				orgGroup.expanded = true
			}
		}
	} catch (error) {
		console.error('获取组织架构失败:', error)
		toastService.error('获取组织架构失败', '请稍后重试')
	}
}

// 修改计数方法以适应新的数据结构
const countTotalDepartments = (nodes: OrganizationNode[]): number => {
	return nodes.reduce((total, node) => {
		// 不计算根节点
		let count = node.type === 1 ? 1 : 0

		// 递归计算子节点
		if (node.children && node.children.length > 0) {
			count += countTotalDepartments(node.children)
		}

		return total + count
	}, 0)
}

// 处理部门用户点击
const handleDepartmentUserClick = (user: DepartmentUser) => {
	handleSelectContact({
		id: Number(user.id),
		username: user.name || '',
		name: user.name || '',
		avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || ''}`,
		description: user.dutyName || '暂无职位',
	})
}

// 处理搜索
const handleSearch = async () => {
	console.log('搜索关键词:', searchKeyword.value)

	// 如果搜索框为空，恢复原始列表
	if (!searchKeyword.value.trim()) {
		filteredFriends.value = friends.value
		return
	}

	try {
		// 调用搜索接口
		const searchResults = (await authApi.searchUsers(searchKeyword.value)) as unknown as SearchUser[]
		console.log('搜索结果:', searchResults)

		// 处理搜索结果
		if (Array.isArray(searchResults) && searchResults.length > 0) {
			// 将搜索结果转换为好友列表格式
			filteredFriends.value = searchResults.map(user => ({
				id: user.id,
				username: user.username,
				name: user.name || user.username,
				avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`,
				// 检查是否已经是好友
				isFriend: friends.value.some(friend => friend.id === user.id),
				description: user.description || `用户 - ${user.username}`,
			}))
			console.log('处理后的搜索结果:', filteredFriends.value)
		} else {
			// 如果没有搜索结果，显示空列表
			filteredFriends.value = []
		}
	} catch (error) {
		console.error('搜索用户失败:', error)
		toastService.error('搜索失败', '请稍后重试')
		// 搜索失败时，显示空列表
		filteredFriends.value = []
	}
}

// 清除搜索
const clearSearch = () => {
	searchKeyword.value = ''
	filteredFriends.value = []
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
