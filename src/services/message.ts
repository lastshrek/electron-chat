import { wsService } from '@/services/ws'
import type { BaseMessageDto } from '@/types/message'
import { MessageType } from '@/types/message'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { MessageStatus } from '@/types/message'
import request from '@/utils/request'
import { chatApi } from '@/api/chat'
import type { Message, MessageMetadata } from '@/types/message'

class MessageService {
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
		// 先上传图片
		const formData = new FormData()
		formData.append('file', file)

		try {
			// TODO: 实现文件上传API
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})
			const { url } = await response.json()

			// 发送消息
			return this.sendTextMessage(chatId, receiverId, url)
		} catch (error) {
			console.error('发送图片失败:', error)
			return false
		}
	}

	// 发送文件消息
	async sendFileMessage(chatId: number, receiverId: number, file: File) {
		if (!wsService.socket?.connected) {
			console.error('WebSocket is not connected')
			return false
		}

		const messageStore = useMessageStore()
		const userStore = useUserStore()

		// 生成临时消息ID
		const tempId = Date.now()

		try {
			// 根据文件类型确定上传类型和消息类型
			let uploadType: 'image' | 'voice' | 'video' | 'file'
			let messageType: MessageType
			if (file.type.startsWith('image/')) {
				uploadType = 'image'
				messageType = MessageType.IMAGE
			} else if (file.type.startsWith('audio/')) {
				uploadType = 'voice'
				messageType = MessageType.VOICE
			} else if (file.type.startsWith('video/')) {
				uploadType = 'video'
				messageType = MessageType.VIDEO
			} else {
				uploadType = 'file'
				messageType = MessageType.FILE
			}

			// 如果是图片，先转换为 base64
			let previewUrl = ''
			if (uploadType === 'image') {
				previewUrl = await new Promise<string>(resolve => {
					const reader = new FileReader()
					reader.onload = () => resolve(reader.result as string)
					reader.readAsDataURL(file)
				})
			}

			// 创建临时消息
			const tempMessage: Message = {
				id: tempId,
				chatId,
				receiverId,
				senderId: userStore.userInfo!.id,
				type: messageType,
				content: uploadType === 'image' ? previewUrl : file.name,
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
					previewUrl: uploadType === 'image' ? previewUrl : undefined,
				},
			}

			// 添加临时消息到消息列表
			messageStore.addMessage(tempMessage)

			// 上传文件
			const res = await chatApi.uploadFile(file, uploadType)
			console.log('res', res)
			// 构建消息元数据
			const metadata: MessageMetadata = {
				fileName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				url: res.url,
			}

			// 如果是图片，添加额外的元数据
			if (uploadType === 'image' && res.thumbnail) {
				metadata.thumbnail = res.thumbnail
				metadata.width = res.width
				metadata.height = res.height
			}

			// 通过 WebSocket 发送消息
			wsService.socket.emit('message', {
				type: 'chat',
				message: {
					tempId,
					chatId,
					receiverId,
					content: uploadType === 'image' ? res.url : file.name,
					metadata,
					type: messageType,
				},
			})

			// wsService.socket.emit('message', {
			// 	type: 'chat',
			// 	message: {
			// 		tempId,
			// 		chatId,
			// 		receiverId,
			// 		content,
			// 		type: MessageType.TEXT,
			// 	},
			// })

			return true
		} catch (error) {
			console.error('发送文件消息失败:', error)
			// 更新临时消息状态为失败
			messageStore.updateMessageStatus(tempId, MessageStatus.FAILED)
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
}

export const messageService = new MessageService()
