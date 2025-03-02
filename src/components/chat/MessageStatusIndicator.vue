<template>
	<div class="ml-2 flex-shrink-0">
		<Check v-if="status === MessageStatus.SENT" class="w-4 h-4 text-gray-400" />
		<CheckCheck v-else-if="status === MessageStatus.DELIVERED" class="w-4 h-4 text-gray-400" />
		<CheckCheck v-else-if="status === MessageStatus.READ" class="w-4 h-4 text-blue-500" />
		<AlertCircle v-else-if="status === MessageStatus.FAILED" class="w-4 h-4 text-red-500" />
	</div>
</template>

<script setup lang="ts">
import { Check, CheckCheck, AlertCircle } from 'lucide-vue-next'
import { MessageStatus } from '@/types/message'

defineProps<{
	status: MessageStatus
}>()
</script>
