/*
 * @Author       : lastshrek
 * @Date         : 2025-02-28 21:59:06
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:59:07
 * @FilePath     : /src/views/Contacts/types.ts
 * @Description  : Contact types
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-28 21:59:06
 */

// 类型定义
export interface SearchUser {
	id: number
	username: string
	name: string
	avatar: string
	description?: string
	isFriend?: boolean
	chatId?: number
}

export interface FriendListItem {
	id: number
	username: string
	name: string
	avatar: string
	description: string
	isFriend: boolean
}

export interface ContactGroup {
	id: 'friends' | 'organization' | 'new-friends'
	title: string
	icon: any
	expanded: boolean
	count: number
	items: SearchUser[]
}
