import {app, BrowserWindow, shell, screen, session, ipcMain} from "electron";
import {join} from "path";
import {productName, description, version} from "../package.json";

import installExtension, {VUEJS_DEVTOOLS} from "electron-devtools-installer";
import path from "path";

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

// 添加窗口管理
const meetingWindows = new Map<string, BrowserWindow>();

// 设置 IPC 处理器
const setupIPCHandlers = () => {
	// 保留非数据库相关的 IPC 处理器
	// 移除所有数据库相关的处理器
};

// 修改 createWindow 函数，添加新窗口处理
const createWindow = async () => {
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

	// 处理新窗口打开
	mainWindow.webContents.setWindowOpenHandler(({url}) => {
		// 检查是否是会议URL
		if (url.includes("/meeting/")) {
			const meetingId = url.split("/").pop() || "";

			// 检查会议窗口是否已存在
			if (meetingWindows.has(meetingId)) {
				const existingWindow = meetingWindows.get(meetingId);
				if (existingWindow?.isMinimized()) {
					existingWindow.restore();
				}
				existingWindow?.focus();
				return {action: "deny"};
			}

			// 创建新的会议窗口
			const meetingWindow = new BrowserWindow({
				width: 1280,
				height: 720,
				webPreferences: {
					nodeIntegration: true,
					contextIsolation: true,
					webSecurity: false,
					sandbox: false,
					preload: join(__dirname, "preload.js"),
				},
			});

			// 为会议窗口设置媒体权限
			meetingWindow.webContents.session.setPermissionRequestHandler(
				(webContents, permission, callback) => {
					const allowedPermissions = ["media", "mediaKeySystem"];
					if (allowedPermissions.includes(permission)) {
						callback(true);
					} else {
						callback(false);
					}
				}
			);

			// 设置媒体访问检查
			meetingWindow.webContents.session.setPermissionCheckHandler(
				(webContents, permission) => {
					const allowedPermissions = ["media", "mediaKeySystem"];
					return allowedPermissions.includes(permission);
				}
			);

			// 修改 CSP 配置以允许媒体访问
			meetingWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
				callback({
					responseHeaders: {
						...details.responseHeaders,
						"Content-Security-Policy": [
							"default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ws: wss:;" +
								"connect-src 'self' ws: wss: http: https:;" +
								"img-src 'self' data: https: http:;" +
								"script-src 'self' 'unsafe-inline' 'unsafe-eval';" +
								"style-src 'self' 'unsafe-inline';" +
								"media-src 'self' blob:;" +
								"child-src 'self' blob:;",
						],
					},
				});
			});

			// 加载会议URL
			if (app.isPackaged) {
				meetingWindow.loadURL(`${url}`);
			} else {
				meetingWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/meeting/${meetingId}`);
				// 在开发环境中自动打开开发者工具
				meetingWindow.webContents.openDevTools();
			}

			// 阻止默认行为，使用我们自己的窗口
			return {action: "deny"};
		}

		// 其他URL使用默认行为
		return {action: "allow"};
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
						"style-src 'self' 'unsafe-inline';" +
						"media-src 'self' blob:;" +
						"child-src 'self' blob:;",
				],
			},
		});
	});

	// 处理媒体权限请求
	mainWindow.webContents.session.setPermissionRequestHandler(
		(webContents, permission, callback) => {
			const allowedPermissions = [
				"media",
				"mediaKeySystem",
				"geolocation",
				"notifications",
				"fullscreen",
				"pointerLock",
			];

			if (allowedPermissions.includes(permission)) {
				console.log(`允许权限: ${permission}`);
				callback(true);
			} else {
				console.log(`拒绝权限: ${permission}`);
				callback(false);
			}
		}
	);

	// 处理媒体访问请求
	mainWindow.webContents.session.setPermissionCheckHandler(
		(webContents, permission, requestingOrigin) => {
			const allowedPermissions = [
				"media",
				"mediaKeySystem",
				"geolocation",
				"notifications",
				"fullscreen",
				"pointerLock",
			];

			return allowedPermissions.includes(permission);
		}
	);

	mainWindow.on("ready-to-show", () => {
		mainWindow.show();
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// 创建主窗口
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

// 在应用退出时清理所有会议窗口
app.on("before-quit", () => {
	meetingWindows.forEach((window) => {
		if (!window.isDestroyed()) {
			window.close();
		}
	});
	meetingWindows.clear();
});
