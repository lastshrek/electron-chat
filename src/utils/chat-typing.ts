import {Socket} from "socket.io-client";
import {EventEmitter} from "@/utils/event-emitter";
import {WebSocketEvent} from "@/types/ws";
import {wsService, type WebSocketService} from "@/services/ws";
import {eventBus} from "@/utils/eventBus";

interface TypingStatus {
	userId: number;
	chatId: number;
	typing: boolean;
	lastTypingTime?: number;
}

export class ChatTypingManager extends EventEmitter {
	private socket: Socket;
	private typingUsers = new Map<string, TypingStatus>();
	private typingTimeout: number = 3000; // 3秒无输入则视为停止输入
	private debounceTime: number = 300; // 防抖时间
	private typingTimer?: NodeJS.Timeout;
	private wsService: WebSocketService;

	constructor(socket: Socket) {
		super();
		this.socket = socket;
		this.wsService = wsService;
		this.initializeSocketListeners();
	}

	private initializeSocketListeners() {
		eventBus.on("userTyping", ({userId, chatId}) => {
			console.log("收到用户正在输入事件:", {userId, chatId});
			this.setTypingStatus(chatId, userId, true);
		});

		eventBus.on("userStopTyping", ({userId, chatId}) => {
			console.log("收到用户停止输入事件:", {userId, chatId});
			this.setTypingStatus(chatId, userId, false);
		});
	}

	startTyping(chatId: number, userId: number) {
		if (this.typingTimer) {
			clearTimeout(this.typingTimer);
		}

		console.log("发送正在输入状态:", {chatId, userId});
		this.wsService.sendTypingStatus(chatId, userId, true);

		this.typingTimer = setTimeout(() => {
			this.stopTyping(chatId, userId);
		}, this.typingTimeout);
	}

	stopTyping(chatId: number, userId: number) {
		if (this.typingTimer) {
			clearTimeout(this.typingTimer);
		}
		console.log("发送停止输入状态:", {chatId, userId});
		this.wsService.sendTypingStatus(chatId, userId, false);
	}

	private setTypingStatus(chatId: number, userId: number, typing: boolean) {
		const key = `${chatId}-${userId}`;
		this.typingUsers.set(key, {
			userId,
			chatId,
			typing,
			lastTypingTime: typing ? Date.now() : undefined,
		});

		this.emit("typingStatusChanged", {
			chatId,
			userId,
			typing,
		});
	}

	getTypingUsers(chatId: number): number[] {
		const typingUsers: number[] = [];
		this.typingUsers.forEach((status, key) => {
			if (key.startsWith(`${chatId}-`) && status.typing) {
				typingUsers.push(status.userId);
			}
		});
		return typingUsers;
	}

	destroy() {
		eventBus.off("userTyping");
		eventBus.off("userStopTyping");
		this.removeAllListeners();
	}
}
