<script setup lang="ts">
// 这是一个纯展示组件，不需要任何逻辑
</script>

<template>
	<div class="flex items-center space-x-1">
		<div
			v-for="i in 3"
			:key="i"
			class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
			:style="{
				animationDelay: `${(i - 1) * 0.2}s`,
				animationDuration: '0.8s'
			}"
		></div>
	</div>
</template>

<style scoped>
.animate-bounce {
	animation: bounce 0.8s infinite;
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-4px);
	}
}
</style> 