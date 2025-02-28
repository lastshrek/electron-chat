/*
 * @Author       : lastshrek
 * @Date         : 2024-04-28 09:32:47
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:25:36
 * @FilePath     : /src/utils/request.ts
 * @Description  : network
 * Copyright 2024 lastshrek, All Rights Reserved.
 * 2024-04-28 09:32:47
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import { toastService } from '@/services/toast'
import { awaitTo } from './await'

interface RequestQueue {
	[key: string]: boolean
}

class HttpClient {
	private instance: AxiosInstance
	private queue: RequestQueue = {}

	constructor() {
		this.instance = axios.create({
			baseURL: import.meta.env.VITE_API_BASE_URL,
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		})

		this.setupInterceptors()
	}

	private setupInterceptors() {
		// 请求拦截器
		this.instance.interceptors.request.use(
			async config => {
				// 添加 token
				const userStore = useUserStore()
				const token = userStore.token
				if (token) {
					config.headers['Authorization'] = `Bearer ${token}`
				}

				// 请求队列处理
				const url = config.url
				if (url) {
					this.queue[url] = true
				}

				return config
			},
			error => {
				this.clearQueue(error.config?.url)
				return Promise.reject(error)
			}
		)

		// 响应拦截器
		this.instance.interceptors.response.use(
			response => {
				this.clearQueue(response.config.url)

				return response.data
			},
			error => {
				this.clearQueue(error.config?.url)

				// 处理 401 认证错误
				if (error.response?.status === 401) {
					const userStore = useUserStore()
					userStore.logout()
				}

				// 显示错误提示
				console.log('error', error)
				toastService.error(error.response?.data?.message || '请求失败')
				return Promise.reject(error)
			}
		)
	}

	private clearQueue(url?: string) {
		if (!url) return
		delete this.queue[url]
	}

	// 封装 HTTP 方法
	async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const [data, error] = await awaitTo<T>(this.instance.get<any, T>(url, config))
		if (error) throw error
		if (!data) throw new Error('Response data is undefined')
		return data
	}

	async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const [response, error] = await awaitTo<T>(this.instance.post<any, T>(url, data, config))
		if (error) throw error
		if (!response) throw new Error('Response data is undefined')
		return response
	}

	async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const [response, error] = await awaitTo<T>(this.instance.put<any, T>(url, data, config))
		if (error) throw error
		if (!response) throw new Error('Response data is undefined')
		return response
	}

	async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const [response, error] = await awaitTo<T>(this.instance.delete<any, T>(url, config))
		if (error) throw error
		if (!response) throw new Error('Response data is undefined')
		return response
	}

	async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const [response, error] = await awaitTo<T>(this.instance.patch<any, T>(url, data, config))
		if (error) throw error
		if (!response) throw new Error('Response data is undefined')
		return response
	}

	// 并发请求
	async all<T extends any[]>(requests: Promise<any>[]): Promise<T> {
		const [responses, error] = await awaitTo(Promise.all(requests))
		if (error) throw error
		return responses as T
	}
}

export default new HttpClient()
