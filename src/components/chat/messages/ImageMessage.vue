<template>
	<div class="bg-transparent shadow-none relative group">
		<div class="rounded-lg overflow-hidden cursor-pointer relative" @click="handleImageClick">
			<img
				:key="message.id"
				:src="imageUrl"
				:alt="message.content"
				:style="getImageStyle()"
				class="object-cover"
				loading="lazy"
			/>

			<!-- 加载中状态 -->
			<div
				v-if="message.status === MessageStatus.SENDING"
				class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"
			>
				<Loader2Icon class="w-6 h-6 text-white animate-spin" />
			</div>

			<!-- 失败状态 -->
			<div
				v-if="message.status === MessageStatus.FAILED"
				class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"
			>
				<AlertCircle class="w-6 h-6 text-red-500" />
			</div>

			<!-- 图片操作按钮 -->
			<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<!-- 下载按钮 -->
				<button
					class="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
					@click.stop="handleDownload"
				>
					<Download class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Download, Loader2 as Loader2Icon } from 'lucide-vue-next'
import type { Message } from '@/types/message'
import { MessageStatus } from '@/types/message'
import { messageService } from '@/services/message'

const props = defineProps<{
	message: Message
}>()

const IMAGE_HEIGHT = 240 // 固定高度

// 计算属性获取图片URL
const imageUrl = computed(() => {
	return props.message.metadata?.url || props.message.content
})

const getImageStyle = () => {
	const { width = 0, height = 0 } = props.message.metadata || {}

	if (!width || !height) {
		return {
			height: `${IMAGE_HEIGHT}px`,
			width: 'auto',
		}
	}

	// 根据原始宽高比计算显示宽度
	const ratio = width / height
	const displayWidth = Math.round(IMAGE_HEIGHT * ratio)

	return {
		height: `${IMAGE_HEIGHT}px`,
		width: `${displayWidth}px`,
	}
}

const handleImageClick = () => {
	if (imageUrl.value) {
		window.open(imageUrl.value, '_blank')
	}
}

const handleDownload = async () => {
	if (imageUrl.value) {
		await messageService.downloadFile(imageUrl.value)
	}
}
</script>
