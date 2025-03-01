<template>
	<div class="max-w-[300px]">
		<div
			class="flex flex-col bg-transparent rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all"
		>
			<!-- 文件信息部分 -->
			<div class="p-3 flex items-start gap-3">
				<!-- 文件类型图标 -->
				<div
					class="w-10 h-10 rounded-lg flex items-center justify-center"
					:class="getFileTypeClass(message.metadata?.mimeType)"
				>
					<FileText class="w-5 h-5" :class="getFileIconColor(message.metadata?.mimeType)" />
				</div>

				<!-- 文件名和大小 -->
				<div class="flex-1 min-w-0">
					<p class="font-medium text-gray-900 truncate" :title="message.metadata?.fileName">
						{{ message.metadata?.fileName }}
					</p>
					<p class="text-xs text-gray-500">
						{{ formatFileSize(message.metadata?.fileSize || 0) }}
					</p>
				</div>
			</div>

			<!-- 下载按钮部分 -->
			<div class="px-3 py-2 border-t border-gray-100 flex items-center justify-between">
				<span class="text-xs text-gray-500">
					{{ formatTime(message.createdAt) }}
				</span>
				<button
					@click="handleDownload"
					class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600"
					:class="{ 'opacity-50 cursor-not-allowed': isDownloading }"
					:disabled="isDownloading"
				>
					<Download class="w-4 h-4" v-if="!isDownloading" />
					<Loader2 class="w-4 h-4 animate-spin" v-else />
					<span class="text-xs font-medium">下载</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Download, Loader2, FileText } from 'lucide-vue-next'
import type { Message } from '@/types/message'
import { messageService } from '@/services/message'
import { formatTime } from '@/utils/date'

const props = defineProps<{
	message: Message
}>()

const isDownloading = ref(false)

const handleDownload = async () => {
	if (isDownloading.value || !props.message.metadata?.url) return

	try {
		isDownloading.value = true
		await messageService.downloadFile(props.message.metadata.url)
	} catch (error) {
		console.error('下载文件失败:', error)
	} finally {
		isDownloading.value = false
	}
}

const getFileTypeClass = (mimeType?: string) => {
	if (!mimeType) return 'bg-gray-100'

	if (mimeType.startsWith('image/')) return 'bg-blue-50'
	if (mimeType.startsWith('video/')) return 'bg-purple-50'
	if (mimeType.startsWith('audio/')) return 'bg-green-50'
	if (mimeType.includes('pdf')) return 'bg-red-50'
	if (mimeType.includes('word')) return 'bg-blue-50'
	if (mimeType.includes('excel')) return 'bg-green-50'

	return 'bg-gray-100'
}

const getFileIconColor = (mimeType?: string) => {
	if (!mimeType) return 'text-gray-500'

	if (mimeType.startsWith('image/')) return 'text-blue-500'
	if (mimeType.startsWith('video/')) return 'text-purple-500'
	if (mimeType.startsWith('audio/')) return 'text-green-500'
	if (mimeType.includes('pdf')) return 'text-red-500'
	if (mimeType.includes('word')) return 'text-blue-500'
	if (mimeType.includes('excel')) return 'text-green-500'

	return 'text-gray-500'
}

const formatFileSize = (bytes: number) => {
	if (!bytes) return '未知大小'

	const units = ['B', 'KB', 'MB', 'GB']
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`
}
</script>
