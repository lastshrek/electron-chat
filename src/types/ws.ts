import { Message } from './message'

// WebSocket 事件类型枚举
export enum WebSocketEvent {
	// 连接相关
	CONNECT = 'connect',
	DISCONNECT = 'disconnect',
	CONNECT_ERROR = 'connect_error',

	// 聊天相关
	NEW_MESSAGE = 'new_message',
	CHAT_MESSAGE = 'chat_message',

	TYPING = 'typing',
	STOP_TYPING = 'stopTyping',

	// 好友相关
	FRIEND_REQUEST = 'friend_request',
	FRIEND_REQUEST_ACCEPTED = 'friend_request_accepted',
	FRIEND_REQUEST_REJECTED = 'friend_request_rejected',
	FRIEND_ONLINE = 'friend_online',
	FRIEND_OFFLINE = 'friend_offline',

	// 通知相关
	NOTIFICATION = 'notification',

	// 消息发送状态
	MESSAGE_SENT = 'message_sent',
	MESSAGE_DELIVERED = 'message_delivered',
	MESSAGE_READ = 'message_read',
	MESSAGE_ERROR = 'message_error',

	// 新添加的事件类型
	USER_TYPING = 'typing',
	USER_STOP_TYPING = 'stop_typing',

	// 新添加的事件类型
	JOIN_CHAT = 'join',
	LEAVE_CHAT = 'leave',
	JOINED_CHAT = 'joined',
}

// WebSocket 消息类型
export interface WebSocketMessage {
	type: string
	data: any
}

// 好友请求消息
export interface FriendRequestData {
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
		chat?: {
			id: number
			name: string | null
			type: 'DIRECT' | 'GROUP'
			createdAt: string
			updatedAt: string
			participants: Array<{
				id: number
				username: string
				avatar: string
			}>
			lastMessage?: Message
		}
	}
	timestamp: string
}

// 好友状态消息
export interface FriendStatusData {
	userId: number
	status: 'online' | 'offline'
	lastSeen?: string
}

// 聊天消息
export interface ChatMessageData {
	type: string
	data: Message
	timestamp: string
}

// 添加消息错误响应类型
export interface MessageErrorResponse {
	tempId: number
	error: string
	timestamp: string
}

// 添加消息送达响应类型
export interface MessageDeliveredResponse {
	tempId?: number
	messageId: number
	status: 'DELIVERED'
	timestamp: string
}

// 更新消息发送成功响应类型
export interface MessageSentResponse {
	type: WebSocketEvent.MESSAGE_SENT
	data: {
		id: number
		chatId: number
		senderId: number
		receiverId: number
		type: string
		content: string
		status: string
		createdAt: string
		sender: {
			id: number
			username: string
			avatar: string
		}
		receiver: {
			id: number
			username: string
			avatar: string
		}
	}
	timestamp: string
	tempId: number
}

// 添加类型定义
export interface TypingEventData {
	chatId: number
	user: {
		id: number
		username: string
		avatar: string
	}
	timestamp: string
}

// 其他相关类型定义
export interface UserInfo {
	id: number
	username: string
	name: string | null
	avatar: string
}
