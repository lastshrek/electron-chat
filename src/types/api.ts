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
	data: T;
	message: string;
}

// 登录请求参数
export interface LoginParams {
	username: string;
	password: string;
}

// 登录响应数据
export interface LoginResponse {
	user: UserInfo;
	token: string;
	pendingRequests: any[]; // 可以根据需要定义具体类型
}

// 用户信息
export interface UserInfo {
	id: number;
	user_id: number;
	username: string;
	avatar: string;
	createdAt: string;
	updatedAt: string;
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
