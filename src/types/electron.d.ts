import type {Friend} from "./api";

interface IpcRenderer {
	invoke(channel: string, ...args: any[]): Promise<any>;
	on(channel: string, func: (...args: any[]) => void): void;
	once(channel: string, func: (...args: any[]) => void): void;
}

interface DB {
	createLoginUser(user: {username: string; avatar: string; user_id: number}): Promise<any>;
	getCurrentUser(): Promise<any>;
	syncFriends(friends: Friend[], userId: number): Promise<boolean>;
	getFriends(userId: number): Promise<
		Array<{
			id: number;
			userId: number;
			friendId: number;
			createdAt: string;
			friend: {
				id: number;
				username: string;
				avatar: string;
			};
		}>
	>;
}

interface Electron {
	ipcRenderer: IpcRenderer;
	db: DB;
}

declare global {
	interface Window {
		electron: Electron;
	}
}

export {};
