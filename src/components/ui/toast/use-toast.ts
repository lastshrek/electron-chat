import { ref, readonly, watch } from 'vue'
import type { Component, VNode } from 'vue'

export const TOAST_LIMIT = 5
export const TOAST_REMOVE_DELAY = 1000 // 减少延迟时间

export type ToastActionElement = VNode
export type ToastProps = {
	id?: string
	class?: string
	variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
	title?: string
	description?: string | VNode
	action?: Component
	duration?: number
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

const toasts = ref<ToastProps[]>([])

export function useToast() {
	// 监听 toasts 变化，处理自动关闭
	watch(
		toasts,
		newToasts => {
			newToasts.forEach(toast => {
				if (toast.open && toast.duration && toast.duration > 0) {
					setTimeout(() => {
						dismissToast(toast.id as string)
					}, toast.duration)
				}
			})
		},
		{ deep: true }
	)

	const toast = (props: ToastProps) => {
		const id = crypto.randomUUID()
		const newToast = {
			id,
			open: true,
			duration: 5000, // 默认 5 秒后自动关闭
			...props,
		}

		toasts.value = [newToast, ...toasts.value].slice(0, TOAST_LIMIT)

		return id
	}

	const dismissToast = (toastId: string) => {
		toasts.value = toasts.value.map(toast => {
			if (toast.id === toastId) {
				return {
					...toast,
					open: false,
				}
			}
			return toast
		})

		// 延迟后移除 toast
		setTimeout(() => {
			toasts.value = toasts.value.filter(t => t.id !== toastId)
		}, TOAST_REMOVE_DELAY)
	}

	const dismiss = (toastId?: string) => {
		if (toastId) {
			dismissToast(toastId)
		} else {
			// 关闭所有 toast
			toasts.value.forEach(toast => {
				dismissToast(toast.id as string)
			})
		}
	}

	const success = (
		title: string,
		description?: string,
		props?: Omit<ToastProps, 'title' | 'description' | 'variant'>
	) => {
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast({ title, description: safeDescription, variant: 'success', ...props })
	}

	const error = (
		title: string,
		description?: string,
		props?: Omit<ToastProps, 'title' | 'description' | 'variant'>
	) => {
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast({ title, description: safeDescription, variant: 'destructive', ...props })
	}

	const warning = (
		title: string,
		description?: string,
		props?: Omit<ToastProps, 'title' | 'description' | 'variant'>
	) => {
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast({ title, description: safeDescription, variant: 'warning', ...props })
	}

	const info = (title: string, description?: string, props?: Omit<ToastProps, 'title' | 'description' | 'variant'>) => {
		const safeDescription = typeof description === 'string' ? description : undefined
		return toast({ title, description: safeDescription, variant: 'info', ...props })
	}

	return {
		toasts: readonly(toasts),
		toast,
		dismiss,
		success,
		error,
		warning,
		info,
	}
}

export const toast = useToast()
