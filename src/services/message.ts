import { wsService } from '@/services/ws'
import type { BaseMessageDto } from '@/types/message'
import { MessageType, MessageStatus, type Message, type MessageMetadata } from '@/types/message'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import request from '@/utils/request'
import { chatApi } from '@/api/chat'

export class MessageService {
	// 发送文本消息
	async sendTextMessage(
		chatId: number,
		receiverId: number,
		content: string,
		originalMessageId?: number
	): Promise<boolean> {
		if (!wsService.socket?.connected) {
			console.error('WebSocket is not connected')
			return false
		}

		console.log('准备发送文本消息:', { chatId, receiverId, content, originalMessageId })

		const messageStore = useMessageStore()
		const userStore = useUserStore()

		// 生成临时消息ID
		const tempId = originalMessageId || Date.now()

		try {
			// 创建消息对象
			const message: BaseMessageDto = {
				id: tempId,
				chatId,
				receiverId,
				type: MessageType.TEXT,
				content,
				status: MessageStatus.SENDING,
				senderId: userStore.userInfo!.id,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				sender: {
					id: userStore.userInfo!.id,
					username: userStore.userInfo!.username,
					avatar: userStore.userInfo!.avatar || '',
				},
				receiver: {
					id: receiverId,
					username: this.getOtherParticipant(chatId)?.username || '',
					avatar: this.getOtherParticipant(chatId)?.avatar || '',
				},
			}

			// 添加到消息存储
			messageStore.addMessage(message)

			// 通过WebSocket发送消息
			wsService.socket.emit('message', {
				type: 'chat',
				message: {
					tempId,
					chatId,
					receiverId,
					content,
					type: MessageType.TEXT,
				},
			})

			// 设置超时处理
			setTimeout(() => {
				// 检查消息是否仍处于发送中状态
				const currentMessage = messageStore.findMessageById(tempId)
				if (currentMessage && currentMessage.status === MessageStatus.SENDING) {
					// 如果超时仍未收到确认，则标记为发送失败
					messageStore.updateMessageStatus(tempId, MessageStatus.FAILED)
				}
			}, 10000) // 10秒超时

			return true
		} catch (error) {
			console.error('发送文本消息失败:', error)
			return false
		}
	}

	// 获取聊天对象信息
	private getOtherParticipant(chatId: number) {
		const chatStore = useChatStore()
		const chat = chatStore.chats.get(chatId)
		if (!chat) return null

		return chat.participants.find(p => p.id !== useUserStore().userInfo?.id)
	}

	// 发送图片消息
	async sendImageMessage(chatId: number, receiverId: number, file: File) {
		try {
			// 获取图片预览
			const previewUrl = await this.getImagePreview(file)

			// 创建临时消息
			const tempMessage = await this.createTempMessage({
				chatId,
				receiverId,
				type: MessageType.IMAGE,
				content: previewUrl,
				file,
				previewUrl,
			})

			// 上传文件
			const res = await chatApi.uploadFile(file, 'image')

			// 构建元数据
			const metadata: MessageMetadata = {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				url: res.url,
				thumbnail: res.thumbnail,
				width: res.width,
				height: res.height,
			}

			// 发送消息
			await this.sendMessage(tempMessage.id, {
				chatId,
				receiverId,
				content: res.url,
				metadata,
				type: MessageType.IMAGE,
			})

			return true
		} catch (error) {
			console.error('发送图片消息失败:', error)
			return false
		}
	}

	// 发送语音消息
	async sendVoiceMessage(chatId: number, receiverId: number, file: File, duration: number) {
		try {
			const tempMessage = await this.createTempMessage({
				chatId,
				receiverId,
				type: MessageType.VOICE,
				content: file.name,
				file,
			})

			const res = await chatApi.uploadFile(file, 'voice')

			const metadata: MessageMetadata = {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				url: res.url,
				duration,
			}

			await this.sendMessage(tempMessage.id, {
				chatId,
				receiverId,
				content: file.name,
				metadata,
				type: MessageType.VOICE,
			})

			return true
		} catch (error) {
			console.error('发送语音消息失败:', error)
			return false
		}
	}

