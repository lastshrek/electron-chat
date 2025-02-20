/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:07
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 20:37:51
 * @FilePath     : /src/router/index.ts
 * @Description  : router index
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:28:07
 */
import {createRouter, createWebHistory} from "vue-router";
import {useUserStore} from "@/stores/user";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: "/",
			redirect: "/home",
		},
		{
			path: "/home",
			name: "home",
			component: () => import("@/views/Home/Home.vue"),
			children: [
				{
					path: "chat/:chatId?", // 可选的聊天ID参数
					name: "chat",
					component: () => import("@/views/Home/Home.vue"),
				},
			],
			meta: {requiresAuth: true},
		},
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/Login/Login.vue"),
			meta: {requiresAuth: false},
		},
		{
			path: "/register",
			name: "register",
			component: () => import("@/views/Register/Register.vue"),
			meta: {requiresAuth: false},
		},
		{
			path: "/contacts",
			name: "contacts",
			component: () => import("@/views/Contacts/Contacts.vue"),
			meta: {
				requiresAuth: true,
			},
		},
		{
			path: "/:pathMatch(.*)*",
			redirect: "/",
		},
	],
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
	const userStore = useUserStore();
	const isAuthenticated = userStore.isAuthenticated;

	// 需要认证的路由
	if (to.meta.requiresAuth && !isAuthenticated) {
		console.log("未登录，重定向到登录页");
		next({name: "login"});
		return;
	}

	// 已登录用户访问登录/注册页面
	if ((to.name === "login" || to.name === "register") && isAuthenticated) {
		console.log("已登录，重定向到首页");
		next({name: "home"});
		return;
	}

	next();
});

export default router;
