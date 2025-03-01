// 消息类型枚举
export enum MessageType {
	TEXT = 'TEXT',
	IMAGE = 'IMAGE',
	VOICE = 'VOICE',
	VIDEO = 'VIDEO',
	FILE = 'FILE',
}

// 消息状态枚举
export enum MessageStatus {
	SENDING = 'SENDING', // 发送中
	SENT = 'SENT', // 已发送
	DELIVERED = 'DELIVERED', // 已送达
	READ = 'READ', // 已读
	FAILED = 'FAILED', // 发送失败
}

// 基础消息请求接口
export interface BaseMessageDto {
	id: number // 临时消息ID
	chatId: number // 聊天室ID
	senderId: number // 发送者ID
	receiverId: number // 接收者ID
	type: MessageType // 消息类型
	content: string // 消息内容
	status: MessageStatus // 消息状态
	createdAt: string // 创建时间
	updatedAt: string // 更新时间
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
	metadata?: {
		duration?: number // 语音/视频时长
		thumbnail?: string // 图片/视频缩略图
		mimeType?: string // 文件类型
		width?: number // 图片/视频宽度
		height?: number // 图片/视频高度
		url?: string // 链接URL
		title?: string // 链接标题
		description?: string // 链接描述
	}
}

// 消息响应接口
export interface MessageResponse extends BaseMessageDto {
	id: number // 消息ID
	senderId: number // 发送者ID
	status: MessageStatus // 消息状态
	createdAt: string // 创建时间
	updatedAt: string // 更新时间
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

// 消息事件接口
export interface MessageEvent {
	type: 'message' | 'status_update' | 'recall'
	data: MessageResponse
}

// 消息撤回请求
export interface MessageRecallDto {
	messageId: number
	chatId: number
}

// 消息已读请求
export interface MessageReadDto {
	chatId: number
	messageIds: number[]
}

export interface MessageMetadata {
	fileName?: string
	fileSize?: number
	mimeType?: string
	url?: string
	thumbnail?: string
	width?: number
	height?: number
	previewUrl?: string // 添加预览URL字段
}

export interface Message {
	id: number
	chatId: number
	receiverId: number
	senderId: number
	type: MessageType
	content: string
	status: MessageStatus
	createdAt: string
	updatedAt: string
	metadata?: MessageMetadata
	sender?: {
		id: number
		username: string
		avatar: string
	}
	receiver?: {
		id: number
		username: string
		avatar: string
	}
}
