import { defineStore } from 'pinia'
import { eventBus } from '@/utils/eventBus'
import { useUserStore } from '@/stores/user'
import { io } from 'socket.io-client'
import { chatApi } from '@/api/chat'
import { awaitTo } from '@/utils/await'
import { MessageStatus, MessageType } from '@/types/message'
import { Message } from '@/types/message'

export interface ChatInfo {
	id: number
	name: string | null
	type: 'DIRECT' | 'GROUP'
	participants: Array<{
		id: number
		username: string
		avatar: string
	}>
	lastMessage?: Message
	unreadCount: number
	otherUser?: {
		id: number
		username: string
		avatar: string
	}
}

export const useChatStore = defineStore('chat', {
	state: () => ({
		socket: null as any,
		connected: false,
		chats: new Map<number, ChatInfo>(),
		initialized: false,
		_lastUnreadTotal: 0, // 添加一个内部状态来跟踪上一次的未读总数
	}),

	getters: {
		unreadTotal: state => {
			let total = 0
			state.chats.forEach(chat => {
				total += chat.unreadCount || 0
			})
			return total
		},
	},

	actions: {
		initSocket() {
			const userStore = useUserStore()
			if (!userStore.token) {
				console.warn('未登录，无法初始化 socket')
				return
			}

			// 确保不会重复连接
			if (this.socket?.connected) {
				console.log('socket 已连接，跳过初始化')
				return
			}

			try {
				// 创建 socket 实例
				this.socket = io(import.meta.env.VITE_WS_URL, {
					auth: {
						token: userStore.token,
					},
					transports: ['websocket'],
				})

				// 监听连接事件
				this.socket.on('connect', async () => {
					console.log('socket 连接成功')
					this.connected = true
					this.initialized = true

					// socket 连接成功后加载聊天列表
					await this.loadChats()
				})

				// 监听断开连接事件
				this.socket.on('disconnect', () => {
					console.log('socket 断开连接，尝试重连')
					this.connected = false
					setTimeout(() => {
						this.initSocket()
					}, 3000)
				})

				// 监听错误事件
				this.socket.on('error', (error: any) => {
					console.error('socket 错误:', error)
					this.connected = false
				})
			} catch (error) {
				console.error('初始化 socket 失败:', error)
				this.connected = false
			}
		},

		disconnectSocket() {
			if (this.socket) {
				this.socket.disconnect()
				this.socket = null
				this.connected = false
			}
		},

		setChat(chat: ChatInfo) {
			this.chats.set(chat.id, chat)
		},

		removeChat(chatId: number) {
			this.chats.delete(chatId)
		},

		// 私有方法：只在未读总数真正变化时触发事件
		_emitUnreadUpdate() {
			const currentTotal = this.unreadTotal
			if (currentTotal !== this._lastUnreadTotal) {
				this._lastUnreadTotal = currentTotal
				eventBus.emit('unread-count-updated', currentTotal)
			}
		},

		clearUnread(chatId: number) {
			const chat = this.chats.get(chatId)
			if (chat && chat.unreadCount > 0) {
				chat.unreadCount = 0
				this._emitUnreadUpdate()
			}
		},

		updateLastMessage(chatId: number, message: Partial<Message>) {
			const chat = this.chats.get(chatId)
			if (chat) {
				chat.lastMessage = {
					...chat.lastMessage,
					...message,
				} as Message
			}
		},

		incrementUnread(chatId: number) {
			const chat = this.chats.get(chatId)
			if (chat) {
				chat.unreadCount = (chat.unreadCount || 0) + 1
				this._emitUnreadUpdate()
			}
		},

		async initialize() {
			if (this.initialized) {
				console.log('聊天 store 已经初始化过')
				return
			}

			try {
				await this.loadChats()
				this.initialized = true
			} catch (error) {
				console.error('聊天 store 初始化失败:', error)
				throw error
			}
		},

		async loadChats() {
			try {
				const [res] = await awaitTo(chatApi.getChats({ limit: 20, page: 1 }))

				const chats = res

				if (chats.chats.length === 0) return console.log('当前暂无聊天')

				// 清空现有聊天列表
				this.chats.clear()

				// 添加新的聊天
				for (const chat of chats.chats) {
					this.setChat({
						id: chat.id,
						name: chat.name,
						type: chat.type,
						participants: chat.participants,
						lastMessage: chat.lastMessage || undefined,
						unreadCount: chat.unreadCount,
						otherUser: chat.otherUser,
					})
				}
			} catch (error) {
				console.error('加载聊天列表失败:', error)
				throw error
			}
		},

		updateLastMessageStatus(chatId: number, status: MessageStatus) {
			const chat = this.chats.get(chatId)
			if (chat?.lastMessage) {
				chat.lastMessage.status = status
			}
		},
	},
})
