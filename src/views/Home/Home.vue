<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:39
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-21 23:33:50
 * @FilePath     : /src/views/Home/Home.vue
 * @Description  : 
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:28:39
-->
<template>
	<MainLayout>
		<!-- 会话列表 - 固定宽度 -->
		<div class="w-72 border-r bg-slate-50 flex flex-col min-w-0 shrink-0">
			<div class="h-14 border-b flex items-center px-4 shrink-0">
				<h2 class="font-medium">消息</h2>
			</div>

			<!-- 会话列表 -->
			<div class="flex-1 overflow-y-auto min-h-0">
				<div class="p-2 space-y-1">
					<!-- 会话列表项 -->
					<div
						v-for="chat in Array.from(chats.values())"
						:key="chat.id"
						class="p-3 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center space-x-3"
						:class="{ 'bg-slate-100': route.params.chatId === chat.id.toString() }"
						@click="selectChat(chat)"
					>
						<!-- 头像 -->
						<div class="relative">
							<AsyncImage
								:src="otherParticipants.get(chat.id)?.avatar"
								:alt="otherParticipants.get(chat.id)?.username"
								class="w-12 h-12 rounded-lg hover:rounded-3xl transition-all duration-300"
							/>
							<div
								v-if="chat.unreadCount > 0"
								class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
							>
								{{ chat.unreadCount }}
							</div>
						</div>

						<!-- 内容 -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center justify-between">
								<span class="font-medium truncate">
									{{ otherParticipants.get(chat.id)?.username }}
								</span>
								<span v-if="chat.lastMessage" class="text-xs text-slate-400">
									{{ formatTime(chat.lastMessage.timestamp) }}
								</span>
							</div>
							<div class="text-sm text-slate-500 truncate">
								{{ chat.lastMessage?.content || '暂无消息' }}
							</div>
						</div>
					</div>

					<!-- 无会话时显示提示 -->
					<div v-if="chats.size === 0" class="p-4 text-center text-slate-400 text-sm">
						暂无会话
					</div>
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
							{{ otherParticipants.get(selectedChat.id)?.username }}
						</h2>
					</div>
				</div>

				<!-- 消息列表 -->
				<div class="flex-1 overflow-y-auto p-4 space-y-8 min-h-0" ref="messageList">
					<div v-for="group in messageGroups" :key="group.date" class="space-y-4">
						<div class="text-center">
							<span class="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
								{{ group.date }}
							</span>
						</div>
						<div v-for="message in group.messages" :key="message.id" class="space-y-2">
							<div
								class="flex"
								:class="message.senderId === userStore.userInfo?.id ? 'justify-end' : 'justify-start'"
							>
								<div class="flex items-end space-x-1 max-w-[60%] min-w-0">
									<!-- 对方头像和消息 -->
									<template v-if="message.senderId !== userStore.userInfo?.id">
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

										<div
											class="px-4 py-2 rounded-2xl break-words bg-slate-100 rounded-tl-none w-full overflow-hidden"
										>
											<div class="break-all">{{ message.content }}</div>
										</div>
									</template>

									<!-- 自己的消息和头像 -->
									<template v-else>
										<div
											class="px-4 py-2 rounded-2xl break-words bg-primary text-primary-foreground rounded-tr-none w-full overflow-hidden"
										>
											<div class="break-all">{{ message.content }}</div>
										</div>

										<div class="text-xs text-slate-400">
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
											</span>
										</div>

										<img
											v-if="userStore.userInfo?.avatar"
											:src="userStore.userInfo.avatar"
											:alt="userStore.userInfo.username"
											class="w-8 h-8 rounded-lg hover:rounded-3xl transition-all duration-300"
										/>
										<div v-else class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
											<span class="text-slate-500 text-xs">
												{{ userStore.userInfo?.username?.[0]?.toUpperCase() || '?' }}
											</span>
										</div>
									</template>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 在消息列表和输入框之间显示正在输入的用户 -->
				<div 
					v-if="typingUsers.length > 0" 
					class="px-4 py-2 flex items-center bg-transparent"					
				>
					<div class="inline-flex items-center space-x-2 rounded-full px-3 py-1.5">
						<!-- 用户头像 -->
						<div class="flex -space-x-2">
							<img
								v-for="userId in typingUsers.slice(0, 2)"
								:key="userId"
								:src="chats.get(Number(route.params.chatId))?.participants.find(p => p.id === userId)?.avatar"
								:alt="chats.get(Number(route.params.chatId))?.participants.find(p => p.id === userId)?.username"
								class="w-6 h-6 rounded-full border-2 border-white"
							/>
							<div
								v-if="typingUsers.length > 2"
								class="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center"
							>
								<span class="text-xs text-slate-500">+{{ typingUsers.length - 2 }}</span>
							</div>
						</div>
						<!-- 打字指示器 -->
						<TypingIndicator />
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
							<input
								type="file"
								class="hidden"
								id="file-upload"
								@change="handleFileUpload"
							/>
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
	</MainLayout>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { wsService } from '@/services/ws'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import type { ChatInfo } from '@/stores/chat'
