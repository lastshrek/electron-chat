import axios from "axios";
import type {AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig} from "axios";
import type {ApiResponse} from "@/types/api";
import {useUserStore} from "@/stores/user";
import {toastService} from "@/services/toast";

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
		toastService.error("请求发送失败", error.message);
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
		switch (code) {
			case 401:
				// token 过期或未登录
				const userStore = useUserStore();
				userStore.logout();
				toastService.error("登录已过期", "请重新登录");
				break;
			case 403:
				// 权限不足
				toastService.error("权限不足", message);
				break;
			default:
				toastService.error(message || "请求失败", `错误代码: ${code}`);
		}

		return Promise.reject(new Error(message || "请求失败"));
	},
	(error: AxiosError<ApiResponse<any>>) => {
		console.error("Request error:", error);
		toastService.apiError(error);
		return Promise.reject(error);
	}
);

export default request;
