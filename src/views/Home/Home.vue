<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:39
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-03-02 22:09:48
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

				<!-- 使用 DropdownMenu 替换原来的按钮 -->
				<DropdownMenu>
					<DropdownMenuTrigger>
						<button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
							<Plus class="w-5 h-5 text-gray-600" />
						</button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" class="w-48">
						<DropdownMenuItem @click="showCreateGroupDialog = true">
							<Users class="mr-2 h-4 w-4" />
							<span>创建群聊</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<DropdownMenuItem @click="handleImportChat">
							<FolderInput class="mr-2 h-4 w-4" />
							<span>测试样式</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<!-- 会话列表 -->
			<ChatList
				:chats="filteredChats"
				:selected-chat-id="selectedChat?.id"
				@select="selectChat"
				@mark-as-read="handleMarkAsRead"
				@pin-chat="handlePinChat"
				@multi-select="handleMultiSelect"
				@delete-chat="handleDeleteChat"
			/>
		</div>

		<!-- 右侧聊天区域 -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- 聊天头部 -->
			<div class="h-14 border-b flex items-center px-4 justify-between shrink-0 bg-white">
				<div class="flex items-center gap-2">
					<h2 class="font-medium">{{ selectedChat?.otherUser?.username || selectedChat?.name }}</h2>
					<TypingIndicator v-if="typingUsers.length > 0" :name="getTypingUserName()" :avatar="getTypingUserAvatar()" />
				</div>

				<!-- 添加更多操作按钮 -->
				<button
					v-if="selectedChat"
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					@click="showChatInfo = true"
				>
					<MoreVertical class="w-5 h-5 text-gray-500" />
				</button>
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
						v-if="message.type !== MessageType.SYSTEM"
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
											class="rounded-2xl shadow-sm"
											:class="[
												message.type === 'IMAGE' || message.type === 'FILE'
													? 'p-0 bg-transparent shadow-none'
													: message.senderId === userStore.userInfo?.id
													? 'bg-blue-500 text-white'
													: 'bg-white text-gray-900',
											]"
										>
											<!-- 消息渲染部分 -->
											<div class="message-container">
												<div v-if="message.type === MessageType.TEXT">
													<TextMessage :message="message" />
												</div>
												<div v-else-if="message.type === MessageType.FILE">
													<FileMessage :message="message" />
												</div>
												<div v-else-if="message.type === MessageType.IMAGE">
													<ImageMessage :message="message" />
												</div>
												<div v-else-if="message.type === MessageType.VOICE">
													<VoiceMessage :message="message" />
												</div>
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

					<!-- 系统消息容器 -->
					<div v-else class="px-2">
						<SystemMessage :message="message" />
					</div>
				</template>
			</div>

			<!-- 输入区域 -->
			<div class="border-t p-4 bg-white">
				<div class="flex items-center gap-2">
					<!-- 消息输入框 -->
					<textarea
						v-model="message"
						rows="1"
						class="flex-1 resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="输入消息..."
						@input="handleInput"
						@keydown.enter.exact.prevent="sendMessage"
						@blur="handleStopTyping"
					/>

					<!-- 附件按钮 -->
					<button
						class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
						@click="triggerFileInput"
					>
						<Paperclip class="w-5 h-5" />
					</button>

					<!-- 发送按钮 -->
					<button
						class="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						:disabled="!message.trim()"
						@click="sendMessage"
					>
						<Send class="w-5 h-5" />
					</button>

					<!-- 隐藏的文件输入框 -->
					<input type="file" ref="fileInput" class="hidden" @change="handleFileUpload" />
				</div>
			</div>
		</div>
	</div>

	<!-- 添加创建群聊弹出框 -->
	<CreateGroupDialog v-model="showCreateGroupDialog" />

	<!-- 添加抽屉组件 -->
	<ChatInfoDrawer v-if="selectedChat" v-model="showChatInfo" :chat="selectedChat" />
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
	Send,
	Users,
	FolderInput,
	MoreVertical,
	Settings,
	LogOut,
	User,
	Eraser,
	Ban,
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
import { MessageType } from '@/types/message'
import type { Message } from '@/types/message'
import TextMessage from '@/components/chat/messages/TextMessage.vue'
import FileMessage from '@/components/chat/messages/FileMessage.vue'
import ImageMessage from '@/components/chat/messages/ImageMessage.vue'
import VoiceMessage from '@/components/chat/messages/VoiceMessage.vue'
import SystemMessage from '@/components/chat/messages/SystemMessage.vue'

