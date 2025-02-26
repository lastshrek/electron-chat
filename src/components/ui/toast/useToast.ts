import {ref, readonly} from "vue";

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface ToastProps {
	id: string;
	title?: string;
	description?: string;
	variant?: ToastVariant;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

const toasts = ref<ToastProps[]>([]);

export function useToast() {
	const addToast = (props: Omit<ToastProps, "id">) => {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const newToast = {
			id,
			duration: 5000, // 默认持续时间
			...props,
		};
		toasts.value.push(newToast);
		return id;
	};

	const removeToast = (id: string) => {
		const index = toasts.value.findIndex((toast) => toast.id === id);
		if (index !== -1) {
			toasts.value.splice(index, 1);
		}
	};

	const updateToast = (id: string, props: Partial<Omit<ToastProps, "id">>) => {
		const index = toasts.value.findIndex((toast) => toast.id === id);
		if (index !== -1) {
			toasts.value[index] = {...toasts.value[index], ...props};
		}
	};

	return {
		toasts: readonly(toasts),
		addToast,
		removeToast,
		updateToast,
	};
}

// 创建一个单例实例
const toast = (() => {
	const {addToast, removeToast, updateToast} = useToast();

	return {
		toast: (props: Omit<ToastProps, "id">) => addToast(props),
		remove: (id: string) => removeToast(id),
		update: (id: string, props: Partial<Omit<ToastProps, "id">>) => updateToast(id, props),
		success: (title: string, props?: Omit<ToastProps, "id" | "title" | "variant">) =>
			addToast({title, variant: "success", ...props}),
		error: (
			title: string,
			description?: string,
			props?: Omit<ToastProps, "id" | "title" | "description" | "variant">
		) => addToast({title, description, variant: "destructive", ...props}),
		warning: (
			title: string,
			description?: string,
			props?: Omit<ToastProps, "id" | "title" | "description" | "variant">
		) => addToast({title, description, variant: "warning", ...props}),
		info: (
			title: string,
			description?: string,
			props?: Omit<ToastProps, "id" | "title" | "description" | "variant">
		) => addToast({title, description, variant: "info", ...props}),
	};
})();

export {toast};
