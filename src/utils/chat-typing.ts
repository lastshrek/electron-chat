import { Socket } from 'socket.io-client'
import { EventEmitter } from '@/utils/event-emitter'
import { WebSocketEvent } from '@/types/ws'
import { wsService, type WebSocketService } from '@/services/ws'
import { eventBus } from '@/utils/eventBus'

interface TypingStatus {
	userId: number
	chatId: number
	typing: boolean
	lastTypingTime?: number
}

export class ChatTypingManager extends EventEmitter {
	private typingUsers = new Map<string, TypingStatus>()
	private typingTimeout: number = 3000 // 3秒无输入则视为停止输入
	private debounceTime: number = 300 // 防抖时间
	private typingTimer?: NodeJS.Timeout
	private wsService: WebSocketService
	private typingTimeouts: Map<string, NodeJS.Timeout> = new Map()
	private listeners: Set<Function> = new Set()

	constructor(socket: Socket) {
		super()
		this.socket = socket
		this.wsService = wsService
		this.setupEventListeners()
	}

	private setupEventListeners() {
		eventBus.on('userTyping', data => {
			const { user, chatId } = data
			const userId = user.id
			this.setTypingStatus(chatId, userId, true)
			this.notifyListeners(chatId, userId, true)
		})

		eventBus.on('userStopTyping', data => {
			const { user, chatId } = data
			const userId = user.id
			this.setTypingStatus(chatId, userId, false)
			this.notifyListeners(chatId, userId, false)
		})
	}

	private setTypingStatus(chatId: number, userId: number, typing: boolean) {
		const key = `${chatId}-${userId}`
		this.typingUsers.set(key, {
			userId,
			chatId,
			typing,
			lastTypingTime: typing ? Date.now() : undefined,
		})

		if (!typing) {
			setTimeout(() => {
				this.typingUsers.delete(key)
			}, 1000)
		}
	}

	private notifyListeners(chatId: number, userId: number, typing: boolean) {
		this.listeners.forEach(listener => {
			listener({ chatId, userId, typing })
		})
	}

	startTyping(chatId: number, userId: number) {
		const key = `${chatId}-${userId}`

		if (this.typingTimeouts.has(key)) {
			clearTimeout(this.typingTimeouts.get(key)!)
		}

		this.wsService.sendTypingStatus(chatId, userId, true)

		const timeout = setTimeout(() => {
			this.stopTyping(chatId, userId)
		}, this.typingTimeout)

		this.typingTimeouts.set(key, timeout)
	}

	stopTyping(chatId: number, userId: number) {
		const key = `${chatId}-${userId}`

		if (this.typingTimeouts.has(key)) {
			clearTimeout(this.typingTimeouts.get(key)!)
			this.typingTimeouts.delete(key)
		}

		this.wsService.sendTypingStatus(chatId, userId, false)
	}

	getTypingUsers(chatId: number): number[] {
		const typingUsers: number[] = []
		this.typingUsers.forEach((status, key) => {
			if (status.chatId === chatId && status.typing) {
				typingUsers.push(status.userId)
			}
		})
		return typingUsers
	}

	public on(event: string, callback: Function) {
		if (event === 'typingStatusChanged') {
			this.listeners.add(callback)
		}
	}

	public off(event: string, callback: Function) {
		if (event === 'typingStatusChanged') {
			this.listeners.delete(callback)
		}
	}

	destroy() {
		for (const timeout of this.typingTimeouts.values()) {
			clearTimeout(timeout)
		}
		this.typingTimeouts.clear()

		this.typingUsers.clear()

		eventBus.off('userTyping')
		eventBus.off('userStopTyping')
		this.listeners.clear()
	}
}
