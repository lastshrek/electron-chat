<template>
	<div class="flex justify-center my-4">
		<div class="px-4 py-1.5 bg-gray-50 text-gray-500 text-sm select-none rounded-full border border-gray-100 shadow-sm">
			{{ message.content }}
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Message } from '@/types/message'

defineProps<{
	message: Message
}>()
</script>

<style scoped>
.flex {
	margin: 1rem 0;
}
</style>
