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
}
