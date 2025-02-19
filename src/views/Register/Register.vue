<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:29:50
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 19:57:21
 * @FilePath     : /src/views/Register/Register.vue
 * @Description  : Register Page
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:29:50
-->
<template>
	<div class="relative min-h-screen flex items-center justify-center overflow-hidden">
		<!-- 背景装饰 -->
		<div class="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<!-- 网格纹理 -->
			<div class="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,transparent,black)]" />

			<!-- 动态渐变球 -->
			<div
				class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl animate-blob"
			/>
			<div
				class="absolute top-1/3 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-blob animation-delay-2000"
			/>
			<div
				class="absolute -bottom-8 left-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/30 to-violet-400/30 rounded-full blur-3xl animate-blob animation-delay-4000"
			/>
		</div>

		<!-- 注册卡片 -->
		<div class="relative w-full max-w-md space-y-8 p-8">
			<div
				class="rounded-2xl border bg-white/70 backdrop-blur-xl shadow-lg p-8 space-y-6 transition duration-500 hover:shadow-xl hover:bg-white/80"
			>
				<!-- Logo 和标题 -->
				<div class="text-center space-y-2">
					<h1 class="text-2xl font-semibold tracking-tight">创建账号</h1>
					<p class="text-sm text-muted-foreground">填写以下信息以注册新账号</p>
				</div>

				<!-- 注册表单 -->
				<form @submit="handleSubmit" class="space-y-4">
					<!-- 用户名输入框 -->
					<div class="space-y-2">
						<label
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							for="username"
						>
							用户名
						</label>
						<input
							v-model="username"
							class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							id="username"
							name="username"
							placeholder="输入您的用户名"
							type="text"
							required
						/>
					</div>

					<!-- 密码输入框 -->
					<div class="space-y-2">
						<label
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							for="password"
						>
							密码
						</label>
						<div class="relative">
							<input
								v-model="password"
								:type="showPassword ? 'text' : 'password'"
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
								id="password"
								name="password"
								placeholder="输入您的密码"
								required
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
								@click="togglePasswordVisibility('password')"
							>
								<Eye v-if="!showPassword" class="h-4 w-4" />
								<EyeOff v-else class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- 确认密码输入框 -->
					<div class="space-y-2">
						<label
							class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							for="confirmPassword"
						>
							确认密码
						</label>
						<div class="relative">
							<input
								v-model="confirmPassword"
								:type="showConfirmPassword ? 'text' : 'password'"
								class="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
								id="confirmPassword"
								name="confirmPassword"
								placeholder="再次输入密码"
								required
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
								@click="togglePasswordVisibility('confirm')"
							>
								<Eye v-if="!showConfirmPassword" class="h-4 w-4" />
								<EyeOff v-else class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- 服务条款 -->
					<div class="flex items-center space-x-2">
						<input
							v-model="agreeTerms"
							class="h-4 w-4 rounded border border-input bg-background"
							id="terms"
							name="terms"
							type="checkbox"
							required
						/>
						<label class="text-sm text-muted-foreground" for="terms">
							我同意
							<a class="text-primary hover:underline" href="#" target="_blank">服务条款</a>
							和
							<a class="text-primary hover:underline" href="#" target="_blank">隐私政策</a>
						</label>
					</div>

					<!-- 注册按钮 -->
					<button 
						type="submit"
						class="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow"
					>
						注册
					</button>

					<!-- 登录链接 -->
					<div class="text-center text-sm">
						<span class="text-muted-foreground">已有账号？</span>
						<a 
							class="text-primary hover:underline ml-1" 
							href="#" 
							@click.prevent="router.push('/login')"
						>
							立即登录
						</a>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { encrypt } from '@/utils/crypto'
import { Eye, EyeOff } from 'lucide-vue-next'
import { authApi } from '@/api/auth'
import { handleApiError } from '@/utils/error'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreeTerms = ref(false)

const handleSubmit = async (e: Event) => {
	e.preventDefault()

	if (!validateForm()) {
		return
	}

	try {
		const encryptedPassword = encrypt(password.value)

		// 注册请求
		const registerResult = await authApi.register({
			username: username.value,
			password: encryptedPassword,
		})

		// 直接使用注册返回的用户信息和token
		userStore.setToken(registerResult.token)
		userStore.setUserInfo(registerResult.user)

		router.push('/')
	} catch (error: unknown) {
		const apiError = handleApiError(error)
		console.error('注册失败:', apiError.message)
		// 这里可以添加错误提示UI
	}
}

const validateForm = () => {
	if (!username.value || !password.value || !confirmPassword.value) {
		console.error('请填写所有必填字段')
		return false
	}

	if (password.value !== confirmPassword.value) {
		console.error('两次输入的密码不一致')
		return false
	}

	if (!agreeTerms.value) {
		console.error('请同意服务条款')
		return false
	}

	return true
}

const togglePasswordVisibility = (field: 'password' | 'confirm') => {
	if (field === 'password') {
		showPassword.value = !showPassword.value
	} else {
		showConfirmPassword.value = !showConfirmPassword.value
	}
}
</script>



<style scoped>
.bg-grid-slate-200\/20 {
	background-image: linear-gradient(to right, rgb(226 232 240 / 0.1) 1px, transparent 1px),
		linear-gradient(to bottom, rgb(226 232 240 / 0.1) 1px, transparent 1px);
	background-size: 4rem 4rem;
}

@keyframes blob {
	0% {
		transform: translate(0px, 0px) scale(1);
	}
	33% {
		transform: translate(30px, -50px) scale(1.1);
	}
	66% {
		transform: translate(-20px, 20px) scale(0.9);
	}
	100% {
		transform: translate(0px, 0px) scale(1);
	}
}

.animate-blob {
	animation: blob 7s infinite;
}

.animation-delay-2000 {
	animation-delay: 2s;
}

.animation-delay-4000 {
	animation-delay: 4s;
}
</style>
