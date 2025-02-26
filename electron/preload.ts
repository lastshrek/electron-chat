/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

import {contextBridge, ipcRenderer} from "electron";
// 移除数据库相关类型导入
// import type {Friend} from "../src/types/api";

// 移除数据库操作类型定义
// interface DBOperations { ... }

// 定义 API 类型
export interface ElectronAPI {
	platform: string;
	send: (channel: string, data: any) => void;
	on: (channel: string, callback: Function) => void;
	removeAllListeners: (channel: string) => void;
	// 移除 db 属性
	ipcRenderer: {
		invoke: (channel: string, ...args: any[]) => void;
		on: (channel: string, callback: Function) => void;
		off: (channel: string, callback: Function) => void;
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

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
	const className = `loaders-css__square-spin`;
	const styleContent = `
  @keyframes square-spin {
    25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
    50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
    75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
    100% { transform: perspective(100px) rotateX(0) rotateY(0); }
  }
  .${className} > div {
    animation-fill-mode: both;
    width: 50px;
    height: 50px;
    background: #fff;
    animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
  }
  .app-loading-wrap {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #282c34;
    z-index: 9;
  }
      `;
	const oStyle = document.createElement("style");
	const oDiv = document.createElement("div");

	oStyle.id = "app-loading-style";
	oStyle.innerHTML = styleContent;
	oDiv.className = "app-loading-wrap";
	oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

	return {
		appendLoading() {
			safeDOM.append(document.head, oStyle);
			safeDOM.append(document.body, oDiv);
		},
		removeLoading() {
			safeDOM.remove(document.head, oStyle);
			safeDOM.remove(document.body, oDiv);
		},
	};
}

// API 实现
const api: ElectronAPI = {
	platform: process.platform,
	send: (channel: string, data: any) => {
		ipcRenderer.send(channel, data);
	},
	on: (channel: string, callback: Function) => {
		ipcRenderer.on(channel, (_, ...args) => callback(...args));
	},
	removeAllListeners: (channel: string) => {
		ipcRenderer.removeAllListeners(channel);
	},
	ipcRenderer: {
		invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
		on: (channel: string, callback: Function) => {
			ipcRenderer.on(channel, (_, ...args) => callback(...args));
		},
		off: (channel: string, callback: Function) => {
			ipcRenderer.removeListener(channel, callback);
		},
	},
};

// 暴露 API
contextBridge.exposeInMainWorld("electron", api);

window.addEventListener("DOMContentLoaded", () => {
	console.log("Preload script loaded");
});

// 导出类型定义
export type {ElectronAPI};
