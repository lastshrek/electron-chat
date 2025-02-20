/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:14:45
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-20 19:49:28
 * @FilePath     : /src/api/auth.ts
 * @Description  : auth api
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:14:45
 */
import request from "@/utils/request";
import type {
	ApiResponse,
	LoginParams,
	LoginResponse,
	RegisterParams,
	RegisterResult,
	SearchResponse,
	FriendRequestParams,
	UserInfo,
	Friend,
} from "@/types/api";

export const authApi = {
	// 登录
	login: (params: LoginParams) => {
		return request.post<ApiResponse<LoginResponse>>("/users/login", params);
	},

	// 登出
	logout: () => {
		return request.post("/users/logout");
	},

	// 刷新 token
	refreshToken: () => {
		return request.post<ApiResponse<{token: string}>>("/auth/refresh");
	},

	// 注册
	register: (data: RegisterParams) => {
		return request.post<ApiResponse<RegisterResult>>("/users/register", data);
	},

	// 搜索用户
	searchUsers: (keyword: string) => {
		return request.get<ApiResponse<SearchResponse>>("/users/search", {
			params: {keyword},
		});
	},

	// 发送好友请求
	sendFriendRequest: (fromId: number, toId: number) => {
		return request.post<ApiResponse<void>>(`/users/friend-requests`, {toId});
	},

	// 获取好友请求列表
	getFriendRequests: (status: "PENDING" | "ACCEPTED" | "REJECTED") => {
		return request.get<
			ApiResponse<{
				requests: Array<{
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
				}>;
			}>
		>("/users/friend-requests", {
			params: {status},
		});
	},

	// 添加处理好友请求的接口
	respondToFriendRequest: (requestId: number, status: "ACCEPTED" | "REJECTED") => {
		return request.patch<ApiResponse<void>>(`/users/friend-requests/${requestId}`, {
			status,
		});
	},

	// 获取用户信息
	getUserInfo: () => {
		return request.get<UserInfo>("/auth/user");
	},

	// 获取好友列表
	getFriends: () => {
		return request.get<ApiResponse<Friend[]>>("/users/friends");
	},
};
