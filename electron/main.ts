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

			// 先检查用户是否已存在
			const existingUser = LoginUserDAL.findByServerId(params.server_id);

			let result;
			if (existingUser) {
				console.log("找到现有用户:", existingUser);
				// 检查是否需要更新
				if (
					existingUser.username !== params.username ||
					existingUser.avatar !== params.avatar
				) {
					console.log("用户信息有变化，进行更新");
					result = LoginUserDAL.update(params.server_id, {
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
					server_id: params.server_id,
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
	ipcMain.handle("db:syncFriends", async (event, friends) => {
		try {
			console.log("正在同步好友列表, 数量:", friends.length);
			return await FriendshipsDAL.syncFriendships(friends[0].userId, friends);
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

	// 获取联系人信息
	ipcMain.handle("db:getUserById", async (event, id) => {
		try {
			// 先从 login_user 表查找
			let stmt = db!.prepare(`
				SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
				FROM login_user WHERE server_id = ?
			`);
			let user = stmt.get(id);

			// 如果不是登录用户，则从 contacts 表查找
			if (!user) {
				stmt = db!.prepare(`
					SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
					FROM contacts WHERE server_id = ?
				`);
				user = stmt.get(id);
			}

			return user;
		} catch (error) {
			console.error("获取用户信息失败:", error);
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
