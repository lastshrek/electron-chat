import {defineStore} from "pinia";
import {ref, computed} from "vue";
import type {FriendRequestData} from "@/types/ws";
import {eventBus} from "@/utils/eventBus";

interface ChatInfo {
	id: number;
	name: string | null;
	type: "DIRECT";
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

	// 添加或更新聊天
	const upsertChat = (chatData: FriendRequestData["data"]["chat"]) => {
		if (!chatData) return;

		const existingChat = chats.value.get(chatData.id);
		const participants = chatData.participants.map((p) => ({
			id: p.user.id,
			username: p.user.username,
			avatar: p.user.avatar,
		}));

		chats.value.set(chatData.id, {
			id: chatData.id,
			name: chatData.name,
			type: chatData.type,
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
			unreadCount: existingChat?.unreadCount || 0,
			participants,
		});

		// 保存到本地存储
		persistChats();
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
	loadFromStorage();

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
	};
});
