import { defineStore } from 'pinia'
import type { Message } from '@/types/message'
import { MessageStatus } from '@/types/message'
import { messageService } from '@/services/message'

export const useMessageStore = defineStore('message', {
	state: () => ({
		messages: new Map<number, Message[]>(),
	}),

	actions: {
		addMessage(message: Message) {
			// 确保消息有chatId
			if (!message.chatId) {
				console.error('消息缺少chatId:', message)
				return
			}

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
					case MessageType.TEXT:
						success = await messageService.sendTextMessage(
							chatId,
							messageToResend.receiverId,
							messageToResend.content,
							messageId // 传递原始消息ID
						)
						break
					case 'IMAGE':
						// 对于图片和文件，可能需要重新上传
						// 这里简化处理，实际可能需要缓存文件或重新获取
						console.warn('Resending image messages not fully implemented')
						success = false
						break
					case 'FILE':
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

		// 设置消息
		setMessages(chatId: number, messages: any[]) {
			// 清空现有消息
			this.clearChatMessages(chatId)

			// 添加新消息
			messages.forEach(message => {
				this.addMessage({
					id: message.id,
					content: message.content,
					type: message.type,
					status: message.status,
					createdAt: message.createdAt,
					receiver: message.receiver,
					chatId: message.chatId,
					sender: message.sender,
					senderId: message.senderId,
					receiverId: message.receiverId,
					metadata: message.metadata,
					updatedAt: message.updatedAt,
				})
			})
		},

		// 清空聊天消息
		clearChatMessages(chatId: number) {
			const chatMessages = this.messages.get(chatId)
			if (chatMessages) {
				this.messages.set(chatId, [])
			}
		},

		findMessageById(messageId: number): Message | null {
			for (const messages of this.messages.values()) {
				const message = messages.find(m => m.id === messageId)
				if (message) {
					return message
				}
			}
			return null
		},

		markMessagesAsRead(chatId: number, messageIds: number[]) {
			// 更新消息状态
			for (const messageId of messageIds) {
				this.updateMessageStatus(messageId, MessageStatus.READ)
			}

			// 通知服务器消息已读
			messageService.markMessagesAsRead(chatId, messageIds)
		},
	},
})
