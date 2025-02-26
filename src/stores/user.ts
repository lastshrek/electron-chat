/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:12:22
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-26 12:57:51
 * @FilePath     : /src/stores/user.ts
 * @Description  : user store
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:12:22
 */
import {defineStore} from "pinia";
import {ref, computed} from "vue";
import {authApi} from "@/api/auth";
import type {UserInfo, LoginParams} from "@/types/api";
import {useChatStore} from "./chat";
import {wsService} from "@/services/ws";
import {useRouter} from "vue-router";

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

	const initAuth = () => {
		// 从 localStorage 获取 token
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

			const {token, user} = response as unknown as {
				token: string;
				user: UserInfo;
			};

			setToken(token);
			setUserInfo(user);

			// 初始化 socket 连接
			useChatStore().initSocket();

			return true;
		} catch (error) {
			console.error("登录失败:", error);
			return false;
		}
	};

	const restoreFromLocalStorage = () => {
		const savedToken = localStorage.getItem(TOKEN_KEY);
		const savedUserInfo = localStorage.getItem(USER_INFO_KEY);

		if (savedToken && savedUserInfo) {
			try {
				setToken(savedToken);
				setUserInfo(JSON.parse(savedUserInfo));
				return true;
			} catch (error) {
				console.error("从本地存储恢复用户状态失败:", error);
			}
		}
		return false;
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
		restoreFromLocalStorage,
	};
});
