/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:41:38
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-20 18:46:40
 * @FilePath     : /src/utils/eventBus.ts
 * @Description  : eventBus
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:41:38
 */
import mitt from "mitt";

type Events = {
	"friend-request": {
		type: string;
		data: {
			request: {
				id: number;
				fromId: number;
				toId: number;
				status: "PENDING" | "ACCEPTED" | "REJECTED";
				message: string | null;
				createdAt: string;
				from: {
					id: number;
					username: string;
					name: string | null;
					avatar: string;
				};
				to: {
					id: number;
					username: string;
					name: string | null;
					avatar: string;
				};
			};
		};
		timestamp: string;
	};
	"clear-friend-request-count": void;
	"unread-count-updated": number;
	friendsSynced: void;
};

export const eventBus = mitt<Events>();
