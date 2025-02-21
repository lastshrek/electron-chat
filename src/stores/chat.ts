import {defineStore} from "pinia";
import {ref, computed} from "vue";
import type {FriendRequestData} from "@/types/ws";
import {eventBus} from "@/utils/eventBus";
import {useUserStore} from "@/stores/user";
import {io} from "socket.io-client"; // 确保已经导入

export interface ChatInfo {
	id: number;
	name: string | null;
	type: "DIRECT" | "GROUP";
	lastMessage?: {
		id: number;
		content: string;
		type: string;
		status: string;
		timestamp: string;
		sender: {
			id: number;
			username: string;
			avatar: string;
		};
		receiver: {
			id: number;
			username: string;
			avatar: string;
		};
	};
	unreadCount: number;
	participants: Array<{
		id: number;
		username: string;
		avatar: string;
	}>;
}

export const useChatStore = defineStore("chat", {
	state: () => ({
		socket: null as any,
		connected: false,
	}),

	actions: {
		initSocket() {
			const userStore = useUserStore();
			console.log("userStore.token", userStore.token);
			if (!userStore.token) {
				console.warn("未登录，无法初始化 socket");
				return;
			}

			// 确保不会重复连接
			if (this.socket?.connected) {
				console.log("socket 已连接，跳过初始化");
				return;
			}

			try {
				console.log("开始初始化 socket 连接");
				// 创建 socket 实例
				this.socket = io(import.meta.env.VITE_WS_URL, {
					auth: {
						token: userStore.token,
					},
					transports: ["websocket"],
				});

				// 监听连接事件
				this.socket.on("connect", () => {
					console.log("socket 连接成功");
					this.connected = true;
				});

				// 监听断开连接事件
				this.socket.on("disconnect", () => {
					console.log("socket 断开连接，尝试重连");
					this.connected = false;
					setTimeout(() => {
						this.initSocket();
					}, 3000);
				});

				// 监听错误事件
				this.socket.on("error", (error: any) => {
					console.error("socket 错误:", error);
					this.connected = false;
				});
			} catch (error) {
				console.error("初始化 socket 失败:", error);
				this.connected = false;
			}
		},

		disconnectSocket() {
			if (this.socket) {
				this.socket.disconnect();
				this.socket = null;
				this.connected = false;
			}
		},
	},
});
