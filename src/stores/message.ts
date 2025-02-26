import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/types/message'
import { MessageStatus } from '@/types/message'
import { messageService } from '@/services/message'

export interface Message {
	id: number
	content: string
	type: string
	status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
	senderId: number
	receiverId: number
	chatId: number
	timestamp: string
	metadata?: Record<string, any>
	sender?: {
		id: number
		username: string
		avatar: string
	}
	receiver?: {
		id: number
		username: string
		avatar: string
	}
}

interface MessageGroup {
	date: string
	messages: Message[]
}

export const useMessageStore = defineStore('message', {
	state: () => ({
		messages: new Map<number, Message[]>(),
	}),

	actions: {
		addMessage(message: Message) {
			console.log('Adding message:', message)
			const chatMessages = this.messages.get(message.chatId) || []

			// 检查消息是否已存在
			const exists = chatMessages.some(m => m.id === message.id)
			if (exists) {
				console.log('Message already exists, skipping:', message.id)
				return
			}

			// 添加新消息
			chatMessages.push(message)
			this.messages.set(message.chatId, chatMessages)

			console.log('Updated messages for chat:', message.chatId, this.messages.get(message.chatId)?.length)
		},

		getMessagesByChat(chatId: number): Message[] {
			return this.messages.get(chatId) || []
		},

		updateMessageStatus(messageId: number, status: Message['status']) {
			for (const messages of this.messages.values()) {
				const message = messages.find(m => m.id === messageId)
				if (message) {
					message.status = status
					break
				}
			}
		},

		updateMessage(messageId: number, updates: Partial<Message>) {
			for (const messages of this.messages.values()) {
				const message = messages.find(m => m.id === messageId)
				if (message) {
					Object.assign(message, updates)
					break
				}
			}
		},

		updateMessageId(oldId: number, newId: number) {
			for (const messages of this.messages.values()) {
				const messageIndex = messages.findIndex(m => m.id === oldId)
				if (messageIndex !== -1) {
					messages[messageIndex] = {
						...messages[messageIndex],
						id: newId,
					}
					break
				}
			}
		},

		async resendMessage(messageId: number): Promise<boolean> {
			// 找到要重发的消息
			let messageToResend: Message | null = null
			let chatId: number | null = null

			this.messages.forEach((chatMessages, cId) => {
				const message = chatMessages.find(m => m.id === messageId)
				if (message) {
					messageToResend = message
					chatId = cId
				}
			})

			if (!messageToResend || chatId === null) {
				console.error('Message not found for resending:', messageId)
				return false
			}

			// 更新消息状态为发送中
			this.updateMessageStatus(messageId, MessageStatus.SENDING)

			try {
				// 根据消息类型调用不同的发送方法
				let success = false

				switch (messageToResend.type) {
					case 'text':
						success = await messageService.sendTextMessage(
							chatId,
							messageToResend.receiverId,
							messageToResend.content,
							messageId // 传递原始消息ID
						)
						break
					case 'image':
						// 对于图片和文件，可能需要重新上传
						// 这里简化处理，实际可能需要缓存文件或重新获取
						console.warn('Resending image messages not fully implemented')
						success = false
						break
					case 'file':
						console.warn('Resending file messages not fully implemented')
						success = false
						break
					default:
						console.error('Unknown message type for resending:', messageToResend.type)
						success = false
				}

				if (!success) {
					// 如果发送失败，更新状态为失败
					this.updateMessageStatus(messageId, MessageStatus.FAILED)
				}

				return success
			} catch (error) {
				console.error('Error resending message:', error)
				this.updateMessageStatus(messageId, MessageStatus.FAILED)
				return false
			}
		},
	},
})
