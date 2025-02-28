/*
 * @Author       : lastshrek
 * @Date         : 2025-02-28 21:43:55
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:43:56
 * @FilePath     : /src/api/types.ts
 * @Description  : types
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-28 21:43:55
 */
export interface ChatResponse {
	chats: Array<{
		id: number
		name: string | null
		type: 'DIRECT' | 'GROUP'
		participants: Array<{
			id: number
			username: string
			avatar: string
		}>
		otherUser: {
			id: number
			username: string
			avatar: string
		}
		lastMessage?: {
			id: number
			content: string
			type: string
			status: string
			metadata: Record<string, any>
			createdAt: string
			updatedAt: string
			senderId: number
			receiverId: number
			chatId: number
			sender: {
				id: number
				username: string
				avatar: string
			}
		}
		unreadCount: number
		totalMessages: number
		updatedAt: string
		createdAt: string
	}>
	hasMore: boolean
	total: number
}
