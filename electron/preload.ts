/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";
// 移除数据库相关类型导入
// import type {Friend} from "../src/types/api";

// 移除数据库操作类型定义
// interface DBOperations { ... }

// 定义 API 类型
interface ElectronAPI {
	platform: string;
	send: (channel: string, data: any) => void;
	on: (channel: string, callback: (...args: any[]) => void) => void;
	removeAllListeners: (channel: string) => void;
	ipcRenderer: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
		on: (channel: string, callback: (...args: any[]) => void) => void;
		off: (channel: string, callback: (...args: any[]) => void) => void;
	};
}

// 声明全局 window 类型
declare global {
	interface Window {
		electron: ElectronAPI;
	}
}

function domReady(condition: DocumentReadyState[] = ["complete", "interactive"]) {
	return new Promise((resolve) => {
		if (condition.includes(document.readyState)) {
			resolve(true);
		} else {
			document.addEventListener("readystatechange", () => {
				if (condition.includes(document.readyState)) {
					resolve(true);
				}
			});
		}
	});
}

const safeDOM = {
	append(parent: HTMLElement, child: HTMLElement) {
		if (!Array.from(parent.children).find((e) => e === child)) {
			return parent.appendChild(child);
		}
	},
	remove(parent: HTMLElement, child: HTMLElement) {
		if (Array.from(parent.children).find((e) => e === child)) {
			return parent.removeChild(child);
		}
	},
};

// API 实现
const api: ElectronAPI = {
	platform: process.platform,
	send: (channel: string, data: any) => {
		ipcRenderer.send(channel, data);
	},
	on: (channel: string, callback: (...args: any[]) => void) => {
		ipcRenderer.on(channel, (_, ...args) => callback(...args));
	},
	removeAllListeners: (channel: string) => {
		ipcRenderer.removeAllListeners(channel);
	},
	ipcRenderer: {
		invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
		on: (channel: string, callback: (...args: any[]) => void) => {
			ipcRenderer.on(channel, (_, ...args) => callback(...args));
		},
		off: (channel: string, callback: (...args: any[]) => void) => {
			ipcRenderer.removeListener(channel, callback as any);
		},
	},
};

// 暴露 API
contextBridge.exposeInMainWorld("electron", api);

window.addEventListener("DOMContentLoaded", () => {
	console.log("Preload script loaded");
});

// 移除导出类型定义
// export type {ElectronAPI};
