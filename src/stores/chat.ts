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
		chats: new Map<number, ChatInfo>(),
		initialized: false,
	}),

	actions: {
		initSocket() {
			const userStore = useUserStore();
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

		setChat(chat: ChatInfo) {
			this.chats.set(chat.id, chat);
		},

		removeChat(chatId: number) {
			this.chats.delete(chatId);
		},

		clearUnread(chatId: number) {
			const chat = this.chats.get(chatId);
			if (chat) {
				chat.unreadCount = 0;
			}
		},

		updateLastMessage(chatId: number, message: ChatInfo["lastMessage"]) {
			const chat = this.chats.get(chatId);
			if (chat) {
				chat.lastMessage = message;
			}
		},

		incrementUnread(chatId: number) {
			const chat = this.chats.get(chatId);
			if (chat) {
				chat.unreadCount++;
			}
		},

		async initialize() {
			console.log("开始初始化聊天 store");
			if (this.initialized) {
				console.log("聊天 store 已经初始化过");
				return;
			}

			try {
				await this.loadChats();
				this.initialized = true;
				console.log("聊天 store 初始化完成");
			} catch (error) {
				console.error("聊天 store 初始化失败:", error);
				throw error;
			}
		},

		async loadChats() {
			if (!window.electron?.ipcRenderer) return;

			try {
				// 先获取当前登录用户
				const currentUser = await window.electron.ipcRenderer.invoke("db:getCurrentUser");
				if (!currentUser) {
					console.warn("未找到当前登录用户，跳过加载聊天列表");
					return;
				}
				console.log("当前登录用户:", currentUser);

				console.log("开始加载聊天列表");
				const chats = await window.electron.ipcRenderer.invoke("db:getChats");
				console.log("获取到的聊天列表:", chats);

				if (!chats || chats.length === 0) {
					console.warn("未获取到任何聊天");
					return;
				}

				// 清空现有聊天列表
				this.chats.clear();

				// 添加新的聊天
				for (const chat of chats) {
					console.log("添加聊天:", chat);
					this.setChat(chat);
				}

				console.log("聊天列表加载完成，数量:", this.chats.size);
			} catch (error) {
				console.error("加载聊天列表失败:", error);
				throw error;
			}
		},
	},
});
