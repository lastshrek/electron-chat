import {defineStore} from "pinia";
import {ref} from "vue";

export interface Message {
	id: number;
	content: string;
	type: "TEXT" | "IMAGE" | "FILE";
	status: "SENT" | "DELIVERED" | "READ";
	senderId: number;
	receiverId: number;
	chatId: number;
	timestamp: string;
	metadata?: Record<string, any>;
}

interface MessageGroup {
	date: string;
	messages: Message[];
}

export const useMessageStore = defineStore("message", () => {
	// 使用 Map 存储每个聊天的消息
	// key: chatId, value: 消息数组
	const messages = ref<Map<number, Message[]>>(new Map());

	// 添加新消息
	const addMessage = (message: Message) => {
		const chatMessages = messages.value.get(message.chatId) || [];
		chatMessages.push(message);
		messages.value.set(message.chatId, chatMessages);
		persistMessages();
	};

	// 按日期分组获取消息
	const getMessagesByChat = (chatId: number): MessageGroup[] => {
		const chatMessages = messages.value.get(chatId) || [];
		const groupedMessages = new Map<string, Message[]>();

		chatMessages.forEach((message) => {
			const date = new Date(message.timestamp).toLocaleDateString();
			const group = groupedMessages.get(date) || [];
			group.push(message);
			groupedMessages.set(date, group);
		});

		return Array.from(groupedMessages.entries()).map(([date, messages]) => ({
			date,
			messages: messages.sort(
				(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
			),
		}));
	};

	// 更新消息状态
	const updateMessageStatus = (messageId: number, status: Message["status"]) => {
		messages.value.forEach((chatMessages) => {
			const message = chatMessages.find((m) => m.id === messageId);
			if (message) {
				message.status = status;
				persistMessages();
			}
		});
	};

	// 从本地存储加载消息
	const loadFromStorage = () => {
		const stored = localStorage.getItem("messages");
		if (stored) {
			messages.value = new Map(JSON.parse(stored));
		}
	};

	// 保存到本地存储
	const persistMessages = () => {
		localStorage.setItem("messages", JSON.stringify(Array.from(messages.value.entries())));
	};

	// 清除指定聊天的消息
	const clearChatMessages = (chatId: number) => {
		messages.value.delete(chatId);
		persistMessages();
	};

	// 清除所有消息
	const clearAllMessages = () => {
		messages.value.clear();
		persistMessages();
	};

	// 更新消息ID（从临时ID到真实ID）
	const updateMessageId = (tempId: number, realId: number) => {
		messages.value.forEach((chatMessages) => {
			const index = chatMessages.findIndex((m) => m.id === tempId);
			if (index !== -1) {
				chatMessages[index].id = realId;
				persistMessages();
			}
		});
	};

	// 重发消息
	const resendMessage = async (messageId: number) => {
		const message = findMessage(messageId);
		if (!message) return false;

		// 更新状态为发送中
		updateMessageStatus(messageId, "SENDING");

		try {
			// 重新发送消息
			wsService.socket?.emit("message", {
				chatId: message.chatId,
				receiverId: message.receiverId,
				type: message.type,
				content: message.content,
				tempId: messageId, // 使用原消息ID作为临时ID
			});

			return true;
		} catch (error) {
			console.error("重发消息失败:", error);
			updateMessageStatus(messageId, "FAILED");
			return false;
		}
	};

	// 查找消息
	const findMessage = (messageId: number) => {
		for (const chatMessages of messages.value.values()) {
			const message = chatMessages.find((m) => m.id === messageId);
			if (message) return message;
		}
		return null;
	};

	// 更新消息
	const updateMessage = (messageId: number, updates: Partial<Message>) => {
		messages.value.forEach((chatMessages) => {
			const index = chatMessages.findIndex((m) => m.id === messageId);
			if (index !== -1) {
				chatMessages[index] = {
					...chatMessages[index],
					...updates,
				};
				persistMessages();
			}
		});
	};

	// 初始化时加载数据
	loadFromStorage();

	return {
		messages,
		addMessage,
		getMessagesByChat,
		updateMessageStatus,
		clearChatMessages,
		clearAllMessages,
		updateMessageId,
		resendMessage,
		findMessage,
		updateMessage,
	};
});
