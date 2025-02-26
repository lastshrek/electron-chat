<script setup lang="ts">
import { isVNode } from 'vue'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '.'
import { useToast } from './use-toast'

const { toasts, dismiss } = useToast()

const removeToast = (id: string) => {
	dismiss(id)
}
</script>

<template>
	<ToastProvider>
		<Toast v-for="toast in toasts" :key="toast.id" v-bind="toast" @close="removeToast">
			<div class="grid gap-1 pr-8">
				<ToastTitle v-if="toast.title">
					{{ toast.title }}
				</ToastTitle>
				<template v-if="toast.description">
					<ToastDescription v-if="isVNode(toast.description)">
						<component :is="toast.description" />
					</ToastDescription>
					<ToastDescription v-else>
						{{ toast.description }}
					</ToastDescription>
				</template>
				<ToastClose />
			</div>
			<component :is="toast.action" />
		</Toast>
		<ToastViewport />
	</ToastProvider>
</template>

<style>
@import './toast.css';
</style>
