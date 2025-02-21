import type {Friend} from "./api";

interface DBOperations {
	createLoginUser: (params: {user_id: number; username: string; avatar: string}) => Promise<any>;
	getCurrentUser: () => Promise<any>;
	clearLoginUser: () => Promise<boolean>;
	syncFriends: (friends: Friend[]) => Promise<boolean>;
	getFriends: (userId: number) => Promise<
		{
			id: number;
			createdAt: string;
			userId: number;
			friendId: number;
			friendUsername: string;
			friendAvatar: string;
		}[]
	>;
}

export interface ElectronAPI {
	platform: string;
	send: (channel: string, data: any) => void;
	on: (channel: string, callback: Function) => void;
	db: DBOperations;
}

declare global {
	interface Window {
		electron: ElectronAPI;
	}
}

export {};