import { useMessageStore } from "@/stores/message"
import {messageService} from "@/services/message";
import {toast} from "@/components/ui/toast";
import {
	Paperclip,
	Loader2Icon,
	CheckIcon,
	CheckCheckIcon,
	XIcon,
	RefreshCwIcon,
} from "lucide-vue-next";
import {useRoute, useRouter} from 'vue-router';
import { ChatTypingManager } from '@/utils/chat-typing';
import TypingIndicator from '@/components/ui/typing-indicator.vue';
import AsyncImage from '@/components/ui/async-image.vue';
const TAG = '🏠️Home:';
const userStore = useUserStore()
const message = ref('')
const selectedChat = ref<ChatInfo | null>(null)
const chatStore = useChatStore()
const { chats } = storeToRefs(chatStore)
const messageStore = useMessageStore()
const route = useRoute();
const router = useRouter();

const messageGroups = computed(() => 
	selectedChat.value 
		? messageStore.getMessagesByChat(selectedChat.value.id)
		: []
)

const messageList = ref<HTMLElement | null>(null);

const typingUsers = ref<number[]>([]);
const typingManager = ref<ChatTypingManager>();

// 修改类型定义
interface ChatParticipant {
	chat_id: number;
	user_id: number;
	role: string;
	username: string;
	avatar: string;
	id: number; // 添加 id 字段
}

interface OtherParticipant {
	username: string;
	avatar: string;
	user_id: number;
	chat_id: number;
	friendship_id?: number;
	friend_since?: string;
	id: number; // 添加 id 字段
}

// 修改参与者缓存的类型
const participantsCache = ref(new Map<number, Array<ChatParticipant>>());

// 修改其他参与者信息的类型
const otherParticipants = ref(new Map<number, OtherParticipant>());

// 修改获取其他参与者的方法
const getOtherParticipant = async (chat: ChatInfo) => {
	if (!window.electron?.ipcRenderer) return null;
	
	try {
		if (!participantsCache.value.has(chat.id)) {
			console.log(TAG, '从数据库获取聊天参与者:', chat.id);
			const participants = await window.electron.ipcRenderer.invoke('db:getChatParticipants', chat.id);
			participantsCache.value.set(chat.id, participants);
			
			const otherParticipant = participants.find(p => p.user_id !== userStore.userInfo?.id);
			if (otherParticipant) {
				otherParticipants.value.set(chat.id, {
					username: otherParticipant.username,
					avatar: otherParticipant.avatar,
					user_id: otherParticipant.user_id,
					chat_id: otherParticipant.chat_id,
					id: otherParticipant.id,
					friendship_id: otherParticipant.friendship_id,
					friend_since: otherParticipant.friend_since
				});
			}
		}
		
		return otherParticipants.value.get(chat.id);
	} catch (error) {
		console.error(TAG, '获取聊天参与者失败:', error);
		return null;
	}
};

// 加载所有聊天的参与者信息
const loadAllParticipants = async () => {
	for (const chat of chats.value.values()) {
		await getOtherParticipant(chat);
	}
};

// 监听聊天列表变化
watch(
	() => chats.value,
	async (newChats) => {
		if (!newChats) return;
		clearParticipantCache();
		await loadAllParticipants();
	},
	{ deep: true }
);

// 在组件挂载时加载参与者信息
onMounted(loadAllParticipants);

// 在模板中使用的计算属性
const otherParticipantMap = computed(() => {
	const map = new Map<number, {
		username: string;
		avatar: string;
		user_id: number;
	} | null>();
	
	Array.from(chats.value.values()).forEach(async chat => {
		const participant = await getOtherParticipant(chat);
		if (participant) {
			map.set(chat.id, {
				username: participant.username,
				avatar: participant.avatar,
				user_id: participant.user_id
			});
		}
	});
	
	return map;
});

// 清除缓存的辅助方法
const clearParticipantCache = (chatId?: number) => {
	if (chatId) {
		participantsCache.value.delete(chatId);
	} else {
		participantsCache.value.clear();
	}
};

// 选择聊天
const selectChat = (chat: ChatInfo) => {
	router.push({
		name: 'chat',
		params: {
			chatId: chat.id.toString()
		}
	});
	chatStore.clearUnread(chat.id);
	nextTick(() => {
		scrollToBottom();
	});
}

