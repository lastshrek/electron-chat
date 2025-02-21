/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:28:07
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-21 23:41:12
 * @FilePath     : /src/router/index.ts
 * @Description  : router index
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:28:07
 */
import {createRouter, createWebHashHistory} from "vue-router";
import {useUserStore} from "@/stores/user";

const router = createRouter({
	history: createWebHashHistory(),
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

// 路由守卫
router.beforeEach((to, from, next) => {
	const userStore = useUserStore();

	if (to.meta.requiresAuth && !userStore.isAuthenticated) {
		// 需要认证但未登录，重定向到登录页
		next({name: "login"});
	} else if (to.name === "login" && userStore.isAuthenticated) {
		// 已登录但访问登录页，重定向到首页
		next({name: "home"});
	} else {
		next();
	}
});

export default router;
