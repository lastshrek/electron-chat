import axios from "axios";
import type {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	AxiosError,
	InternalAxiosRequestConfig,
} from "axios";
import {useUserStore} from "@/stores/user";
import type {ApiResponse} from "@/types/api";
import {toast} from "@/components/ui/toast";

// 创建 axios 实例
const request: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

// 请求拦截器
request.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const userStore = useUserStore();
		const token = userStore.token;

		if (token) {
			config.headers.set("Authorization", `Bearer ${token}`);
		}

		return config;
	},
	(error: AxiosError) => {
		toast({
			variant: "destructive",
			title: "请求发送失败",
			description: error.message,
		});
		return Promise.reject(error);
	}
);

// 响应拦截器
request.interceptors.response.use(
	(response: AxiosResponse<ApiResponse<any>>) => {
		// 处理成功响应
		if (response.status === 200 || response.status === 201) {
			return response.data.data;
		}

		// 处理特定错误码
		const {code, message} = response.data;
		console.error("API error:", code, message);
		switch (code) {
			case 401:
				// token 过期或未登录
				const userStore = useUserStore();
				userStore.logout();
				toast({
					variant: "destructive",
					title: "登录已过期",
					description: "请重新登录",
				});
				break;
			case 403:
				// 权限不足
				toast({
					variant: "destructive",
					title: "权限不足",
					description: message,
				});
				break;
			default:
				toast({
					variant: "destructive",
					title: message || "请求失败",
					description: `错误代码: ${code}`,
				});
		}

		return Promise.reject(new Error(message || "请求失败"));
	},
	(error: AxiosError<ApiResponse<any>>) => {
		console.error("Request error:", error);
		if (error.response?.data) {
			const {message, code} = error.response.data;
			toast({
				variant: "destructive",
				title: message || "请求失败",
				description: `错误代码: ${code}`,
			});
			return Promise.reject(new Error(message || `请求失败(${code})`));
		}

		toast({
			variant: "destructive",
			title: "网络请求失败",
			description: error.message,
		});
		return Promise.reject(error);
	}
);

export default request;
