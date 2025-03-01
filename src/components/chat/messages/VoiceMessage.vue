<template>
	<div
		class="rounded-2xl shadow-sm max-w-[240px]"
		:class="[isSender ? 'bg-blue-500 text-white' : 'bg-white text-gray-900']"
	>
		<div class="flex items-center gap-3 p-3">
			<button
				@click="togglePlay"
				class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
				:class="[isSender ? 'bg-blue-400 hover:bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-blue-600']"
			>
				<Play v-if="!isPlaying" class="w-4 h-4" />
				<Pause v-else class="w-4 h-4" />
			</button>

			<div class="flex-1">
				<div class="h-1 rounded-full overflow-hidden" :class="[isSender ? 'bg-blue-400' : 'bg-gray-200']">
					<div
						class="h-full transition-all duration-300"
						:class="[isSender ? 'bg-white' : 'bg-blue-500']"
						:style="{ width: `${progress}%` }"
					></div>
				</div>
				<div class="text-xs mt-1" :class="[isSender ? 'text-blue-100' : 'text-gray-500']">
					{{ formatDuration(message.metadata?.duration || 0) }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Play, Pause } from 'lucide-vue-next'
import type { Message } from '@/types/message'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
	message: Message
}>()

const userStore = useUserStore()
const isSender = computed(() => props.message.senderId === userStore.userInfo?.id)

const isPlaying = ref(false)
const progress = ref(0)
const audio = new Audio(props.message.metadata?.url)

const togglePlay = () => {
	if (isPlaying.value) {
		audio.pause()
		isPlaying.value = false
	} else {
		audio.play()
		isPlaying.value = true
	}
}

const formatDuration = (seconds: number) => {
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = Math.floor(seconds % 60)
	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 监听音频进度
audio.addEventListener('timeupdate', () => {
	progress.value = (audio.currentTime / audio.duration) * 100
})

// 监听音频结束
audio.addEventListener('ended', () => {
	isPlaying.value = false
	progress.value = 0
})

// 组件卸载时清理
onUnmounted(() => {
	audio.pause()
	audio.remove()
})
</script>
