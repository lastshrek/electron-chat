/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:12:22
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-21 21:40:37
 * @FilePath     : /src/stores/user.ts
 * @Description  : user store
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:12:22
 */
import {defineStore} from "pinia";
import {ref} from "vue";
import {authApi} from "@/api/auth";
import type {UserInfo, LoginParams, LoginResponse} from "@/types/api";
import {useChatStore} from "./chat";
import {useMessageStore} from "./message";
import {wsService} from "@/services/ws";
import {useRouter} from "vue-router";

const TOKEN_KEY = "token";
const USER_INFO_KEY = "user_info";

export const useUserStore = defineStore("user", () => {
	const isAuthenticated = ref(false);
	const token = ref<string | null>(null);
	const userInfo = ref<UserInfo | null>(null);
	const router = useRouter();

	const setToken = (newToken: string | null) => {
		token.value = newToken;
		isAuthenticated.value = !!newToken;
		if (newToken) {
			localStorage.setItem(TOKEN_KEY, newToken);
		} else {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_INFO_KEY);
			userInfo.value = null;
		}
	};

	const setUserInfo = (info: UserInfo | null) => {
		userInfo.value = info;
		if (info) {
			localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
		} else {
			localStorage.removeItem(USER_INFO_KEY);
		}
	};

	const syncFriends = async () => {
		try {
			const response = await authApi.getFriends();
			if (!window?.electron?.db) {
				console.error("electron.db 未定义!");
				return;
			}

			if (response) {
				if (!userInfo.value?.id) {
					console.error("当前用户ID不存在!");
					return;
				}

				await window.electron.db.syncFriends(response, userInfo.value.id);
			} else {
				console.error("好友列表数据格式错误:", response);
			}
		} catch (error) {
			console.error("同步好友列表失败:", error);
		}
	};

	const initAuth = () => {
		const savedToken = localStorage.getItem(TOKEN_KEY);
		if (savedToken) {
			setToken(savedToken);
			syncFriends();
		}

		const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
		if (savedUserInfo) {
			try {
				setUserInfo(JSON.parse(savedUserInfo));
			} catch (error) {
				console.error("Failed to parse saved user info:", error);
				localStorage.removeItem(USER_INFO_KEY);
			}
		}
	};

	const logout = async () => {
		try {
			await authApi.logout();
		} catch (error) {
			console.error("登出失败:", error);
		} finally {
			setToken(null);
			setUserInfo(null);
			isAuthenticated.value = false;

			// 清空本地存储
			localStorage.removeItem("token");
			localStorage.removeItem("userInfo");

			// 断开 WebSocket 连接
			wsService.disconnect();

			// 重定向到登录页
			router.push("/login");
		}
	};

	const updateUserInfo = async () => {
		try {
			const response = await authApi.getUserInfo();
			setUserInfo(response.data);
		} catch (error) {
			console.error("获取用户信息失败:", error);
			throw error;
		}
	};

	const login = async (params: LoginParams) => {
		try {
			console.log("开始登录...", params);
			const response = await authApi.login(params);
			console.log("登录成功，响应数据:", response);

			if (!response) {
				console.error("登录响应数据无效");
				return false;
			}

			const {token, user} = response;
			setToken(token);
			setUserInfo(user);

			// 通过 electron API 保存用户信息到数据库
			try {
				console.log("准备保存用户信息到数据库:", user);
				if (!window?.electron?.db) {
					console.error("electron.db 未定义!");
					return false;
				}

				const result = await window.electron.db.createLoginUser({
					username: user.username,
					avatar: user.avatar,
					user_id: user.id,
				});
				console.log("用户信息保存/更新成功:", result);

				// 登录成功后同步好友列表
				await syncFriends();
			} catch (error) {
				console.error("保存用户信息或同步好友列表失败:", error);
			}

			return true;
		} catch (error) {
			console.error("登录失败:", error);
			return false;
		}
	};

	return {
		isAuthenticated,
		token,
		userInfo,
		setToken,
		setUserInfo,
		initAuth,
		logout,
		updateUserInfo,
		login,
	};
});
