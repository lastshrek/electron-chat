// 数据库接口
export interface DB {
	getCurrentUser: () => Promise<any>;
	syncFriends: (friends: any[], userId: number) => Promise<void>;
	// 其他数据库方法
}

// 扩展 Window 接口
declare global {}

// 确保这个文件被视为模块
export {};
