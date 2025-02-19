/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:12:22
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 19:25:28
 * @FilePath     : /src/stores/user.ts
 * @Description  : user store
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:12:22
 */
import {defineStore} from "pinia";
import {ref} from "vue";
import {authApi} from "@/api/auth";
import type {UserInfo, LoginResult} from "@/types/api";
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

	const initAuth = () => {
		const savedToken = localStorage.getItem(TOKEN_KEY);
		if (savedToken) {
			setToken(savedToken);
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

			// 清空聊天和消息数据
			const chatStore = useChatStore();
			const messageStore = useMessageStore();
			chatStore.$reset();
			messageStore.$reset();

			// 清空 localStorage
			localStorage.removeItem("token");
			localStorage.removeItem("userInfo");
			localStorage.removeItem("chats");
			localStorage.removeItem("messages");

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

	const login = async (username: string, password: string) => {
		try {
			const response = await authApi.login({username, password});
			setToken(response.data.token);
			await updateUserInfo();
			return response.data;
		} catch (error) {
			console.error("登录失败:", error);
			throw error;
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
