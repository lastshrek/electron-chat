/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:35:14
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 19:40:21
 * @FilePath     : /src/utils/error.ts
 * @Description  : error utils
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:35:14
 */
import axios, {AxiosError} from "axios";
import type {ApiResponse} from "@/types/api";

export class ApiError extends Error {
	code: number;
	data?: any;

	constructor(message: string, code: number, data?: any) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.data = data;
	}
}

export const handleApiError = (error: unknown): ApiError => {
	if (error instanceof ApiError) {
		// 处理自定义 API 错误
		console.error(`API错误 [${error.code}]:`, error.message);
		return error;
	}

	if (error instanceof Error) {
		if (axios.isAxiosError(error)) {
			// 处理 Axios 错误
			const response = error.response?.data as ApiResponse<any>;
			if (response) {
				return new ApiError(response.message, response.code, response.data);
			}
			return new ApiError(error.message, error.response?.status || -1);
		}
		return new ApiError(error.message, -1);
	}

	// 处理其他未知错误
	return new ApiError("未知错误", -1);
};
