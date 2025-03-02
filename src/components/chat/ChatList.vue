<template>
	<div class="flex-1 overflow-y-auto select-none">
		<div v-if="chats.length > 0">
			<ContextMenu v-for="chat in chats" :key="chat.id">
				<ContextMenuTrigger>
					<div
						class="flex items-center p-4 cursor-pointer hover:bg-slate-100 transition-colors"
						:class="{ 'bg-blue-50': selectedChatId === chat.id }"
						@click="$emit('select', chat)"
					>
						<!-- 头像 -->
						<div class="relative">
							<!-- 群聊头像 -->
							<template v-if="chat.type === 'GROUP'">
								<div class="relative w-12 h-12">
									<template v-if="chat.avatar">
										<img :src="chat.avatar" :alt="chat.name || '群聊'" class="w-12 h-12 rounded-lg object-cover" />
									</template>
									<template v-else>
										<!-- 群组头像堆叠效果 -->
										<div class="absolute top-0 left-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
											<img
												:src="chat.participants[0]?.avatar"
												class="w-8 h-8 rounded-lg object-cover"
												:alt="chat.participants[0]?.username"
											/>
										</div>
										<div
											class="absolute bottom-0 right-0 w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center"
										>
											<img
												:src="chat.participants[1]?.avatar"
												class="w-8 h-8 rounded-lg object-cover"
												:alt="chat.participants[1]?.username"
											/>
										</div>
									</template>
								</div>
							</template>
							<!-- 私聊头像 -->
							<template v-else>
								<div class="w-12 h-12">
									<img
										:src="getPrivateChatAvatar(chat)"
										:alt="getPrivateChatName(chat)"
										class="w-full h-full rounded-full object-cover"
									/>
								</div>
							</template>

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
								<div class="flex items-center">
									<h3 class="font-medium text-sm truncate">
										{{ getChatName(chat) }}
									</h3>
									<!-- 群聊显示成员数量，私聊显示职务 -->
									<template v-if="chat.type === 'GROUP'">
										<span class="ml-2 text-xs text-gray-500">({{ chat.participants.length }}人)</span>
									</template>
									<template v-else>
										<span class="ml-2 text-xs text-gray-500">{{ getPrivateChatDuty(chat) }}</span>
									</template>
								</div>
								<span class="text-xs text-gray-500">
									{{ formatTime(chat.lastMessage?.createdAt || chat.updatedAt || '') }}
								</span>
							</div>
							<div class="flex justify-between items-center mt-1">
								<!-- 消息预览 -->
								<p
									class="text-sm truncate"
									:class="{
										'text-gray-500': !chat.lastMessage?.type || chat.lastMessage.type !== MessageType.SYSTEM,
										'system-message-preview': chat.lastMessage?.type === MessageType.SYSTEM,
									}"
								>
									<template v-if="chat.lastMessage">
										<!-- 系统消息不显示发送者 -->
										<span
											v-if="
												chat.type === 'GROUP' && chat.lastMessage.type !== MessageType.SYSTEM && chat.lastMessage.sender
											"
											class="text-gray-600 mr-1"
										>
											{{ chat.lastMessage.sender.username }}:
										</span>
										<!-- 系统消息添加前缀 -->
										<template v-if="chat.lastMessage.type === MessageType.SYSTEM">
											<span class="ml-1">{{ getLastMessagePreview(chat.lastMessage) }}</span>
										</template>
										<template v-else>
											{{ getLastMessagePreview(chat.lastMessage) }}
										</template>
									</template>
								</p>
								<!-- 系统消息不显示状态指示器 -->
								<MessageStatusIndicator
									v-if="
										chat.lastMessage &&
										chat.lastMessage.type !== MessageType.SYSTEM &&
										chat.lastMessage.senderId === userStore.userInfo?.id
									"
									:status="getMessageStatus(chat.lastMessage)"
								/>
							</div>
						</div>
					</div>
				</ContextMenuTrigger>

				<ContextMenuContent>
					<ContextMenuItem @click="$emit('markAsRead', chat.id)">
						<Reply class="mr-2 h-4 w-4" />
						<span>标记为已读</span>
					</ContextMenuItem>

					<ContextMenuItem @click="$emit('pinChat', chat.id)">
						<Forward class="mr-2 h-4 w-4" />
						<span>置顶聊天</span>
					</ContextMenuItem>

					<ContextMenuItem @click="$emit('multiSelect')">
						<CheckSquare class="mr-2 h-4 w-4" />
						<span>多选</span>
					</ContextMenuItem>

					<ContextMenuSeparator />

					<ContextMenuItem
						@click="$emit('deleteChat', chat.id)"
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
</template>

<script setup lang="ts">
import type { ChatInfo } from '@/stores/chat'
import type { Message } from '@/types/message'
import { MessageStatus, MessageType } from '@/types/message'
import { useUserStore } from '@/stores/user'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { Reply, Forward, CheckSquare, Trash2, MessageSquare } from 'lucide-vue-next'
import MessageStatusIndicator from './MessageStatusIndicator.vue'

defineProps<{
	chats: ChatInfo[]
	selectedChatId?: number
}>()

defineEmits<{
	select: [chat: ChatInfo]
	markAsRead: [chatId: number]
	pinChat: [chatId: number]
	multiSelect: []
	deleteChat: [chatId: number]
}>()

const userStore = useUserStore()

// 获取私聊对象的头像
const getPrivateChatAvatar = (chat: ChatInfo) => {
	if (!userStore.userInfo) return ''
	// 找到对方的信息
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.avatar || 'https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=default'
}

// 获取私聊对象的名称
const getPrivateChatName = (chat: ChatInfo) => {
	if (!userStore.userInfo) return '未知用户'
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.username || '未知用户'
}

// 获取私聊对象的职务
const getPrivateChatDuty = (chat: ChatInfo) => {
	if (!userStore.userInfo) return ''
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.dutyName || ''
}

// 获取聊天名称
const getChatName = (chat: ChatInfo) => {
	if (chat.type === 'GROUP') {
		return chat.name || '群聊'
	}
	return getPrivateChatName(chat)
}

// 格式化时间
const formatTime = (time: string) => {
	if (!time) return ''
	return formatDistanceToNow(new Date(time), { locale: zhCN, addSuffix: true })
}

// 获取最后一条消息预览
const getLastMessagePreview = (message: any) => {
	if (!message) return ''

	switch (message.type) {
		case MessageType.SYSTEM:
			return message.content
		case MessageType.TEXT:
			return message.content
		case MessageType.IMAGE:
			return '[图片]'
		case MessageType.FILE:
			return '[文件]'
		case MessageType.VOICE:
			return '[语音]'
		case MessageType.VIDEO:
			return '[视频]'
		default:
			return '新消息'
	}
}

// 获取消息预览样式
const getMessagePreviewClass = (message: any) => {
	if (!message) return 'text-gray-500'

	return {
		'text-gray-500': message.type !== MessageType.SYSTEM,
		'text-blue-500': message.type === MessageType.SYSTEM, // 系统消息使用蓝色
		italic: message.type === MessageType.SYSTEM, // 系统消息使用斜体
	}
}

// 获取消息状态
const getMessageStatus = (message: Message): MessageStatus => {
	return message.status || MessageStatus.SENT
}
</script>

<style scoped>
/* 滚动条样式 */
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

/* 系统消息预览样式 */
.system-message-preview {
	color: #666666;
}
</style>
