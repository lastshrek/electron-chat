export interface LoginUser {
	id: number;
	user_id: number;
	username: string;
	avatar: string;
	created_at: string;
	updated_at: string;
}

export interface Friendship {
	id: number;
	user_id: number;
	friend_id: number;
	created_at: string;
}

export interface FriendWithDetails {
	id: number;
	userId: number;
	friendId: number;
	createdAt: string;
	friendUsername: string;
	friendAvatar: string;
	chatId?: number;
}

export interface Contact {
	id: number;
	user_id: number;
	username: string;
	avatar: string;
	chat_id?: number;
	created_at: string;
	updated_at: string;
}

export interface Chat {
	id: number;
	chat_id: number;
	type: string;
	name: string;
	created_at: string;
	updated_at: string;
}
