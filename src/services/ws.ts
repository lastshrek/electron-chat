import {useUserStore} from "@/stores/user";
import {toast} from "@/components/ui/toast";
import {io, Socket} from "socket.io-client";
import {
	WebSocketEvent,
	type FriendRequestData,
	type FriendStatusData,
	type ChatMessageData,
	type MessageDeliveredResponse,
	type MessageErrorResponse,
	type MessageSentResponse,
	type TypingEventData,
} from "@/types/ws";
import {eventBus} from "@/utils/eventBus";
import {useChatStore} from "@/stores/chat";
import router from "@/router"; // 直接导入 router 实例
import {useMessageStore} from "@/stores/message";

const WS_URL = import.meta.env.VITE_WS_URL;

export class WebSocketService {
	public socket: Socket | null = null;
	private initialized = false;

	constructor() {
		// 不在构造函数中初始化
	}

	public init() {
		if (this.initialized) return;
		this.initialized = true;
		this.initSocket();
	}

	private initSocket() {
		const userStore = useUserStore();
		const token = userStore.token;

		if (!token) {
			console.error("No token available");
			return;
		}

		try {
			this.socket = io(WS_URL, {
				auth: {
					token: `Bearer ${token}`,
				},
				transports: ["websocket"],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 3000,
			});

			this.setupEventListeners();
		} catch (error) {
			console.error("Socket.IO initialization failed:", error);
			toast({
				variant: "destructive",
				title: "连接失败",
				description: "无法建立通信连接",
			});
		}
	}

	private setupEventListeners() {
		if (!this.socket) return;

		// 连接相关事件
		this.socket.on(WebSocketEvent.CONNECT, () => {
			console.log("Socket.IO connected");
			toast({
				title: "连接成功",
				description: "已建立实时通信连接",
			});
		});

		this.socket.on(WebSocketEvent.CONNECT_ERROR, (error) => {
			console.error("Connection error:", error);
			toast({
				variant: "destructive",
				title: "连接错误",
				description: "通信连接发生错误",
			});
		});

		this.socket.on(WebSocketEvent.DISCONNECT, (reason) => {
			console.log("Socket.IO disconnected:", reason);
			if (reason === "io server disconnect") {
				this.socket?.connect();
			}
		});

		// 好友相关事件
		this.socket.on(WebSocketEvent.FRIEND_REQUEST, (data: FriendRequestData) => {
			console.log("New friend request:", data);
			// 发送通知
			toast({
				title: "新的好友请求",
				description: `${data.data.request.from.username} 请求添加您为好友`,
			});
			// 通过事件总线广播消息
			eventBus.emit("friend-request", data);
		});

		this.socket.on(WebSocketEvent.FRIEND_REQUEST_ACCEPTED, (data: FriendRequestData) => {
			console.log("Friend request accepted:", data);
			this.handleFriendRequestAccepted(data);
		});

		this.socket.on(WebSocketEvent.FRIEND_REQUEST_REJECTED, (data: FriendRequestData) => {
			console.log("Friend request rejected:", data);
			this.handleFriendRequestRejected(data);
		});

		this.socket.on(WebSocketEvent.FRIEND_ONLINE, (data: FriendStatusData) => {
			console.log("Friend online:", data);
			// TODO: 更新好友状态
		});

		this.socket.on(WebSocketEvent.FRIEND_OFFLINE, (data: FriendStatusData) => {
			console.log("Friend offline:", data);
			// TODO: 更新好友状态
		});

		// 收到新的聊天消息
		this.socket.on(WebSocketEvent.NEW_MESSAGE, (response: ChatMessageData) => {
			console.log("Chat message:", response);
			const messageStore = useMessageStore();
			const chatStore = useChatStore();
			const userStore = useUserStore();
			const {data} = response;

			// 保存消息
			messageStore.addMessage({
				id: data.id,
				content: data.content,
				type: data.type,
				status: data.status,
				senderId: data.senderId,
				receiverId: data.receiverId,
				chatId: data.chatId,
				timestamp: data.createdAt,
				metadata: data.metadata,
				sender: data.sender,
				receiver: data.receiver,
			});

			// 更新聊天列表的最后一条消息
			chatStore.updateLastMessage(data.chatId, {
				id: data.id,
				content: data.content,
				type: data.type,
				status: data.status,
				timestamp: data.createdAt,
				sender: data.sender,
				receiver: data.receiver,
			});

			// 如果是自己发送的消息，不需要处理未读数和通知
			if (data.senderId === userStore.userInfo?.id) {
				return;
			}

			// 获取当前选中的聊天ID
			const currentChatId = router.currentRoute.value.query.chatId;

			// 判断是否在当前聊天中
			const isInCurrentChat =
				document.visibilityState === "visible" && // 页面可见
				router.currentRoute.value.name === "chat" && // 在聊天页面
				router.currentRoute.value.params.chatId === data.chatId.toString(); // 在同一个聊天中

			// 只有不在当前聊天时才增加未读数和显示通知
			if (!isInCurrentChat) {
				chatStore.incrementUnread(data.chatId);

				toast({
					title: data.sender.username,
					description: data.content,
				});
			}
		});

		// 通知消息
		this.socket.on(WebSocketEvent.NOTIFICATION, (data: {title: string; message: string}) => {
			toast({
				title: data.title,
				description: data.message,
			});
		});

		// 消息发送成功事件
		this.socket.on(WebSocketEvent.MESSAGE_SENT, (response: MessageSentResponse) => {
			console.log("消息发送成功:", response);
			const messageStore = useMessageStore();
			const chatStore = useChatStore();
			const {data} = response;

			// 更新消息状态
			messageStore.updateMessageStatus(data.tempId, "SENT");

			// 更新消息ID和其他信息
			messageStore.updateMessage(data.tempId, {
				id: data.message.id,
				status: data.message.status.toUpperCase(),
				timestamp: data.message.createdAt,
			});

			// 更新聊天列表的最后一条消息
			chatStore.updateLastMessage(data.message.chatId, {
				id: data.message.id,
				content: data.message.content,
				type: data.message.type,
				status: data.message.status,
				timestamp: data.message.createdAt,
				sender: data.message.sender,
				receiver: data.message.receiver,
			});
		});

		// 消息送达事件
		this.socket.on(WebSocketEvent.MESSAGE_DELIVERED, (data: MessageDeliveredResponse) => {
			console.log("消息已送达:", data);
			const messageStore = useMessageStore();

			// 如果有临时ID，先用临时ID更新状态
			if (data.tempId) {
				messageStore.updateMessageStatus(data.tempId, "DELIVERED");
			}

			// 然后用真实ID更新状态
			messageStore.updateMessageStatus(data.messageId, "DELIVERED");

			// 更新消息ID（从临时ID到真实ID）
			if (data.tempId) {
				messageStore.updateMessageId(data.tempId, data.messageId);
			}
		});

		// 消息错误事件
		this.socket.on(WebSocketEvent.MESSAGE_ERROR, (data: MessageErrorResponse) => {
			console.error("消息发送失败:", data);
			const messageStore = useMessageStore();

			// 更新消息状态为失败
			messageStore.updateMessageStatus(data.tempId, "FAILED");

			// 显示错误提示
			toast({
				variant: "destructive",
				title: "发送失败",
				description: data.error || "请稍后重试",
			});
		});

		// 用户输入状态事件
		this.socket.on(WebSocketEvent.TYPING, (data: TypingEventData) => {
			console.log("收到用户正在输入事件:", data);
			// 直接广播给其他组件，不要再发回服务器
			eventBus.emit("userTyping", data.data);
		});

		this.socket.on(WebSocketEvent.STOP_TYPING, (data: TypingEventData) => {
			console.log("收到用户停止输入事件:", data);
			// 直接广播给其他组件，不要再发回服务器
			eventBus.emit("userStopTyping", data.data);
		});

		// 其他用户输入事件
		this.socket.on(WebSocketEvent.USER_TYPING, (data: TypingEventData) => {
			console.log("收到其他用户正在输入事件:", data);
			// 直接广播给其他组件，不要再发回服务器
			eventBus.emit("userTyping", data.data);
		});

		this.socket.on(WebSocketEvent.USER_STOP_TYPING, (data: TypingEventData) => {
			console.log("收到其他用户停止输入事件:", data);
			// 直接广播给其他组件，不要再发回服务器
			eventBus.emit("userStopTyping", data.data);
		});

		// 监听加入聊天室成功
		this.socket.on(WebSocketEvent.JOINED_CHAT, (response) => {
			console.log("成功加入聊天室:", response);
		});
	}

