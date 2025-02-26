import { wsService } from '@/services/ws'
import type { BaseMessageDto } from '@/types/message'
import { MessageType } from '@/types/message'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { MessageStatus } from '@/types/message'

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
				timestamp: new Date().toISOString(),
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
				data: {
					tempId,
					chatId,
					receiverId,
					content,
					type: 'text',
				},
			})

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
			return false
		}
		const formData = new FormData()
		formData.append('file', file)

		try {
			// TODO: 实现文件上传API
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData,
			})
			const { url } = await response.json()

			const message: BaseMessageDto = {
				chatId,
				receiverId,
				type: MessageType.FILE,
				content: url,
				metadata: {
					fileName: file.name,
					fileSize: file.size,
					mimeType: file.type,
				},
			}

			wsService.socket.emit('message', message)
			return true
		} catch (error) {
			console.error('发送文件失败:', error)
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
}

export const messageService = new MessageService()
