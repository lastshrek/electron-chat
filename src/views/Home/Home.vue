<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:39
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 22:24:10
 * @FilePath     : /src/views/Home/Home.vue
 * @Description  : 
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:28:39
-->
<template>
	<div class="flex h-full w-full">
		<!-- 会话列表 - 固定宽度 -->
		<div class="w-72 border-r bg-slate-50 flex flex-col min-w-0 shrink-0">
			<!-- 修改顶部搜索区域 -->
			<div class="h-14 border-b flex items-center gap-2 px-3 shrink-0">
				<div class="flex-1 relative">
					<input
						type="text"
						v-model="searchQuery"
						placeholder="搜索消息..."
						class="w-full h-8 pl-8 pr-3 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<Search class="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
				</div>
				<button
					class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
					@click="handleNewChat"
				>
					<Plus class="w-5 h-5 text-gray-600" />
				</button>
			</div>

			<!-- 会话列表 -->
			<div class="flex-1 overflow-y-auto select-none">
				<div v-if="filteredChats.length > 0">
					<ContextMenu v-for="chat in filteredChats" :key="chat.id">
						<ContextMenuTrigger>
							<div
								class="flex items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors"
								:class="{ 'bg-blue-50': selectedChat?.id === chat.id }"
								@click="selectChat(chat)"
							>
								<!-- 头像 -->
								<div class="relative">
									<img
										:src="chat.otherUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Group'"
										:alt="chat.otherUser?.username || chat.name || '聊天'"
										class="w-12 h-12 rounded-full object-cover"
									/>
									<!-- 未读消息提示 -->
									<div
										v-if="chat.unreadCount > 0"
										class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
									>
										{{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
									</div>
								</div>

								<!-- 聊天信息 -->
								<div class="ml-3 flex-1 min-w-0">
									<div class="flex justify-between items-center">
										<h3 class="font-medium text-sm truncate">
											{{ chat.otherUser?.username || chat.name || '未命名聊天' }}
										</h3>
										<span class="text-xs text-gray-500">
											{{ formatTime(chat.lastMessage?.createdAt) }}
										</span>
									</div>
									<div class="flex justify-between items-center mt-1">
										<p class="text-sm text-gray-500 truncate">
											{{ getLastMessagePreview(chat.lastMessage) }}
										</p>
										<!-- 消息状态指示器 -->
										<div
											v-if="chat.lastMessage && chat.lastMessage.senderId === userStore.userInfo?.id"
											class="ml-2 flex-shrink-0"
										>
											<Check v-if="chat.lastMessage.status === 'SENT'" class="w-4 h-4 text-gray-400" />
											<CheckCheck v-else-if="chat.lastMessage.status === 'DELIVERED'" class="w-4 h-4 text-gray-400" />
											<CheckCheck v-else-if="chat.lastMessage.status === 'READ'" class="w-4 h-4 text-blue-500" />
											<AlertCircle v-else-if="chat.lastMessage.status === 'FAILED'" class="w-4 h-4 text-red-500" />
										</div>
									</div>
								</div>
							</div>
						</ContextMenuTrigger>

						<ContextMenuContent>
							<ContextMenuItem @click="handleMarkAsRead(chat.id)">
								<Reply class="mr-2 h-4 w-4" />
								<span>标记为已读</span>
							</ContextMenuItem>

							<ContextMenuItem @click="handlePinChat(chat.id)">
								<Forward class="mr-2 h-4 w-4" />
								<span>置顶聊天</span>
							</ContextMenuItem>

							<ContextMenuItem @click="handleMultiSelect">
								<CheckSquare class="mr-2 h-4 w-4" />
								<span>多选</span>
							</ContextMenuItem>

							<ContextMenuSeparator />

							<ContextMenuItem
								@click="handleDeleteChat(chat.id)"
								class="text-red-600 focus:text-red-600 focus:bg-red-50"
							>
								<Trash2 class="mr-2 h-4 w-4" />
								<span>删除会话</span>
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</div>
				<div v-else class="flex flex-col items-center justify-center h-full p-6 text-center select-none">
					<MessageSquare class="w-12 h-12 text-gray-300 mb-4" />
					<p class="text-gray-500">暂无聊天记录</p>
					<p class="text-sm text-gray-400 mt-2">在联系人中选择好友开始聊天</p>
				</div>
			</div>
		</div>

		<!-- 右侧聊天区域 -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- 聊天头部 -->
			<div class="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-white">
				<div class="flex items-center gap-2">
					<h2 class="font-medium">{{ selectedChat?.otherUser?.username || selectedChat?.name }}</h2>
					<TypingIndicator v-if="typingUsers.length > 0" :name="getTypingUserName()" :avatar="getTypingUserAvatar()" />
				</div>
			</div>

			<!-- 消息列表区域 -->
			<div ref="messageList" class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
				<template v-for="(message, index) in messageGroups" :key="message.id">
					<!-- 消息时间分割线 -->
					<div v-if="shouldShowTimestamp(message, messageGroups[index - 1])" class="flex justify-center my-2">
						<span class="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
							{{ formatMessageTime(message.createdAt) }}
						</span>
					</div>

					<!-- 消息气泡容器 -->
					<div
						class="flex items-start gap-2 px-2"
						:class="message.senderId === userStore.userInfo?.id ? 'flex-row-reverse' : ''"
					>
						<!-- 头像 -->
						<img
							:src="message.sender?.avatar"
							:alt="message.sender?.username"
							class="w-8 h-8 rounded-full flex-shrink-0"
						/>

						<!-- 消息内容区域 -->
						<div class="flex-1 min-w-0">
							<ContextMenu>
								<ContextMenuTrigger>
									<div
										class="group relative inline-block max-w-[70%]"
										:class="message.senderId === userStore.userInfo?.id ? 'float-right' : 'float-left'"
									>
										<!-- 发送者名称 -->
										<div v-if="message.senderId !== userStore.userInfo?.id" class="text-xs text-gray-500 mb-1 px-1">
											{{ message.sender?.username }}
										</div>

										<!-- 消息气泡 -->
										<div
											class="rounded-2xl px-4 py-2 shadow-sm"
											:class="[
												message.senderId === userStore.userInfo?.id
													? 'bg-blue-500 text-white'
													: 'bg-white text-gray-900',
											]"
										>
											<!-- 文本消息 -->
											<p v-if="message.type === 'TEXT'" class="whitespace-pre-wrap break-words text-sm">
												{{ message.content }}
											</p>

											<!-- 图片消息 -->
											<img
												v-else-if="message.type === 'IMAGE'"
												:src="message.content"
												class="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
												@click="previewImage(message.content)"
											/>

											<!-- 文件消息 -->
											<div
												v-else-if="message.type === 'FILE'"
												class="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
												@click="downloadFile(message.content)"
											>
												<Paperclip class="w-4 h-4" />
												<span class="text-sm">{{ message.metadata?.fileName }}</span>
											</div>
										</div>

										<!-- 消息状态 -->
										<div
											class="flex items-center gap-1 mt-1 px-1"
											:class="message.senderId === userStore.userInfo?.id ? 'justify-end' : 'justify-start'"
										>
											<span class="text-xs text-gray-400">
												{{ formatTime(message.createdAt) }}
											</span>
											<template v-if="message.senderId === userStore.userInfo?.id">
												<Check v-if="message.status === 'SENT'" class="w-3 h-3 text-gray-400" />
												<CheckCheck v-else-if="message.status === 'DELIVERED'" class="w-3 h-3 text-gray-400" />
												<CheckCheck v-else-if="message.status === 'READ'" class="w-3 h-3 text-blue-500" />
												<button
													v-else-if="message.status === 'FAILED'"
													class="text-red-500 hover:text-red-600 transition-colors"
													@click="handleResend(message.id)"
												>
													<RefreshCw class="w-3 h-3" />
												</button>
											</template>
										</div>
									</div>
								</ContextMenuTrigger>

								<ContextMenuContent>
									<!-- 引用回复 -->
									<ContextMenuItem @click="handleQuoteMessage(message)">
										<Reply class="mr-2 h-4 w-4" />
										<span>引用回复</span>
									</ContextMenuItem>

									<!-- 转发 -->
									<ContextMenuItem @click="handleForwardMessage(message)">
										<Forward class="mr-2 h-4 w-4" />
										<span>转发</span>
									</ContextMenuItem>

									<!-- 复制 - 仅文本消息显示 -->
									<ContextMenuItem v-if="message.type === 'TEXT'" @click="handleCopyMessage(message.content)">
										<Copy class="mr-2 h-4 w-4" />
										<span>复制</span>
									</ContextMenuItem>

									<!-- 撤回 - 仅自己的消息显示 -->
									<ContextMenuItem
										v-if="message.senderId === userStore.userInfo?.id"
										@click="handleRecallMessage(message.id)"
									>
										<RotateCcw class="mr-2 h-4 w-4" />
										<span>撤回</span>
									</ContextMenuItem>

									<ContextMenuSeparator />

									<!-- 删除 -->
									<ContextMenuItem
										@click="handleDeleteMessage(message.id)"
										class="text-red-600 focus:text-red-600 focus:bg-red-50"
									>
										<Trash2 class="mr-2 h-4 w-4" />
										<span>删除</span>
									</ContextMenuItem>
								</ContextMenuContent>
							</ContextMenu>
						</div>
					</div>
				</template>
			</div>

			<!-- 输入区域 -->
			<div class="border-t p-4 bg-white">
				<div class="flex items-end gap-2">
					<textarea
						v-model="message"
						rows="1"
						class="flex-1 resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="输入消息..."
						@input="handleInput"
						@keydown.enter.exact.prevent="sendMessage"
						@blur="handleStopTyping"
					/>
					<button
						class="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						:disabled="!message.trim()"
						@click="sendMessage"
					>
						发送
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { wsService } from '@/services/ws'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import type { ChatInfo } from '@/stores/chat'
import { useMessageStore } from '@/stores/message'
import { messageService } from '@/services/message'
import { toastService } from '@/services/toast'
import {
	Paperclip,
	Loader2Icon,
	CheckIcon,
	CheckCheckIcon,
	XIcon,
	RefreshCwIcon,
	MessageSquare,
	Check,
	CheckCheck,
	AlertCircle,
	RefreshCw,
	Search,
	Plus,
	Trash2,
	Reply,
	Forward,
	CheckSquare,
	Copy,
	RotateCcw,
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { ChatTypingManager } from '@/utils/chat-typing'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { TypingStatusEvent, ChatParticipant } from './types'
import TypingIndicator from '@/components/ui/typing-indicator.vue'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from '@/components/ui/context-menu'

const TAG = '🏠️ Home:'
const userStore = useUserStore()
const message = ref('')
const selectedChat = ref<ChatInfo | null>(null)
const chatStore = useChatStore()
const { chats } = storeToRefs(chatStore)
const messageStore = useMessageStore()
const route = useRoute()
const router = useRouter()

const messageGroups = computed(() => {
	if (!selectedChat.value) return []
	const messages = messageStore.getMessagesByChat(selectedChat.value.id)
	console.log('Current messages:', messages)
	return messages
})

const messageList = ref<HTMLElement | null>(null)

const typingUsers = ref<number[]>([])
const typingManager = ref<ChatTypingManager | null>(null)

// 加载状态
const isLoadingMessages = ref(false)

// 修改类型定义

// 修改参与者缓存的类型
const participantsCache = ref(new Map<number, Array<ChatParticipant>>())

// 修改获取其他参与者的方法
const getOtherParticipant = async (chat: ChatInfo) => {
	if (!userStore.userInfo) return null

	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)

	return otherParticipant || null
}

// 加载所有聊天的参与者信息
const loadAllParticipants = async () => {
	for (const chat of chats.value.values()) {
		await getOtherParticipant(chat)
	}
}

// 监听聊天列表变化
watch(
	() => chats.value,
	async newChats => {
		if (!newChats || !chatStore.initialized) return
		clearParticipantCache()
		await loadAllParticipants()
	},
	{ deep: true }
)

// 在组件挂载时加载参与者信息
onMounted(async () => {
	// 使用 loadChats 方法代替 fetchChats
	await chatStore.loadChats()

	if (selectedChat.value) {
		chatStore.clearUnread(selectedChat.value.id)
	}

	if (wsService.socket) {
		typingManager.value = new ChatTypingManager(wsService.socket)
		typingManager.value.on('typingStatusChanged', ({ chatId, userId, typing }: TypingStatusEvent) => {
			if (selectedChat.value?.id === chatId && userId !== userStore.userInfo?.id) {
				if (typing && !typingUsers.value.includes(userId)) {
					typingUsers.value.push(userId)
				} else if (!typing) {
					typingUsers.value = typingUsers.value.filter(id => id !== userId)
				}
			}
		})
	}

	// 如果路由中有chatId，选中对应的聊天
	if (route.params.chatId) {
		const chatId = Number(route.params.chatId)
		const chat = chats.value.get(chatId)
		if (chat) {
			selectedChat.value = chat
			chatStore.clearUnread(chat.id)
			// 加入聊天室
			wsService.joinChat(chat.id)
			nextTick(() => {
				scrollToBottom()
			})
		}
	}
})

// 监听聊天初始化完成
watch(
	() => chatStore.initialized,
	async newValue => {
		if (newValue) {
			console.log('聊天初始化完成，开始加载参与者信息')
			await loadAllParticipants()
		}
	}
)

// 清除缓存的辅助方法
const clearParticipantCache = (chatId?: number) => {
	if (chatId) {
		participantsCache.value.delete(chatId)
	} else {
		participantsCache.value.clear()
	}
}

// 选择聊天
const selectChat = (chat: ChatInfo) => {
	router.push(`/chat/${chat.id}`)
	chatStore.clearUnread(chat.id)

	// 如果有最后一条消息，则获取该消息周围的消息
	if (chat.lastMessage) {
		loadMessagesAround(chat.id, chat.lastMessage.id)
	}
	nextTick(() => {
		scrollToBottom()
	})
}

// 加载消息周围的消息
const loadMessagesAround = async (chatId: number, messageId: number) => {
	try {
		// 显示加载状态
		isLoadingMessages.value = true

		// 调用API获取消息周围的消息
		const response = await messageService.getMessagesAround(chatId, messageId)
		console.log('加载前20条消息的消息:', response)
		// 更新消息存储
		if (response) {
			messageStore.setMessages(chatId, response.messages)
		}
	} catch (error) {
		console.error('加载消息失败:', error)
		toastService.error('加载失败', '无法加载聊天记录')
	} finally {
		isLoadingMessages.value = false
	}
}

// 监听路由变化，自动选择聊天
watch(
	() => route.params.chatId,
	chatId => {
		if (chatId) {
			const chat = chats.value.get(Number(chatId))
			if (chat) {
				selectedChat.value = chat
				chatStore.clearUnread(chat.id)
				// 加入聊天室
				wsService.joinChat(chat.id)

				// 加载消息
				if (chat.lastMessage) {
					loadMessagesAround(chat.id, chat.lastMessage.id)
				}

				nextTick(() => {
					scrollToBottom()
				})
			} else {
				console.error('Chat not found:', chatId)
				// 可能需要添加错误提示
				toastService.error('聊天不存在', '请重新选择聊天')
				// 返回首页
				router.push('/')
			}
		} else {
			selectedChat.value = null
		}
	},
	{ immediate: true }
)

// 判断是否需要显示时间戳
const shouldShowTimestamp = (currentMessage: any, previousMessage: any) => {
	if (!previousMessage) return true

	const currentTime = new Date(currentMessage.createdAt)
	const previousTime = new Date(previousMessage.createdAt)

	// 如果两条消息间隔超过5分钟，显示时间戳
	const timeDiff = currentTime.getTime() - previousTime.getTime()
	const fiveMinutes = 5 * 60 * 1000

	return timeDiff > fiveMinutes
}

// 格式化消息时间
const formatMessageTime = (timestamp: string) => {
	return formatDistanceToNow(new Date(timestamp), {
		addSuffix: true,
		locale: zhCN,
	})
}

// 格式化时间
const formatTime = (timestamp: string) => {
	if (!timestamp) return ''

	const date = new Date(timestamp)
	const now = new Date()

	// 如果是今天的消息，只显示时间
	if (date.toDateString() === now.toDateString()) {
		return date.toLocaleTimeString('zh-CN', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// 如果是昨天的消息，显示"昨天"和时间
	const yesterday = new Date(now)
	yesterday.setDate(yesterday.getDate() - 1)
	if (date.toDateString() === yesterday.toDateString()) {
		return `昨天 ${date.toLocaleTimeString('zh-CN', {
			hour: '2-digit',
			minute: '2-digit',
		})}`
	}

	// 其他情况显示完整日期和时间
	return date.toLocaleString('zh-CN', {
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

// 修改发送消息的方法
const sendMessage = async () => {
	if (!message.value.trim() || !selectedChat.value) return

	handleStopTyping()
	console.log(TAG, '发送消息:', selectedChat.value)

	const otherParticipant = await getOtherParticipant(selectedChat.value)
	if (!otherParticipant) return toastService.error('发送失败', '找不到聊天对象')

	const success = await messageService.sendTextMessage(selectedChat.value.id, otherParticipant.id, message.value)

	if (success) {
		message.value = ''
	} else {
		toastService.error('发送失败', '请稍后重试')
	}
}

// 修改 handleFocusOut 的类型
const handleFocusOut = (event: FocusEvent) => {
	const target = event.relatedTarget as HTMLElement | null
	if (target?.closest('button')?.textContent?.trim() === '发送') {
		return
	}
	handleStopTyping()
}

// 修改文件上传方法
const handleFileUpload = async (event: Event) => {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	if (!file || !selectedChat.value) return

	const otherParticipant = await getOtherParticipant(selectedChat.value)
	if (!otherParticipant) {
		toastService.error('发送失败', '找不到聊天对象')
		return
	}

	let success = false
	if (file.type.startsWith('image/')) {
		success = await messageService.sendImageMessage(selectedChat.value.id, otherParticipant.id, file)
	} else {
		success = await messageService.sendFileMessage(selectedChat.value.id, otherParticipant.id, file)
	}

	if (!success) {
		toastService.error('发送失败', '请稍后重试')
	}

	// 清除input的值，允许重复上传相同文件
	input.value = ''
}

// 处理消息重发
const handleResend = async (messageId: number) => {
	const success = await messageStore.resendMessage(messageId)
	if (!success) {
		toastService.error('重发失败', '请稍后重试')
	}
}

// 滚动到底部
const scrollToBottom = () => {
	if (messageList.value) {
		messageList.value.scrollTop = messageList.value.scrollHeight
	}
}

// 监听消息变化，自动滚动到底部
watch(
	messageGroups,
	newMessages => {
		console.log('Messages updated:', newMessages)
		nextTick(() => {
			scrollToBottom()
		})
	},
	{ deep: true }
)

// 处理输入变化
const handleInput = () => {
	if (!selectedChat.value || !userStore.userInfo || !typingManager.value) return

	typingManager.value.startTyping(selectedChat.value.id, userStore.userInfo.id)
}

// 处理输入停止
const handleStopTyping = () => {
	if (!selectedChat.value || !userStore.userInfo || !typingManager.value) return

	typingManager.value.stopTyping(selectedChat.value.id, userStore.userInfo.id)
}

// 组件卸载时离开聊天室
onUnmounted(() => {
	if (selectedChat.value) {
		wsService.leaveChat(selectedChat.value.id)
	}
	clearTypingUsers()
	typingManager.value?.destroy()
})

// 获取最后一条消息的预览
const getLastMessagePreview = (message: any) => {
	if (!message) return '暂无消息'

	switch (message.type) {
		case 'TEXT':
			return message.content
		case 'IMAGE':
			return '[图片]'
		case 'FILE':
			return '[文件]'
		case 'VOICE':
			return '[语音]'
		case 'VIDEO':
			return '[视频]'
		default:
			return '新消息'
	}
}

// 将Map转换为数组以便在模板中使用
const chatsArray = computed(() => {
	return Array.from(chats.value.values())
})

// 获取正在输入的用户名
const getTypingUserName = () => {
	if (!typingUsers?.length) return ''

	// 获取第一个正在输入的用户
	const userId = typingUsers[0]
	console.log('获取打字用户名:', userId)

	// 从参与者列表中查找用户
	const participants = participantsCache.value.get(selectedChat.value?.id || 0) || []
	const user = participants.find(p => p.id === userId)

	return user?.username || '有人'
}

// 获取正在输入的用户头像
const getTypingUserAvatar = () => {
	if (!typingUsers?.length) return ''

	// 获取第一个正在输入的用户
	const userId = typingUsers[0]
	console.log('获取打字用户头像:', userId)

	// 从参与者列表中查找用户
	const participants = participantsCache.value.get(selectedChat.value?.id || 0) || []
	const user = participants.find(p => p.id === userId)

	return user?.avatar || ''
}

// 监听打字状态管理器变化
watch(typingManager, newManager => {
	if (newManager) {
		newManager.on('typingStatusChanged', ({ chatId, userId, typing }: TypingStatusEvent) => {
			console.log('打字状态变化:', { chatId, userId, typing, selectedChatId: selectedChat.value?.id })
			if (selectedChat.value?.id === chatId && userId !== userStore.userInfo?.id) {
				if (typing && !typingUsers.value.includes(userId)) {
					console.log('添加打字用户:', userId)
					typingUsers.value.push(userId)
				} else if (!typing) {
					console.log('移除打字用户:', userId)
					typingUsers.value = typingUsers.value.filter(id => id !== userId)
				}
			}
		})
	}
})

// 添加一个清除打字用户的方法
const clearTypingUsers = () => {
	typingUsers.value.splice(0, typingUsers.value.length)
}

// 在切换聊天时清除打字用户
watch(
	() => selectedChat.value,
	() => {
		console.log('聊天切换，清除打字用户')
		clearTypingUsers()
	}
)

// 添加搜索相关的状态和方法
const searchQuery = ref('')
const filteredChats = computed(() => {
	if (!searchQuery.value) return chatsArray.value

	const query = searchQuery.value.toLowerCase()
	return chatsArray.value.filter(chat => {
		const name = (chat.otherUser?.username || chat.name || '').toLowerCase()
		const lastMessage = (chat.lastMessage?.content || '').toLowerCase()
		return name.includes(query) || lastMessage.includes(query)
	})
})

// 新建聊天的处理方法
const handleNewChat = () => {
	router.push('/contacts')
}

// 添加处理函数
const handleMarkAsRead = (chatId: number) => {
	// TODO: 实现标记已读功能
	console.log('标记已读:', chatId)
}

const handlePinChat = (chatId: number) => {
	// TODO: 实现置顶功能
	console.log('置顶聊天:', chatId)
}

const handleDeleteChat = (chatId: number) => {
	// TODO: 实现删除功能
	console.log('删除聊天:', chatId)
}

const handleMultiSelect = () => {
	// TODO: 实现多选功能
	console.log('开启多选模式')
}

// 添加消息操作的处理函数
const handleQuoteMessage = (message: any) => {
	console.log('引用回复:', message)
}

const handleForwardMessage = (message: any) => {
	console.log('转发消息:', message)
}

const handleCopyMessage = (content: string) => {
	navigator.clipboard.writeText(content)
	toastService.success('已复制')
}

const handleRecallMessage = async (messageId: number) => {
	console.log('撤回消息:', messageId)
}

const handleDeleteMessage = async (messageId: number) => {
	console.log('删除消息:', messageId)
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
</style>
