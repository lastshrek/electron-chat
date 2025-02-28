/*
 * @Author       : lastshrek
 * @Date         : 2025-02-28 21:28:50
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:28:52
 * @FilePath     : /src/views/Home/types.ts
 * @Description  : Home Types
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-28 21:28:50
 */

/**
 * @description: 聊天参与者
 */
export interface ChatParticipant {
	id: number
	chat_id: number
	user_id: number
	role: string
	username: string
	avatar: string
}

// 打字状态变化事件参数类型
export interface TypingStatusEvent {
	chatId: number
	userId: number
	typing: boolean
}
