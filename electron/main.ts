import {app, BrowserWindow, shell, screen, session, ipcMain} from "electron";
import {join} from "path";
import {productName, description, version} from "../package.json";

import installExtension, {VUEJS_DEVTOOLS} from "electron-devtools-installer";
import Database from "better-sqlite3";
import path from "path";
import {initSchema} from "../src/db/schema";
import {getDB} from "../src/db";
import {LoginUserDAL} from "../src/db/dal/login-user";
import {ContactsDAL} from "../src/db/dal/contacts";
import {FriendshipsDAL} from "../src/db/dal/friendships";
import {DatabaseMigrations} from "../src/db/migrations";

/**
 * ** The built directory structure
 * ------------------------------------
 * ├─┬ build/electron
 * │ └── main.js        > Electron-Main
 * │ └── preload.js     > Preload-Scripts
 * ├─┬ build/app
 *   └── index.html     > Electron-Renderer
 */

process.env.BUILD_APP = join(__dirname, "../app");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
	? join(__dirname, "../../public")
	: process.env.BUILD_APP;

let mainWindow: BrowserWindow | null = null;

// 全局数据库实例
let db: Database.Database | null = null;

// 初始化数据库
const initDatabase = () => {
	try {
		const appDataPath = app.getPath("userData");
		const dbPath = path.join(appDataPath, "chat.db");
		console.log("数据库路径:", dbPath);

		db = new Database(dbPath, {
			verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
		});

		// 先执行迁移
		DatabaseMigrations.migrate();

		// 然后初始化其他表结构
		initSchema(db);

		console.log("数据库初始化成功");
		return true;
	} catch (error) {
		console.error("数据库初始化失败:", error);
		return false;
	}
};

