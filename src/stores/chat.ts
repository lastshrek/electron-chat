import {defineStore} from "pinia";
import {ref, computed} from "vue";
import type {FriendRequestData} from "@/types/ws";
import {eventBus} from "@/utils/eventBus";
import {useUserStore} from "@/stores/user";

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

export const useChatStore = defineStore("chat", () => {
	const chats = ref<Map<number, ChatInfo>>(new Map());
	const unreadTotal = computed(() => {
		return Array.from(chats.value.values()).reduce(
			(total, chat) => total + chat.unreadCount,
			0
		);
	});

	const userStore = useUserStore();

	// 从数据库加载聊天列表
	const loadChats = async () => {
		if (!window.electron?.db) return;

		try {
			const dbChats = await window.electron.db.getChats();
			chats.value = new Map(
				dbChats.map((chat) => [
					chat.chat_id,
					{
						id: chat.chat_id,
						name: chat.name,
						type: chat.type,
						unreadCount: 0, // 从消息表中计算
						participants: [], // 从 chat_participants 表中获取
						lastMessage: undefined, // 从消息表中获取最后一条
					},
				])
			);
		} catch (error) {
			console.error("加载聊天列表失败:", error);
		}
	};

	// 添加或更新聊天
	const upsertChat = async (chatData: FriendRequestData["data"]["chat"]) => {
		if (!chatData || !window.electron?.db || !userStore.userInfo) return;

		try {
			// 保存到数据库
			await window.electron.db.upsertChat(
				{
					chat_id: chatData.id,
					type: chatData.type,
					name: chatData.name,
					participants: chatData.participants.map((p) => ({
						user_id: p.user.id,
						username: p.user.username,
						avatar: p.user.avatar,
					})),
				},
				userStore.userInfo.id
			);

			// 更新内存中的数据
			const participants = chatData.participants.map((p) => ({
				id: p.user.id,
				username: p.user.username,
				avatar: p.user.avatar,
			}));

			chats.value.set(chatData.id, {
				id: chatData.id,
				name: chatData.name,
				type: chatData.type,
				participants,
				unreadCount: 0,
				lastMessage: chatData.lastMessage
					? {
							id: chatData.lastMessage.id,
							content: chatData.lastMessage.content,
							type: chatData.lastMessage.type,
							status: chatData.lastMessage.status,
							timestamp: chatData.lastMessage.createdAt,
							sender: {
								id: chatData.lastMessage.sender.id,
								username: chatData.lastMessage.sender.username,
								avatar: chatData.lastMessage.sender.avatar,
							},
							receiver: {
								id: chatData.lastMessage.receiver.id,
								username: chatData.lastMessage.receiver.username,
								avatar: chatData.lastMessage.receiver.avatar,
							},
					  }
					: undefined,
			});
		} catch (error) {
			console.error("保存聊天失败:", error);
		}
	};

	// 增加未读消息数
	const incrementUnread = (chatId: number) => {
		const chat = chats.value.get(chatId);
		if (chat) {
			chat.unreadCount++;
			persistChats();
			// 触发事件通知布局组件更新
			eventBus.emit("unread-count-updated", unreadTotal.value);
		}
	};

	// 清除未读消息数
	const clearUnread = (chatId: number) => {
		const chat = chats.value.get(chatId);
		if (chat) {
			chat.unreadCount = 0;
			persistChats();
			// 触发事件通知布局组件更新
			eventBus.emit("unread-count-updated", unreadTotal.value);
		}
	};

	// 从本地存储恢复数据
	const loadFromStorage = () => {
		const stored = localStorage.getItem("chats");
		if (stored) {
			chats.value = new Map(JSON.parse(stored));
		}
	};

	// 保存到本地存储
	const persistChats = () => {
		localStorage.setItem("chats", JSON.stringify(Array.from(chats.value.entries())));
	};

	// 初始化时加载数据
	loadChats();

	// 更新最后一条消息
	const updateLastMessage = (
		chatId: number,
		message: {
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
		}
	) => {
		const chat = chats.value.get(chatId);
		if (chat) {
			chat.lastMessage = {
				id: message.id,
				content: message.content,
				type: message.type,
				status: message.status,
				timestamp: message.timestamp,
				sender: message.sender,
				receiver: message.receiver,
			};
			persistChats();
		}
	};

	return {
		chats,
		unreadTotal,
		upsertChat,
		incrementUnread,
		clearUnread,
		updateLastMessage,
		loadChats,
	};
});
