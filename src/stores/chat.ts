import {defineStore} from "pinia";
import {ref, computed} from "vue";
import type {FriendRequestData} from "@/types/ws";
import {eventBus} from "@/utils/eventBus";
import {useUserStore} from "@/stores/user";
import {io} from "socket.io-client"; // 确保已经导入
import {chatApi, type ChatResponse} from "@/api/chat";
import {wsService} from "@/services/ws";
import type {Message} from "@/types/api";

export interface ChatInfo {
	id: number;
	name: string | null;
	type: "DIRECT" | "GROUP";
	participants: Array<{
		id: number;
		username: string;
		avatar: string;
	}>;
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
	};
	unreadCount: number;
	otherUser?: {
		id: number;
		username: string;
		avatar: string;
	};
}

export const useChatStore = defineStore("chat", {
	state: () => ({
		socket: null as any,
		connected: false,
		chats: new Map<number, ChatInfo>(),
		initialized: false,
		_lastUnreadTotal: 0, // 添加一个内部状态来跟踪上一次的未读总数
	}),

	getters: {
		unreadTotal: (state) => {
			let total = 0;
			state.chats.forEach((chat) => {
				total += chat.unreadCount || 0;
			});
			return total;
		},
	},

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
				// 创建 socket 实例
				this.socket = io(import.meta.env.VITE_WS_URL, {
					auth: {
						token: userStore.token,
					},
					transports: ["websocket"],
				});

				// 监听连接事件
				this.socket.on("connect", async () => {
					console.log("socket 连接成功");
					this.connected = true;
					this.initialized = true;

					// socket 连接成功后加载聊天列表
					await this.loadChats();
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

		// 私有方法：只在未读总数真正变化时触发事件
		_emitUnreadUpdate() {
			const currentTotal = this.unreadTotal;
			if (currentTotal !== this._lastUnreadTotal) {
				this._lastUnreadTotal = currentTotal;
				eventBus.emit("unread-count-updated", currentTotal);
			}
		},

		clearUnread(chatId: number) {
			const chat = this.chats.get(chatId);
			if (chat && chat.unreadCount > 0) {
				chat.unreadCount = 0;
				this._emitUnreadUpdate();
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
				chat.unreadCount = (chat.unreadCount || 0) + 1;
				this._emitUnreadUpdate();
			}
		},

		async initialize() {
			if (this.initialized) {
				console.log("聊天 store 已经初始化过");
				return;
			}

			try {
				await this.loadChats();
				this.initialized = true;
			} catch (error) {
				console.error("聊天 store 初始化失败:", error);
				throw error;
			}
		},

		async loadChats() {
			try {
				const response = await chatApi.getChats({limit: 20, page: 1});

				const chats = response as unknown as ChatResponse;

				if (!chats?.chats || chats.chats.length === 0) {
					console.warn("未获取到任何聊天");
					return;
				}

				// 清空现有聊天列表
				this.chats.clear();

				// 添加新的聊天
				for (const chat of chats.chats) {
					this.setChat({
						id: chat.id,
						name: chat.name,
						type: chat.type,
						participants: chat.participants,
						lastMessage: chat.lastMessage
							? {
									id: chat.lastMessage.id,
									content: chat.lastMessage.content,
									type: chat.lastMessage.type,
									status: chat.lastMessage.status,
									timestamp: chat.lastMessage.createdAt,
									sender: chat.lastMessage.sender,
							  }
							: undefined,
						unreadCount: chat.unreadCount,
						otherUser: chat.otherUser,
					});
				}
			} catch (error) {
				console.error("加载聊天列表失败:", error);
				throw error;
			}
		},
	},
});
