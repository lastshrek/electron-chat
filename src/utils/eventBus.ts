/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:41:38
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-26 21:16:12
 * @FilePath     : /src/utils/eventBus.ts
 * @Description  : eventBus
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:41:38
 */
import mitt from 'mitt'

type Events = {
	'friend-request': {
		type: string
		data: {
			request: {
				id: number
				fromId: number
				toId: number
				status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
				message: string | null
				createdAt: string
				from: {
					id: number
					username: string
					name: string | null
					avatar: string
				}
				to: {
					id: number
					username: string
					name: string | null
					avatar: string
				}
			}
		}
		timestamp: string
	}
	'friend-request-accepted': any
	'clear-friend-request-count': void
	'unread-count-updated': number
	userTyping: {
		chatId: number
		user: {
			id: number
			username: string
			avatar: string
		}
	}
	userStopTyping: {
		chatId: number
		user: {
			id: number
			username: string
			avatar: string
		}
	}
	friendsSynced: void
}

export const eventBus = mitt<Events>()