	private handleFriendRequestAccepted(data: FriendRequestData) {
		const chatStore = useChatStore();

		// 保存聊天信息
		if (data.data.chat) {
			chatStore.upsertChat(data.data.chat);
		}

		// 如果不在首页，增加未读数
		if (router.currentRoute.value.name !== "home") {
			chatStore.incrementUnread(data.data.chat?.id!);
		}

		// 通知用户
		toast({
			title: "好友请求已接受",
			description: `${data.data.request.from.username} 接受了您的好友请求`,
		});

		// 触发事件通知其他组件更新
		eventBus.emit("friend-request-accepted", data.data);
	}

	private handleFriendRequestRejected(data: FriendRequestData) {
		toast({
			title: "好友请求被拒绝",
			description: `${data.data.request.to.username} 拒绝了您的好友请求`,
		});
	}

	public send(data: any) {
		if (!this.socket?.connected) {
			console.error("Socket.IO is not connected");
			return;
		}

		// 根据消息类型发送到不同的事件
		switch (data.type) {
			case "chat":
				this.socket.emit(WebSocketEvent.CHAT_MESSAGE, data.data);
				break;
			default:
				console.warn("Unknown message type:", data.type);
		}
	}

	public disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
		this.initialized = false;
	}

	// 发送输入状态
	public sendTypingStatus(chatId: number, userId: number, isTyping: boolean) {
		if (!this.socket?.connected) {
			console.error("Socket.IO is not connected");
			return;
		}

		console.log(`发送${isTyping ? "正在输入" : "停止输入"}状态:`, {chatId, userId});
		const event = isTyping ? WebSocketEvent.TYPING : WebSocketEvent.STOP_TYPING;
		this.socket.emit(event, {chatId, userId});
	}

	public joinChat(chatId: number) {
		if (!this.socket?.connected) {
			console.error("Socket.IO is not connected");
			return;
		}
		console.log("加入聊天室:", chatId);
		this.socket.emit(WebSocketEvent.JOIN_CHAT, chatId);
	}

	public leaveChat(chatId: number) {
		if (!this.socket?.connected) {
			console.error("Socket.IO is not connected");
			return;
		}
		console.log("离开聊天室:", chatId);
		this.socket.emit(WebSocketEvent.LEAVE_CHAT, chatId);
	}
}

// 创建单例
export const wsService = new WebSocketService();
