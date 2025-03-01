import request from '@/utils/request'

export const chatApi = {
	/**
	 * @description: 获取首页聊天列表
	 * @param {object} params
	 */
	getChats(params: { limit: number; page: number }) {
		return request.get('/messages/chats', { params })
	},
	/**
	 * @description: 获取或者创建和用户的直接聊天
	 * @param {number} userId
	 */
	getDirectChat(userId: number) {
		return request.get(`/messages/direct/${userId}`)
	},
	/**
	 * @description: 上传文件
	 * @param {File} file 文件对象
	 * @param {'image' | 'voice' | 'video' | 'file'} type 文件类型
	 */
	uploadFile(file: File, type: 'image' | 'voice' | 'video' | 'file') {
		const formData = new FormData()
		formData.append('file', file)
		formData.append('type', type)
		return request.post('/messages/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
	},
	/**
	 * @description: 发送文件消息
	 * @param {number} chatId 聊天ID
	 * @param {number} receiverId 接收者ID
	 * @param {string} fileUrl 文件URL
	 * @param {object} metadata 文件元数据
	 */
	sendFileMessage(
		chatId: number,
		receiverId: number,
		fileUrl: string,
		metadata: {
			fileName: string
			fileSize: number
			mimeType: string
		}
	) {
		return request.post('/messages', {
			type: 'FILE',
			chatId,
			receiverId,
			content: fileUrl,
			metadata,
		})
	},
	/**
	 * @description: 下载文件
	 * @param {string} fileUrl 文件URL
	 */
	async downloadFile(fileUrl: string) {
		const response = await request.get(fileUrl, {
			responseType: 'blob',
		})
		return response.data
	},
}
