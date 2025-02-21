<template>
	<div class="relative">
		<!-- 加载中状态 -->
		<div
			v-if="loading"
			class="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg"
		>
			<Loader2Icon class="w-5 h-5 text-slate-400 animate-spin" />
		</div>

		<!-- 错误状态 -->
		<div
			v-if="error"
			class="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg"
		>
			<span class="text-slate-400 text-xs">{{ alt?.[0]?.toUpperCase() || '?' }}</span>
		</div>

		<!-- 图片 -->
		<img
			:src="src"
			:alt="alt"
			class="w-full h-full object-cover"
			:class="{ 'opacity-0': loading || error }"
			@load="handleLoad"
			@error="handleError"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Loader2Icon } from 'lucide-vue-next';

const props = defineProps<{
	src: string | null | undefined;
	alt?: string;
}>();

const loading = ref(true);
const error = ref(false);

const handleLoad = () => {
	loading.value = false;
	error.value = false;
};

const handleError = () => {
	loading.value = false;
	error.value = true;
};
</script> 