import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import CreateGroupDialog from '@/components/dialogs/CreateGroupDialog.vue'
import ChatList from '@/components/chat/ChatList.vue'
import ChatInfoDrawer from '@/components/chat/ChatInfoDrawer.vue'
const TAG = '🏠️ Home:'
const userStore = useUserStore()
const message = ref('')
const chatStore = useChatStore()
const { chats, selectedChat } = storeToRefs(chatStore)
const messageStore = useMessageStore()
const route = useRoute()
const router = useRouter()

const messageGroups = computed(() => {
	if (!selectedChat.value) return []
	const messages = messageStore.getMessagesByChat(selectedChat.value.id)
	return messages
})

const messageList = ref<HTMLElement | null>(null)
const typingUsers = ref<number[]>([])
const typingManager = ref<ChatTypingManager | null>(null)
// 加载状态
const isLoadingMessages = ref(false)
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
			chatStore.setSelectedChat(chat)
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

// 修改选择聊天的方法
const selectChat = (chat: ChatInfo) => {
	router.push(`/chat/${chat.id}`)
	chatStore.clearUnread(chat.id)
	chatStore.setSelectedChat(chat)

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
				chatStore.setSelectedChat(chat)
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
			chatStore.setSelectedChat(null)
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

// 添加一个新的方法来触发文件输入
const triggerFileInput = () => {
	const input = document.createElement('input')
	input.type = 'file'
	// 移除文件类型限制，允许所有文件类型
	// input.accept = 'image/*,video/*,audio/*,application/pdf'
	input.onchange = handleFileUpload
	input.click()
}

// 处理文件上传
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

	try {
		// 根据文件类型选择处理方式
		if (file.type.startsWith('image/')) {
			success = await messageService.sendImageMessage(selectedChat.value.id, otherParticipant.id, file)
		} else if (file.type.startsWith('audio/')) {
			const duration = await getAudioDuration(file)
			success = await messageService.sendVoiceMessage(selectedChat.value.id, otherParticipant.id, file, duration)
		} else if (file.type.startsWith('video/')) {
			success = await messageService.sendVideoMessage(selectedChat.value.id, otherParticipant.id, file)
		} else {
			// 其他所有类型都作为普通文件处理
			success = await messageService.sendFileMessage(selectedChat.value.id, otherParticipant.id, file)
		}

		if (!success) {
			toastService.error('发送失败', '请稍后重试')
		}
	} catch (error) {
		console.error('文件上传失败:', error)
		toastService.error('发送失败', '请稍后重试')
	} finally {
		input.value = ''
	}
}

// 获取音频文件时长
const getAudioDuration = (file: File): Promise<number> => {
	return new Promise(resolve => {
		const audio = new Audio()
		audio.src = URL.createObjectURL(file)

		audio.addEventListener('loadedmetadata', () => {
			URL.revokeObjectURL(audio.src)
			resolve(audio.duration)
		})

		// 如果加载失败，返回0
		audio.addEventListener('error', () => {
			URL.revokeObjectURL(audio.src)
			resolve(0)
		})
	})
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
	if (!typingUsers.value?.length) return ''

	// 获取第一个正在输入的用户
	const userId = typingUsers.value[0]
	console.log('获取打字用户名:', userId)

	// 从参与者列表中查找用户
	const participants = participantsCache.value.get(selectedChat.value?.id || 0) || []
	const user = participants.find(p => p.id === userId)

	return user?.username || '有人'
}

