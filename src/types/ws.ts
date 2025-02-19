// WebSocket 事件类型枚举
export enum WebSocketEvent {
	// 连接相关
	CONNECT = "connect",
	DISCONNECT = "disconnect",
	CONNECT_ERROR = "connect_error",

	// 聊天相关
	NEW_MESSAGE = "message",
	TYPING = "typing",
	STOP_TYPING = "stopTyping",

	// 好友相关
	FRIEND_REQUEST = "friend_request",
	FRIEND_REQUEST_ACCEPTED = "friend_request_accepted",
	FRIEND_REQUEST_REJECTED = "friend_request_rejected",
	FRIEND_ONLINE = "friend_online",
	FRIEND_OFFLINE = "friend_offline",

	// 通知相关
	NOTIFICATION = "notification",

	// 消息发送状态
	MESSAGE_SENT = "messageSent",
	MESSAGE_DELIVERED = "messageDelivered",
	MESSAGE_READ = "messageRead",
	MESSAGE_ERROR = "messageError",

	// 新添加的事件类型
	USER_TYPING = "userTyping",
	USER_STOP_TYPING = "userStopTyping",

	// 新添加的事件类型
	JOIN_CHAT = "join",
	LEAVE_CHAT = "leave",
	JOINED_CHAT = "joined",
}

// WebSocket 消息类型
export interface WebSocketMessage {
	type: string;
	data: any;
}

// 好友请求消息
export interface FriendRequestData {
	type: string;
	data: {
		request: {
			id: number;
			fromId: number;
			toId: number;
			status: "PENDING" | "ACCEPTED" | "REJECTED";
			message: string | null;
			createdAt: string;
			updatedAt: string;
			from: {
				id: number;
				username: string;
				avatar: string;
			};
			to: {
				id: number;
				username: string;
				avatar: string;
			};
		};
		friend?: {
			id: number;
			username: string;
			avatar: string;
		};
		chat?: {
			id: number;
			name: string | null;
			type: "DIRECT";
			createdAt: string;
			updatedAt: string;
			participants: Array<{
				id: number;
				userId: number;
				chatId: number;
				joinedAt: string;
				user: {
					id: number;
					username: string;
					avatar: string;
					createdAt: string;
					updatedAt: string;
				};
			}>;
			lastMessage?: {
				id: number;
				content: string;
				type: "TEXT";
				status: "SENT";
				metadata: Record<string, any>;
				createdAt: string;
				updatedAt: string;
				senderId: number;
				receiverId: number;
				chatId: number;
				sender: {
					id: number;
					username: string;
					avatar: string;
					createdAt: string;
					updatedAt: string;
				};
				receiver: {
					id: number;
					username: string;
					avatar: string;
					createdAt: string;
					updatedAt: string;
				};
				chat: {
					id: number;
					name: string | null;
					type: "DIRECT";
					createdAt: string;
					updatedAt: string;
				};
			};
		};
	};
	timestamp: string;
}

// 好友状态消息
export interface FriendStatusData {
	userId: number;
	status: "online" | "offline";
	lastSeen?: string;
}

// 聊天消息
export interface ChatMessageData {
	type: "message";
	data: {
		id: number;
		content: string;
		type: "TEXT" | "IMAGE" | "FILE";
		status: "SENT" | "DELIVERED" | "READ";
		metadata: Record<string, any> | null;
		createdAt: string;
		updatedAt: string;
		senderId: number;
		receiverId: number;
		chatId: number;
		sender: {
			id: number;
			username: string;
			avatar: string;
		};
		receiver: {
			id: number;
			username: string;
			avatar: string;
		};
	};
	timestamp: string;
}

// 添加消息错误响应类型
export interface MessageErrorResponse {
	tempId: number;
	error: string;
	timestamp: string;
}

// 添加消息送达响应类型
export interface MessageDeliveredResponse {
	tempId?: number;
	messageId: number;
	status: "DELIVERED";
	timestamp: string;
}

// 更新消息发送成功响应类型
export interface MessageSentResponse {
	type: "messageSent";
	data: {
		tempId: number;
		message: {
			id: number;
			chatId: number;
			senderId: number;
			receiverId: number;
			type: string;
			content: string;
			status: string;
			createdAt: string;
			sender: {
				id: number;
				username: string;
				avatar: string;
			};
			receiver: {
				id: number;
				username: string;
				avatar: string;
			};
		};
	};
	timestamp: string;
}

// 添加类型定义
export interface TypingEventData {
	type: string;
	data: {
		userId: number;
		chatId: number;
	};
	timestamp: string;
}
