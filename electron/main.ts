import {app, BrowserWindow, shell, screen, session} from "electron";
import {join} from "path";
import {productName, description, version} from "../package.json";

import installExtension, {VUEJS_DEVTOOLS} from "electron-devtools-installer";

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

function createWindow() {
	const screenSize = screen.getPrimaryDisplay().workAreaSize;

	mainWindow = new BrowserWindow({
		icon: join(__dirname, "../../src/assets/icons/icon.png"),
		title: `${productName} | ${description} - v${version}`,
		minWidth: 1200,
		minHeight: 800,
		width: 1200,
		height: 800,
		x: screenSize.width - 1200 - 50,
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
app.whenReady().then(async () => {
	if (process.env.VITE_DEV_SERVER_URL) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS_DEVTOOLS);
		} catch (e) {
			console.error("Vue Devtools failed to install:", e.toString());
		}
	}

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