// 设置 IPC 处理器
const setupIPCHandlers = () => {
	// 创建或更新登录用户
	ipcMain.handle("db:createLoginUser", async (event, params) => {
		try {
			console.log("正在创建/更新登录用户:", params);

			if (!params.user_id) {
				throw new Error("用户ID不能为空");
			}

			// 先检查用户是否已存在
			const existingUser = LoginUserDAL.findByUserId(params.user_id);

			let result;
			if (existingUser) {
				console.log("找到现有用户:", existingUser);
				// 检查是否需要更新
				if (
					existingUser.username !== params.username ||
					existingUser.avatar !== params.avatar
				) {
					console.log("用户信息有变化，进行更新");
					result = LoginUserDAL.update(params.user_id, {
						username: params.username,
						avatar: params.avatar,
					});
				} else {
					console.log("用户信息未变化，无需更新");
					result = existingUser;
				}
			} else {
				console.log("未找到现有用户，创建新用户");
				result = LoginUserDAL.create({
					user_id: params.user_id,
					username: params.username,
					avatar: params.avatar,
				});
			}

			console.log("操作结果:", result);
			return result;
		} catch (error) {
			console.error("创建/更新登录用户失败:", error);
			throw error;
		}
	});

	// 同步好友列表
	ipcMain.handle("db:syncFriends", async (event, friends, userId) => {
		try {
			console.log("正在同步好友列表, 数量:", friends.length);
			return await FriendshipsDAL.syncFriendships(userId, friends);
		} catch (error) {
			console.error("同步好友列表失败:", error);
			throw error;
		}
	});

	// 获取好友列表
	ipcMain.handle("db:getFriends", async (event, userId) => {
		try {
			const friends = FriendshipsDAL.findByUserId(userId);
			console.log("获取好友列表成功:", friends);
			return friends;
		} catch (error) {
			console.error("获取好友列表失败:", error);
			throw error;
		}
	});

	// 获取当前登录用户
	ipcMain.handle("db:getCurrentUser", async () => {
		try {
			return LoginUserDAL.getCurrentUser();
		} catch (error) {
			console.error("获取当前登录用户失败:", error);
			throw error;
		}
	});

	// 清除登录用户
	ipcMain.handle("db:clearLoginUser", async () => {
		try {
			LoginUserDAL.clear();
			return true;
		} catch (error) {
			console.error("清除登录用户失败:", error);
			throw error;
		}
	});

	// 获取用户信息
	ipcMain.handle("db:getUserById", async (event, id) => {
		try {
			const stmt = db!.prepare(`
				SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
				FROM users WHERE id = ?
			`);
			return stmt.get(id);
		} catch (error) {
			console.error("获取用户失败:", error);
			throw error;
		}
	});

	// 获取聊天列表
	ipcMain.handle("db:getChats", async () => {
		try {
			const db = getDB();

			// 获取当前用户
			const currentUser = LoginUserDAL.getCurrentUser();
			if (!currentUser) {
				throw new Error("未找到当前登录用户");
			}
			console.log("当前用户:", currentUser);

			// 1. 获取所有聊天
			const chatsStmt = db.prepare(`
				SELECT DISTINCT
					c.chat_id,
					c.type,
					CASE 
						WHEN c.type = 'GROUP' THEN c.name
						ELSE NULL
					END as name,
					c.created_at,
					c.updated_at
				FROM chats c
				JOIN chat_participants cp ON c.chat_id = cp.chat_id
				WHERE cp.user_id = ?
			`);

			// 先打印 SQL 参数
			console.log("查询聊天列表SQL参数:", currentUser.user_id);

			const chats = chatsStmt.all(currentUser.user_id);
			console.log("查询到的聊天原始数据:", chats);

			// 2. 为每个聊天获取参与者
			const participantsStmt = db.prepare(`
				SELECT 
					cp.user_id,
					co.username,
					co.avatar,
					cp.role
				FROM chat_participants cp
				JOIN contacts co ON cp.user_id = co.user_id
				WHERE cp.chat_id = ? AND cp.user_id != ?
			`);

			// 3. 组合数据并打印每个聊天的参与者
			const result = chats.map((chat) => {
				const participants = participantsStmt.all(chat.chat_id, currentUser.user_id);
				console.log(`聊天 ${chat.chat_id} 的参与者:`, participants);
				return {
					...chat,
					participants,
				};
			});

			// 打印最终结果
			console.log("最终的聊天列表数据:", JSON.stringify(result, null, 2));
			return result;
		} catch (error) {
			console.error("获取聊天列表失败:", error);
			throw error;
		}
	});

	// 添加或更新聊天
	ipcMain.handle("db:upsertChat", async (event, chat, currentUserId) => {
		const db = getDB();
		console.log("开始保存聊天:", chat, "当前用户:", currentUserId);

		db.exec("BEGIN TRANSACTION");
		try {
			// 插入或更新聊天
			const chatStmt = db.prepare(`
				INSERT OR REPLACE INTO chats 
				(chat_id, type, name) 
				VALUES (?, ?, ?)
			`);
			chatStmt.run(chat.chat_id, chat.type, chat.name);

			// 对于单聊，确保双方都被添加为参与者
			if (chat.type === "DIRECT") {
				// 先删除现有的参与者记录，避免重复
				const deleteStmt = db.prepare(`
					DELETE FROM chat_participants 
					WHERE chat_id = ?
				`);
				deleteStmt.run(chat.chat_id);

				// 添加参与者
				const participantStmt = db.prepare(`
					INSERT INTO chat_participants 
					(chat_id, user_id, role) 
					VALUES (?, ?, 'MEMBER')
				`);

				// 添加当前用户为参与者
				participantStmt.run(chat.chat_id, currentUserId);

				// 添加对方为参与者（对于单聊，chat_id 就是对方的 user_id）
				participantStmt.run(chat.chat_id, chat.chat_id);

				console.log("已添加聊天参与者:", {
					chatId: chat.chat_id,
					currentUserId,
					otherUserId: chat.chat_id,
				});
			} else {
				// 群聊的处理逻辑...
				for (const participant of chat.participants) {
					const participantStmt = db.prepare(`
						INSERT OR REPLACE INTO chat_participants 
						(chat_id, user_id, role) 
						VALUES (?, ?, ?)
					`);
					participantStmt.run(
						chat.chat_id,
						participant.user_id,
						participant.role || "MEMBER"
					);
				}
			}

			db.exec("COMMIT");
			return true;
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("保存聊天失败:", error);
			throw error;
		}
	});

	// 获取聊天参与者
	ipcMain.handle("db:getChatParticipants", async (event, chatId) => {
		try {
			const db = getDB();
			console.log("开始查询聊天参与者, chatId:", chatId);

			// 获取当前用户
			const currentUser = LoginUserDAL.getCurrentUser();
			if (!currentUser) {
				throw new Error("未找到当前登录用户");
			}

			// 先查询聊天信息
			const chatStmt = db.prepare(`
				SELECT * FROM chats WHERE chat_id = ?
			`);
			const chat = chatStmt.get(chatId);
			console.log("聊天信息:", chat);

			if (!chat) {
				throw new Error("聊天不存在");
			}

			// 查询参与者（排除当前用户）
			const participantsStmt = db.prepare(`
				SELECT 
					c.*,
					cp.role,
					f.id as friendship_id,
					f.created_at as friend_since
				FROM chat_participants cp
				JOIN contacts c ON cp.user_id = c.user_id
				LEFT JOIN friendships f ON (
					(f.user_id = ? AND f.friend_id = c.user_id) OR 
					(f.friend_id = ? AND f.user_id = c.user_id)
				)
				WHERE cp.chat_id = ? AND cp.user_id != ?
			`);

			const results = participantsStmt.all(
				currentUser.user_id,
				currentUser.user_id,
				chatId,
				currentUser.user_id
			);

			console.log("聊天参与者查询结果:", results);
			return results;
		} catch (error) {
			console.error("获取聊天参与者失败:", error);
			throw error;
		}
	});
};

function createWindow() {
	const screenSize = screen.getPrimaryDisplay().workAreaSize;

	mainWindow = new BrowserWindow({
		icon: join(__dirname, "../../src/assets/icons/icon.png"),
		title: `${productName} | ${description} - v${version}`,
		minWidth: 1200,
		minHeight: 800,
		width: 1200,
		height: 800,
		x: 50,
		y: 50,
		resizable: true,
		maximizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			webSecurity: false,
			sandbox: false,
			preload: join(__dirname, "preload.js"),
			webviewTag: true,
		},
	});

	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(join(process.env.BUILD_APP, "index.html"));
	}

	// Make all links open with the browser, not with the application
	mainWindow.webContents.setWindowOpenHandler(({url}) => {
		if (url.startsWith("https:")) shell.openExternal(url);
		return {action: "deny"};
	});

	// 修改 CSP 配置
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [
					"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ws: wss:;" +
						"connect-src 'self' ws: wss: http: https:;" +
						"img-src 'self' data: https: http:;" +
						"script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
						"style-src 'self' 'unsafe-inline';",
				],
			},
		});
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// 初始化数据库
	if (!initDatabase()) {
		app.quit();
		return;
	}

	// 设置 IPC 处理器
	setupIPCHandlers();

	createWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		const allWindows = BrowserWindow.getAllWindows();
		allWindows.length === 0 ? createWindow() : allWindows[0].focus();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	mainWindow = null;
	if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// 添加错误处理
app.on("render-process-gone", (event, webContents, details) => {
	console.error("Renderer process gone:", details);
});

app.on("child-process-gone", (event, details) => {
	console.error("Child process gone:", details);
});
