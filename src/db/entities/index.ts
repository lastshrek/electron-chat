export interface BaseEntity {
	id: number;
	created_at: string;
	updated_at: string;
}

export interface LoginUser extends BaseEntity {
	user_id: number;
	username: string;
	avatar: string;
}

export interface Contact extends BaseEntity {
	user_id: number;
	username: string;
	avatar: string;
}

export interface Friendship {
	id: number;
	user_id: number;
	friend_id: number;
	created_at: string;
}

export interface FriendWithDetails {
	id: number;
	createdAt: string;
	userId: number;
	friendId: number;
	friendUsername: string;
	friendAvatar: string;
}
