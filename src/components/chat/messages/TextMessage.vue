<template>
	<div
		class="whitespace-pre-wrap px-4 break-words text-sm rounded-2xl py-2"
		:class="[isSender ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 shadow-sm']"
	>
		{{ message.content }}
	</div>
</template>

<script setup lang="ts">
import type { Message } from '@/types/message'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'

const props = defineProps<{
	message: Message
}>()

const userStore = useUserStore()
const isSender = computed(() => props.message.senderId === userStore.userInfo?.id)
</script>
