<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:39
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:42:20
 * @FilePath     : /src/views/Home/Home.vue
 * @Description  : 
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:28:39
-->
<template>
	<div class="flex h-full w-full">
		<!-- 会话列表 - 固定宽度 -->
		<div class="w-72 border-r bg-slate-50 flex flex-col min-w-0 shrink-0">
			<div class="h-14 border-b flex items-center px-4 shrink-0">
				<h2 class="font-medium">消息</h2>
			</div>

			<!-- 会话列表 -->
			<div class="flex-1 overflow-y-auto">
				<div v-if="chatsArray.length > 0">
					<div
						v-for="chat in chatsArray"
						:key="chat.id"
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
				</div>
				<div v-else class="flex flex-col items-center justify-center h-full p-6 text-center">
					<MessageSquare class="w-12 h-12 text-gray-300 mb-4" />
					<p class="text-gray-500">暂无聊天记录</p>
					<p class="text-sm text-gray-400 mt-2">在联系人中选择好友开始聊天</p>
				</div>
			</div>
		</div>

		<!-- 聊天区域 - 使用 overflow-hidden 和 min-w-0 控制溢出 -->
		<div class="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
			<template v-if="selectedChat">
				<!-- 头部 -->
				<div class="h-14 border-b flex items-center px-4 shrink-0">
					<div class="flex items-center truncate">
						<h2 class="font-medium truncate">
							{{ selectedChat?.otherUser?.username || selectedChat?.name || '聊天' }}
						</h2>
					</div>
				</div>

				<!-- 消息列表 -->
				<div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messageList">
					<template v-for="message in messageGroups" :key="message.id">
						<!-- 消息容器 -->
						<div
							class="flex items-start gap-2"
							:class="[message.sender?.id === userStore.userInfo?.id ? 'flex-row-reverse' : 'flex-row']"
						>
							<!-- 头像 -->
							<div class="flex-shrink-0">
								<img
									v-if="message.sender?.avatar"
									:src="message.sender.avatar"
									:alt="message.sender?.username || '用户头像'"
									class="w-8 h-8 rounded-lg hover:rounded-3xl transition-all duration-300"
								/>
								<div v-else class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
									<span class="text-slate-500 text-xs">
										{{ message.sender?.username?.[0]?.toUpperCase() || '?' }}
									</span>
								</div>
							</div>

							<!-- 消息内容 -->
							<div
								class="flex flex-col max-w-[70%]"
								:class="[message.sender?.id === userStore.userInfo?.id ? 'items-end' : 'items-start']"
							>
								<!-- 发送者名称 -->
								<div class="text-xs text-slate-400 mb-1">
									{{ message.sender?.username }}
								</div>

								<!-- 消息气泡 -->
								<div
									class="flex items-end gap-2"
									:class="[message.sender?.id === userStore.userInfo?.id ? 'flex-row-reverse' : 'flex-row']"
								>
									<div
										class="rounded-lg px-3 py-2 break-words"
										:class="[
											message.sender?.id === userStore.userInfo?.id
												? 'bg-blue-500 text-white'
												: 'bg-slate-100 text-slate-700',
										]"
									>
										{{ message.content }}
									</div>

									<!-- 消息状态（只在自己发送的消息上显示） -->
									<div
										v-if="message.sender?.id === userStore.userInfo?.id"
										class="text-xs text-slate-400 flex items-center"
									>
										<span v-if="message.status === 'SENDING'" class="animate-spin">
											<Loader2Icon class="w-3 h-3" />
										</span>
										<span v-else-if="message.status === 'SENT'">
											<CheckIcon class="w-3 h-3" />
										</span>
										<span v-else-if="message.status === 'DELIVERED'">
											<CheckCheckIcon class="w-3 h-3" />
										</span>
										<span v-else-if="message.status === 'FAILED'" class="text-red-500">
											<XIcon class="w-3 h-3" />
											<button class="ml-1 hover:text-red-600" @click="handleResend(message.id)">
												<RefreshCwIcon class="w-3 h-3" />
											</button>
										</span>
									</div>
								</div>
							</div>
						</div>
					</template>
				</div>

				<!-- 在消息列表底部显示打字指示器 -->
				<div v-if="typingUsers?.length > 0" class="flex items-center gap-2 mb-2">
					<div class="flex-shrink-0">
						<img v-if="getTypingUserAvatar()" :src="getTypingUserAvatar()" alt="用户头像" class="w-8 h-8 rounded-lg" />
						<div v-else class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
							<span class="text-slate-500 text-xs">?</span>
						</div>
					</div>
					<div class="bg-slate-100 rounded-lg p-2 px-3 flex items-center">
						<span class="text-sm text-slate-600 mr-2">{{ getTypingUserName() }}</span>
						<typing-indicator />
					</div>
				</div>

				<!-- 输入区域 -->
				<div class="h-32 border-t p-4 shrink-0">
					<div class="relative h-full flex">
						<!-- 输入框 - 添加 pr-24 给按钮预留空间 -->
						<textarea
							v-model="message"
							class="w-full h-full px-4 py-3 pr-24 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
							placeholder="输入消息..."
							@input="handleInput"
							@focusout="handleFocusOut"
							@keydown.enter.prevent="sendMessage"
						></textarea>

						<!-- 按钮组 - 使用绝对定位 -->
						<div class="absolute right-2 bottom-2 flex items-center space-x-2">
							<!-- 文件上传按钮 -->
							<input type="file" class="hidden" id="file-upload" @change="handleFileUpload" />
							<label
								for="file-upload"
								class="h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
							>
								<Paperclip class="w-4 h-4" />
							</label>

							<!-- 发送按钮 -->
							<button
								class="h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-50"
								:disabled="!message.trim()"
								@click="sendMessage"
							>
								发送
							</button>
						</div>
					</div>
				</div>
			</template>

			<!-- 未选中聊天时显示的提示 -->
			<template v-else>
				<div class="flex-1 flex items-center justify-center text-slate-400">
					<p>选择一个联系人开始聊天</p>
				</div>
			</template>
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
} from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { ChatTypingManager } from '@/utils/chat-typing'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { TypingStatusEvent, ChatParticipant } from './types'
import TypingIndicator from '@/components/ui/typing-indicator.vue'

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
	} else {
		// 如果没有最后一条消息，则获取最新的消息
		loadLatestMessages(chat.id)
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

// 加载最新的消息
const loadLatestMessages = async (chatId: number) => {
	try {
		// 显示加载状态
		isLoadingMessages.value = true

		// 调用API获取最新的消息
		const response = await messageService.getLatestMessages(chatId)

		// 更新消息存储
		if (response && Array.isArray(response)) {
			messageStore.setMessages(chatId, response)
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
				// 如果找不到聊天，可以重新获取聊天列表
				// chatStore.loadChats().then(() => {
				// 	const updatedChat = chats.value.get(Number(chatId))
				// 	if (updatedChat) {
				// 		selectedChat.value = updatedChat
				// 		chatStore.clearUnread(updatedChat.id)
				// 		wsService.joinChat(updatedChat.id)

				// 		// 加载消息
				// 		if (updatedChat.lastMessage) {
				// 			loadMessagesAround(updatedChat.id, updatedChat.lastMessage.id)
				// 		} else {
				// 			loadLatestMessages(updatedChat.id)
				// 		}

				// 		nextTick(() => {
				// 			scrollToBottom()
				// 		})
				// 	}
				// })
			}
		} else {
			selectedChat.value = null
		}
	},
	{ immediate: true }
)

// 格式化时间
const formatTime = (timestamp?: string) => {
	if (!timestamp) return ''

	try {
		return formatDistanceToNow(new Date(timestamp), {
			addSuffix: true,
			locale: zhCN,
		})
	} catch (error) {
		console.error('时间格式化错误:', error)
		return timestamp
	}
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
