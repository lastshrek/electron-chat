import {isElectron} from "./environment";

// 创建一个空的模拟实现
const mockElectronApi = {
	platform: "web",
	send: () => {},
	on: () => {},
	removeAllListeners: () => {},
	ipcRenderer: {
		invoke: async () => null,
		on: () => {},
		off: () => {},
	},
};

// // 获取 Electron API 或其模拟实现
// export const getElectronApi = () => {
// 	if (isElectron()) {
// 		return window.electron;
// 	}
// 	return mockElectronApi;
// };
