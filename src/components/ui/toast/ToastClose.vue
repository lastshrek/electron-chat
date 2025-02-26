<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ToastClose as ToastCloseRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
	class?: string
}>()
</script>

<template>
	<ToastCloseRoot
		:class="
			cn(
				'absolute right-2 top-2 rounded-md p-1.5 text-foreground/50 opacity-70 transition-all hover:text-foreground hover:opacity-100 hover:bg-muted focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100',
				props.class
			)
		"
	>
		<X class="h-4 w-4" />
		<span class="sr-only">关闭</span>
	</ToastCloseRoot>
</template>
