/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 00:21:30
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-22 00:09:44
 * @FilePath     : /src/types/api.ts
 * @Description  :
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 00:21:30
 */
// 通用响应类型
export interface ApiResponse<T = any> {
	code: number;
	message: string;
	data: T;
}

// 登录请求参数
export interface LoginParams {
	username: string;
	password: string;
	remember?: boolean;
}

// 登录响应数据
export interface LoginResponse {
	token: string;
	user: UserInfo;
}

// 用户信息
export interface UserInfo {
	id: number;
	username: string;
	email: string;
	avatar?: string;
	role?: string;
	department?: string;
	position?: string;
	// 其他用户信息字段
}

// 注册请求参数
export interface RegisterParams {
	username: string;
	password: string;
}

// 注册响应数据
export interface RegisterResult {
	token: string;
	user: {
		id: number;
		username: string;
		name: string;
		avatar?: string;
	};
}

// 用户搜索结果
export interface UserSearchResult {
	id: number;
	username: string;
	name: string;
	avatar?: string;
	description?: string;
}

// 搜索响应
export interface SearchResponse {
	users: UserSearchResult[];
	total: number;
}

// 好友请求参数
export interface FriendRequestParams {
	toId: number;
}

// 好友信息
export interface Friend {
	id: number;
	userId: number;
	friendId: number;
	createdAt: string;
	friend: {
		id: number;
		username: string;
		avatar: string;
	};
}

// 好友列表响应
export interface FriendsResponse {
	code: number;
	data: Friend[];
	message: string;
}

export interface FriendRequest {
	id: number;
	fromId: number;
	toId: number;
	status: "PENDING" | "ACCEPTED" | "REJECTED";
	message: string | null;
	createdAt: string;
	from: {
		id: number;
		username: string;
		name: string | null;
		avatar: string;
	};
	to: {
		id: number;
		username: string;
		name: string | null;
		avatar: string;
	};
}

// 好友请求响应
export interface FriendRequestResponse
	extends Array<{
		id: number;
		fromId: number;
		toId: number;
		status: "PENDING" | "ACCEPTED" | "REJECTED";
		message: string | null;
		createdAt: string;
		from: {
			id: number;
			username: string;
			name: string | null;
			avatar: string;
		};
		to: {
			id: number;
			username: string;
			name: string | null;
			avatar: string;
		};
	}> {}

// 消息状态类型
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

// 消息类型
export interface Message {
	id: number;
	content: string;
	type: string;
	status: MessageStatus;
	metadata?: Record<string, any>;
	timestamp: string;
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
}

// 组织架构节点
export interface OrganizationNode {
	id: string;
	name: string;
	type: number; // 1: 部门, 2: 公司
	order: number;
	parentId: string | null;
	userCount: number; // 直属人员数量
	totalUserCount: number; // 包含子部门的总人数
	children: OrganizationNode[];
	expanded?: boolean; // 添加展开状态字段
}

// 组织架构响应
export interface OrganizationResponse {
	code: number;
	data: OrganizationNode[];
	message: string;
}

// 部门用户类型定义
export interface DepartmentUser {
	id: string;
	name: string;
	avatar: string;
	dutyName: string | null;
}

export interface Meeting {
	id: string;
	title: string;
	status: "ACTIVE" | "ENDED";
	startTime: string;
	creator: {
		id: number;
		username: string;
		avatar: string;
	};
	participants: Array<{
		user: {
			id: number;
			username: string;
			avatar: string;
		};
		role: "HOST" | "PARTICIPANT";
		joinTime: string;
	}>;
	_count: {
		participants: number;
	};
}