	// 发送视频消息
	async sendVideoMessage(chatId: number, receiverId: number, file: File) {
		try {
			const tempMessage = await this.createTempMessage({
				chatId,
				receiverId,
				type: MessageType.VIDEO,
				content: file.name,
				file,
			})

			const res = await chatApi.uploadFile(file, 'video')

			const metadata: MessageMetadata = {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				url: res.url,
				thumbnail: res.thumbnail,
				width: res.width,
				height: res.height,
				duration: res.duration,
			}

			await this.sendMessage(tempMessage.id, {
				chatId,
				receiverId,
				content: file.name,
				metadata,
				type: MessageType.VIDEO,
			})

			return true
		} catch (error) {
			console.error('发送视频消息失败:', error)
			return false
		}
	}

	// 发送文件消息
	async sendFileMessage(chatId: number, receiverId: number, file: File) {
		try {
			const tempMessage = await this.createTempMessage({
				chatId,
				receiverId,
				type: MessageType.FILE,
				content: file.name,
				file,
			})

			const res = await chatApi.uploadFile(file, 'file')

			const metadata: MessageMetadata = {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				url: res.url,
			}

			await this.sendMessage(tempMessage.id, {
				chatId,
				receiverId,
				content: file.name,
				metadata,
				type: MessageType.FILE,
			})

			return true
		} catch (error) {
			console.error('发送文件消息失败:', error)
			return false
		}
	}

	// 撤回消息
	async recallMessage(messageId: number, chatId: number) {
		if (!wsService.socket?.connected) {
			return false
		}
		try {
			wsService.socket.emit('recall_message', { messageId, chatId })
			return true
		} catch (error) {
			console.error('撤回消息失败:', error)
			return false
		}
	}

	// 标记消息已读
	async markMessagesAsRead(chatId: number, messageIds: number[]) {
		if (!wsService.socket?.connected) {
			return false
		}
		try {
			wsService.socket.emit('mark_messages_read', { chatId, messageIds })
			return true
		} catch (error) {
			console.error('标记消息已读失败:', error)
			return false
		}
	}

	// 获取消息周围的消息
	async getMessagesAround(chatId: number, messageId: number): Promise<any> {
		try {
			return await request.get(`/messages/before/${messageId}`, {
				params: {
					chatId,
				},
			})
		} catch (error) {
			console.error('获取消息周围的消息失败:', error)
			throw error
		}
	}

	async downloadFile(fileUrl: string) {
		try {
			const blob = await chatApi.downloadFile(fileUrl)
			const url = window.URL.createObjectURL(blob)

			const a = document.createElement('a')
			a.href = url
			a.download = fileUrl.split('/').pop() || 'download'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)

			return true
		} catch (error) {
			console.error('下载文件失败:', error)
			return false
		}
	}

	// 私有辅助方法
	private async getImagePreview(file: File): Promise<string> {
		return new Promise<string>(resolve => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result as string)
			reader.readAsDataURL(file)
		})
	}

	private async createTempMessage({
		chatId,
		receiverId,
		type,
		content,
		file,
		previewUrl,
	}: {
		chatId: number
		receiverId: number
		type: MessageType
		content: string
		file: File
		previewUrl?: string
	}): Promise<Message> {
		const messageStore = useMessageStore()
		const userStore = useUserStore()
		const tempId = Date.now()

		const tempMessage: Message = {
			id: tempId,
			chatId,
			receiverId,
			senderId: userStore.userInfo!.id,
			type,
			content,
			status: MessageStatus.SENDING,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			sender: {
				id: userStore.userInfo!.id,
				username: userStore.userInfo!.username,
				avatar: userStore.userInfo!.avatar || '',
			},
			metadata: {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				previewUrl,
			},
		}

		messageStore.addMessage(tempMessage)
		return tempMessage
	}

	private async sendMessage(
		tempId: number,
		message: {
			chatId: number
			receiverId: number
			content: string
			metadata: MessageMetadata
			type: MessageType
		}
	) {
		if (!wsService.socket?.connected) {
			throw new Error('WebSocket is not connected')
		}

		wsService.socket.emit('message', {
			type: 'chat',
			message: {
				tempId,
				...message,
			},
		})
	}
}

export const messageService = new MessageService()
