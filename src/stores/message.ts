import {defineStore} from "pinia";
import {ref} from "vue";

export interface Message {
	id: number;
	content: string;
	type: string;
	status: "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
	senderId: number;
	receiverId: number;
	chatId: number;
	timestamp: string;
	metadata?: Record<string, any>;
	sender?: {
		id: number;
		username: string;
		avatar: string;
	};
	receiver?: {
		id: number;
		username: string;
		avatar: string;
	};
}

interface MessageGroup {
	date: string;
	messages: Message[];
}

export const useMessageStore = defineStore("message", {
	state: () => ({
		messages: new Map<number, Message[]>(),
	}),

	actions: {
		addMessage(message: Message) {
			console.log("Adding message:", message);
			const chatMessages = this.messages.get(message.chatId) || [];

			// 检查消息是否已存在
			const exists = chatMessages.some((m) => m.id === message.id);
			if (exists) {
				console.log("Message already exists, skipping:", message.id);
				return;
			}

			// 添加新消息
			chatMessages.push(message);
			this.messages.set(message.chatId, chatMessages);

			console.log(
				"Updated messages for chat:",
				message.chatId,
				this.messages.get(message.chatId)?.length
			);
		},

		getMessagesByChat(chatId: number): Message[] {
			return this.messages.get(chatId) || [];
		},

		updateMessageStatus(messageId: number, status: Message["status"]) {
			for (const messages of this.messages.values()) {
				const message = messages.find((m) => m.id === messageId);
				if (message) {
					message.status = status;
					break;
				}
			}
		},

		updateMessage(messageId: number, updates: Partial<Message>) {
			for (const messages of this.messages.values()) {
				const message = messages.find((m) => m.id === messageId);
				if (message) {
					Object.assign(message, updates);
					break;
				}
			}
		},

		updateMessageId(oldId: number, newId: number) {
			for (const messages of this.messages.values()) {
				const messageIndex = messages.findIndex((m) => m.id === oldId);
				if (messageIndex !== -1) {
					messages[messageIndex] = {
						...messages[messageIndex],
						id: newId,
					};
					break;
				}
			}
		},
	},
});
