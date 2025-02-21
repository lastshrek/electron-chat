interface DBOperations {
	getChats: () => Promise<
		Array<{
			chat_id: number;
			type: "DIRECT" | "GROUP";
			name: string | null;
			participant_ids: string;
			participant_names: string;
			participant_avatars: string;
		}>
	>;
	upsertChat: (
		chat: {
			chat_id: number;
			type: "DIRECT" | "GROUP";
			name: string | null;
			participants: Array<{
				user_id: number;
				username: string;
				avatar: string;
			}>;
		},
		currentUserId: number
	) => Promise<boolean>;
	getChatParticipants: (chatId: number) => Promise<
		Array<{
			chat_id: number;
			user_id: number;
			role: string;
			username: string;
			avatar: string;
			friendship_id: number | null;
			friend_since: string | null;
		}>
	>;
}

interface ElectronAPI {
	platform: string;
	send: (channel: string, data: any) => void;
	on: (channel: string, callback: Function) => void;
	removeAllListeners: (channel: string) => void;
	db: DBOperations;
}

interface Window {
	electron: {
		ipcRenderer: {
			invoke(channel: string, ...args: any[]): Promise<any>;
			on(channel: string, func: (...args: any[]) => void): void;
			once(channel: string, func: (...args: any[]) => void): void;
		};
	};
}
