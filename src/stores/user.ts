/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:12:22
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-22 00:09:19
 * @FilePath     : /src/stores/user.ts
 * @Description  : user store
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:12:22
 */
import {defineStore} from "pinia";
import {ref, computed} from "vue";
import {authApi} from "@/api/auth";
import type {UserInfo, LoginParams, LoginResponse} from "@/types/api";
import {useChatStore} from "./chat";
import {useMessageStore} from "./message";
import {wsService} from "@/services/ws";
import {useRouter} from "vue-router";
import type {DB} from "@/types/electron";

const TOKEN_KEY = "token";
const USER_INFO_KEY = "user_info";

export const useUserStore = defineStore("user", () => {
	const isAuthenticated = computed(() => {
		// 检查 token 和 userInfo 是否都存在
		return !!token.value && !!userInfo.value;
	});

	const token = ref<string | null>(null);
	const userInfo = ref<UserInfo | null>(null);
	const router = useRouter();

	const setToken = (newToken: string | null) => {
		token.value = newToken;
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

				const db = window.electron?.db as DB;
				if (!db) {
					console.error("electron.db 未定义!");
					return;
				}

				await db.syncFriends(response, userInfo.value.id);
			} else {
				console.error("好友列表数据格式错误:", response);
			}
		} catch (error) {
			console.error("同步好友列表失败:", error);
		}
	};

	const initAuth = () => {
		// 从 localStorage 获取 token
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
				const db = window.electron?.db as DB;
				if (!db) {
					console.error("electron.db 未定义!");
					return false;
				}

				const result = await db.createLoginUser({
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

			// 这里应该初始化 socket 连接
			useChatStore().initSocket();

			return true;
		} catch (error) {
			console.error("登录失败:", error);
			return false;
		}
	};

	const restoreFromDB = async () => {
		try {
			const currentUser = await window.electron.db.getCurrentUser();
			console.log("从数据库恢复用户状态:", currentUser);
			if (currentUser) {
				// 从本地存储获取 token
				const savedToken = localStorage.getItem(TOKEN_KEY);
				if (savedToken) {
					setToken(savedToken);
				}
				setUserInfo(currentUser);
				return true;
			}
			return false;
		} catch (error) {
			console.error("从数据库恢复用户状态失败:", error);
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
		restoreFromDB,
	};
});