// 获取正在输入的用户头像
const getTypingUserAvatar = () => {
	if (!typingUsers.value?.length) return ''

	// 获取第一个正在输入的用户
	const userId = typingUsers.value[0]
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
			if (selectedChat.value?.id === chatId && userId !== userStore.userInfo?.id) {
				if (typing && !typingUsers.value.includes(userId)) {
					typingUsers.value.push(userId)
				} else if (!typing) {
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

// 创建群聊
const showCreateGroupDialog = ref(false)

// 导入聊天记录
const handleImportChat = () => {
	// TODO: 实现导入聊天记录功能
	console.log('导入聊天记录')
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

// 下载文件和图片通用的处理函数
const handleDownloadFile = async (fileUrl: string) => {
	const success = await messageService.downloadFile(fileUrl)
	if (!success) {
		toastService.error('下载失败', '请稍后重试')
	}
}

// 图片预览
const handlePreviewImage = (imageUrl: string) => {
	// TODO: 实现图片预览功能，可以使用第三方库如 viewerjs
	window.open(imageUrl, '_blank')
}

const isDownloading = ref(false)

// 处理文件下载
const handleFileDownload = async (message: Message) => {
	if (isDownloading.value || !message.metadata?.url) return

	try {
		isDownloading.value = true
		await messageService.downloadFile(message.metadata.url)
	} catch (error) {
		console.error('下载文件失败:', error)
		// 可以添加错误提示
	} finally {
		isDownloading.value = false
	}
}

// 获取文件类型对应的样式
const getFileTypeClass = (mimeType?: string) => {
	if (!mimeType) return 'bg-gray-100'

	if (mimeType.startsWith('image/')) return 'bg-blue-50'
	if (mimeType.startsWith('video/')) return 'bg-purple-50'
	if (mimeType.startsWith('audio/')) return 'bg-green-50'
	if (mimeType.includes('pdf')) return 'bg-red-50'
	if (mimeType.includes('word')) return 'bg-blue-50'
	if (mimeType.includes('excel')) return 'bg-green-50'

	return 'bg-gray-100'
}

// 获取文件图标颜色
const getFileIconColor = (mimeType?: string) => {
	if (!mimeType) return 'text-gray-500'

	if (mimeType.startsWith('image/')) return 'text-blue-500'
	if (mimeType.startsWith('video/')) return 'text-purple-500'
	if (mimeType.startsWith('audio/')) return 'text-green-500'
	if (mimeType.includes('pdf')) return 'text-red-500'
	if (mimeType.includes('word')) return 'text-blue-500'
	if (mimeType.includes('excel')) return 'text-green-500'

	return 'text-gray-500'
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
	if (!bytes) return '未知大小'

	const units = ['B', 'KB', 'MB', 'GB']
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 获取聊天名称
const getChatName = (chat: ChatInfo) => {
	if (chat.type === 'GROUP') {
		return chat.name || '群聊'
	}
	return chat.otherUser?.username || '未命名聊天'
}

// 添加状态
const showChatInfo = ref(false)
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

/* 修改群组头像样式 */
.group-avatar {
	position: relative;
	width: 48px;
	height: 48px;
}

/* 默认群组头像样式 */
.group-avatar-default {
	width: 100%;
	height: 100%;
	border-radius: 0.5rem;
	object-fit: cover;
}

/* 头像堆叠效果样式保持不变 */
.group-avatar img:nth-child(1) {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 2;
}

.group-avatar img:nth-child(2) {
	position: absolute;
	bottom: 0;
	right: 0;
	z-index: 1;
}

/* 私聊头像样式 */
.private-avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	overflow: hidden;
}

.private-avatar img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}
</style>