// 监听路由变化，自动选择聊天
watch(
	() => route.params.chatId,
	(chatId) => {
		console.log('Route chatId changed:', chatId);
		console.log('Available chats:', Array.from(chats.value.entries()));
		
		if (chatId) {
			const chat = chats.value.get(Number(chatId));
			console.log('Found chat:', chat);
			if (chat) {
				selectedChat.value = chat;
				chatStore.clearUnread(chat.id);
				// 加入聊天室
				wsService.joinChat(chat.id);
				nextTick(() => {
					scrollToBottom();
				});
			} else {
				console.error('Chat not found:', chatId);
				// 可能需要添加错误提示
				toast({
					variant: 'destructive',
					title: '聊天不存在',
					description: '请重新选择聊天'
				});
			}
		} else {
			selectedChat.value = null;
		}
	},
	{ immediate: true }
);

// 格式化时间
const formatTime = (timestamp: string) => {
	const date = new Date(timestamp)
	const now = new Date()
	const diff = now.getTime() - date.getTime()

	// 24小时内显示时间
	if (diff < 24 * 60 * 60 * 1000) {
		return date.toLocaleTimeString('zh-CN', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}
	// 超过24小时显示日期
	return date.toLocaleDateString('zh-CN', {
		month: '2-digit',
		day: '2-digit',
	})
}

// 修改发送消息的方法
const sendMessage = async () => {
	if (!message.value.trim() || !selectedChat.value) return;

	handleStopTyping();
	console.log(TAG, '发送消息:', selectedChat.value);
	
	const otherParticipant = await getOtherParticipant(selectedChat.value);
	if (!otherParticipant) {
		toast({
			variant: "destructive",
			title: "发送失败",
			description: "找不到聊天对象",
		});
		return;
	}

	const success = await messageService.sendTextMessage(
		selectedChat.value.id,
		otherParticipant.user_id,
		message.value
	);

	if (success) {
		message.value = "";
	} else {
		toast({
			variant: "destructive",
			title: "发送失败",
			description: "请稍后重试",
		});
	}
};

// 修改 handleFocusOut 的类型
const handleFocusOut = (event: FocusEvent) => {
	const target = event.relatedTarget as HTMLElement | null;
	if (target?.closest('button')?.textContent?.trim() === '发送') {
		return;
	}
	handleStopTyping();
};

// 修改文件上传方法
const handleFileUpload = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file || !selectedChat.value) return;

	const otherParticipant = await getOtherParticipant(selectedChat.value);
	if (!otherParticipant) {
		toast({
			variant: "destructive",
			title: "发送失败",
			description: "找不到聊天对象",
		});
		return;
	}

	let success = false;
	if (file.type.startsWith("image/")) {
		success = await messageService.sendImageMessage(
			selectedChat.value.id,
			otherParticipant.user_id,
			file
		);
	} else {
		success = await messageService.sendFileMessage(
			selectedChat.value.id,
			otherParticipant.user_id,
			file
		);
	}

	if (!success) {
		toast({
			variant: "destructive",
			title: "发送失败",
			description: "请稍后重试",
		});
	}

	// 清除input的值，允许重复上传相同文件
	input.value = "";
};

// 处理消息重发
const handleResend = async (messageId: number) => {
	const success = await messageStore.resendMessage(messageId);
	if (!success) {
		toast({
			variant: "destructive",
			title: "重发失败",
			description: "请稍后重试",
		});
	}
};

// 滚动到底部
const scrollToBottom = () => {
	if (messageList.value) {
		messageList.value.scrollTop = messageList.value.scrollHeight;
	}
};

// 监听消息变化，自动滚动到底部
watch(messageGroups, () => {
	nextTick(() => {
		scrollToBottom();
	});
});

// 在进入页面时清除该页面聊天的未读数
onMounted(() => {
	if (selectedChat.value) {
		chatStore.clearUnread(selectedChat.value.id)
	}

	if (wsService.socket) {
		typingManager.value = new ChatTypingManager(wsService.socket);
		typingManager.value.on('typingStatusChanged', ({ chatId, userId, typing }) => {
			if (selectedChat.value?.id === chatId && userId !== userStore.userInfo?.id) {
				if (typing && !typingUsers.value.includes(userId)) {
					typingUsers.value.push(userId);
				} else if (!typing) {
					typingUsers.value = typingUsers.value.filter(id => id !== userId);
				}
			}
		});
	}
});

// 处理输入变化
const handleInput = () => {
	if (!selectedChat.value || !userStore.userInfo || !typingManager.value) return;
	
	typingManager.value.startTyping(selectedChat.value.id, userStore.userInfo.id);
};

// 处理输入停止
const handleStopTyping = () => {
	if (!selectedChat.value || !userStore.userInfo || !typingManager.value) return;
	
	typingManager.value.stopTyping(selectedChat.value.id, userStore.userInfo.id);
};

// 组件卸载时离开聊天室
onUnmounted(() => {
	if (selectedChat.value) {
		wsService.leaveChat(selectedChat.value.id);
	}
	typingManager.value?.destroy();
});
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
