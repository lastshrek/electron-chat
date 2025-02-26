// 检测当前运行环境
export const isElectron = (): boolean => {
	return typeof window !== "undefined" && window.electron !== undefined;
};

// 检测是否在 Web 环境中运行
export const isWeb = (): boolean => {
	return !isElectron();
};
