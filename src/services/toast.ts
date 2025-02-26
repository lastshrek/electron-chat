import { toast } from '@/components/ui/toast/use-toast'

interface ToastOptions {
	title?: string
	description?: string
	duration?: number
	action?: any
}

class ToastService {
	/**
	 * 显示默认 toast
	 */
	show(message: string, options?: Omit<ToastOptions, 'description'>) {
		return toast.toast({
			title: message,
			...options,
		})
	}

	/**
	 * 显示成功 toast
	 */
	success(message: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) {
		// 确保 description 是字符串
		const safeDescription = typeof description === 'string' ? description : undefined

		// 如果 description 不是字符串，但 options 是对象，则可能是调用方式为 success(message, options)
		const safeOptions = typeof description === 'object' && !options ? description : options

		return toast.success(message, safeDescription, safeOptions)
	}

	/**
	 * 显示错误 toast
	 */
	error(message: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) {
		// 确保 description 是字符串
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast.error(message, safeDescription, options)
	}

	/**
	 * 显示警告 toast
	 */
	warning(message: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) {
		// 确保 description 是字符串
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast.warning(message, safeDescription, options)
	}

	/**
	 * 显示信息 toast
	 */
	info(message: string, description?: string, options?: Omit<ToastOptions, 'title' | 'description'>) {
		// 确保 description 是字符串
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast.info(message, safeDescription, options)
	}

	/**
	 * 显示 API 错误 toast
	 */
	apiError(error: any) {
		console.error('API Error:', error)

		// 处理 Axios 错误
		if (error.response?.data) {
			const { message, code } = error.response.data
			return this.error(message || '请求失败', code ? `错误代码: ${code}` : undefined)
		}

		// 处理其他错误
		return this.error(error.message || '发生未知错误', '请稍后再试')
	}
}

export const toastService = new ToastService()
