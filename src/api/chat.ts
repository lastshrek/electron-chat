import request from "@/utils/request";
import type {ApiResponse} from "@/types/api";

export interface ChatResponse {
	chats: Array<{
		id: number;
		name: string | null;
		type: "DIRECT" | "GROUP";
		participants: Array<{
			id: number;
			username: string;
			avatar: string;
		}>;
		otherUser: {
			id: number;
			username: string;
			avatar: string;
		};
		lastMessage: {
			id: number;
			content: string;
			type: string;
			status: string;
			metadata: Record<string, any>;
			createdAt: string;
			updatedAt: string;
			senderId: number;
			receiverId: number;
			chatId: number;
			sender: {
				id: number;
				username: string;
				avatar: string;
			};
		};
		unreadCount: number;
		totalMessages: number;
		updatedAt: string;
		createdAt: string;
	}>;
	hasMore: boolean;
	total: number;
}

export const chatApi = {
	getChats(params: {limit: number; page: number}) {
		return request.get<ApiResponse<ChatResponse>>("/messages/chats", {params});
	},
};
