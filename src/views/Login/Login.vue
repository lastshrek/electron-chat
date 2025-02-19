<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:09:17
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 19:54:47
 * @FilePath     : /src/views/Login/Login.vue
 * @Description  : Login page
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:09:17
-->
<script setup lang="ts">
	import {ref} from "vue";
	import {useRouter} from "vue-router";
	import {Button} from "@/components/ui/button";
	import {useUserStore} from "@/stores/user";
	import {encrypt} from "@/utils/crypto";
	import {Eye, EyeOff} from "lucide-vue-next";
	import {authApi} from "@/api/auth";
	import {handleApiError} from "@/utils/error";
	import {toast} from "@/components/ui/toast";

	const router = useRouter();
	const userStore = useUserStore();

	const username = ref("");
	const password = ref("");
	const remember = ref(false);
	const showPassword = ref(false);
	const loading = ref(false);

	console.log('Login component mounted');

	const handleSubmit = async (e: Event) => {
		console.log('Form submit event:', e);
		e.preventDefault();
		
		try {
			if (!username.value || !password.value) {
				console.log('Validation failed:', { username: username.value });
				toast({
					title: "错误",
					description: "请输入用户名和密码",
					variant: "destructive",
				});
				return;
			}
			
			await handleLogin();
		} catch (error) {
			console.error('Submit error:', error);
		}
	};

	const handleLogin = async () => {
		console.log('handleLogin started');
		if (loading.value) {
			console.log('Already loading, returning');
			return;
		}
		loading.value = true;
		console.log('Loading state set to true');

		try {
			const encryptedPassword = encrypt(password.value);
			console.log('Password encrypted');

			console.log('Sending login request:', { 
				username: username.value, 
				passwordLength: encryptedPassword.length,
				remember: remember.value 
			});

			const result = await authApi.login({
				username: username.value,
				password: encryptedPassword,
				remember: remember.value,
			});

			console.log('Login API response:', result);

			// 登录成功
			userStore.setToken(result.token);
			userStore.setUserInfo(result.user);
			console.log('User store updated');

			toast({
				title: "登录成功",
				description: "欢迎回来！",
			});
			console.log('Success toast shown');

			console.log('Navigating to home');
			router.push("/");
		} catch (error: unknown) {
			console.log('Login error:', error);
			const apiError = handleApiError(error);
			console.error("登录失败:", apiError);
			toast({
				title: "登录失败",
				description: apiError.message,
				variant: "destructive",
			});
		} finally {
			console.log('Setting loading to false');
			loading.value = false;
		}
	};

	const togglePasswordVisibility = () => {
		showPassword.value = !showPassword.value;
	};
</script>

<template>
	<div class="relative min-h-screen flex items-center justify-center overflow-hidden">
		<!-- 背景装饰 -->
		<div class="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<!-- 网格纹理 -->
			<div
				class="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,transparent,black)]"
			/>

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

			<!-- 装饰线条 -->
			<div
				class="absolute inset-0 bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
			>
				<div class="absolute inset-0 bg-repeat bg-decorative-lines opacity-[0.015]" />
			</div>
		</div>

		<!-- 登录卡片 -->
		<div class="relative w-full max-w-md space-y-8 p-8">
			<div
				class="rounded-2xl border bg-white/70 backdrop-blur-xl shadow-lg p-8 space-y-6 transition duration-500 hover:shadow-xl hover:bg-white/80"
			>
				<!-- Logo 和标题 -->
				<div class="text-center space-y-2">
					<h1 class="text-2xl font-semibold tracking-tight">欢迎回来</h1>
					<p class="text-sm text-muted-foreground">请登录您的账号继续使用</p>
				</div>

				<!-- 登录表单 -->
				<form 
					@submit.prevent="handleSubmit"
					class="space-y-4"
				>
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
								@click="togglePasswordVisibility"
							>
								<Eye v-if="!showPassword" class="h-4 w-4" />
								<EyeOff v-else class="h-4 w-4" />
							</button>
						</div>
					</div>

					<!-- 记住我和忘记密码 -->
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-2">
							<input
								v-model="remember"
								class="h-4 w-4 rounded border border-input bg-background"
								id="remember"
								name="remember"
								type="checkbox"
							/>
							<label class="text-sm text-muted-foreground" for="remember"
								>记住我</label
							>
						</div>
						<a class="text-sm text-primary hover:underline" href="#">忘记密码？</a>
					</div>

					<!-- 登录按钮 -->
					<button 
						type="submit"
						:disabled="loading"
						class="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow"
					>
						{{ loading ? '登录中...' : '登录' }}
					</button>

					<!-- 注册链接 -->
					<div class="text-center text-sm">
						<span class="text-muted-foreground">还没有账号？</span>
						<a
							class="text-primary hover:underline ml-1"
							href="#"
							@click.prevent="router.push('/register')"
							>立即注册</a
						>
					</div>
				</form>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.bg-grid-slate-200\/20 {
		background-image: linear-gradient(to right, rgb(226 232 240 / 0.1) 1px, transparent 1px),
			linear-gradient(to bottom, rgb(226 232 240 / 0.1) 1px, transparent 1px);
		background-size: 4rem 4rem;
	}

	.bg-decorative-lines {
		background-image: repeating-linear-gradient(
			45deg,
			#6366f1 0px,
			#6366f1 1px,
			transparent 1px,
			transparent 10px
		);
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
