/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 00:21:30
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 00:21:32
 * @FilePath     : /src/renderer/types/api.ts
 * @Description  :
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 00:21:30
 */
// 通用响应类型
export interface ApiResponse<T> {
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
export interface LoginResult {
	token: string;
	user: UserInfo;
}

// 用户信息
export interface UserInfo {
	id: number;
	username: string;
	name: string | null;
	avatar: string;
	createdAt: string;
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
