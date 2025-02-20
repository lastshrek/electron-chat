export interface FriendWithDetails {
	id: number;
	createdAt: string;
	userId: number;
	friendId: number;
	friendUsername: string;
	friendAvatar: string;
	chatId: number | null;
}
