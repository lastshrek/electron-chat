// 使用 require 导入 better-sqlite3
const Database = require("better-sqlite3");
import path from "path";
import {app} from "electron";

// 定义数据库接口
export interface IDatabase {
	exec: (sql: string) => void;
	prepare: (sql: string) => any;
}

// 声明全局数据库实例
let db: IDatabase | null = null;

// 导出获取数据库实例的方法
export const getDB = () => {
	if (!db) {
		throw new Error("数据库未初始化");
	}
	return db;
};

// 设置数据库实例的方法
export const setDB = (database: IDatabase) => {
	db = database;
};

const initDatabase = () => {
	try {
		// 获取应用数据目录
		const appDataPath = app.getPath("userData");
		console.log("应用数据目录:", appDataPath);

		// 数据库文件路径
		const dbPath = path.join(appDataPath, "chat.db");
		console.log("数据库文件路径:", dbPath);

		// 创建数据库连接
		console.log("正在创建数据库连接...");
		const db = new Database(dbPath, {
			verbose: (message: string) => {
				console.log("SQLite操作:", message);
			},
		});

		// 测试数据库连接
		const result = db.prepare("SELECT sqlite_version()").get();
		console.log("数据库连接成功! SQLite版本:", result["sqlite_version()"]);

		// 启用外键约束
		db.pragma("foreign_keys = ON");
		console.log("外键约束已启用");

		return db;
	} catch (error) {
		console.error("数据库初始化失败:", error);
		throw error;
	}
};

// 根据进程类型初始化数据库
if (process.type === "browser") {
	console.log("在主进程中初始化数据库...");
	db = initDatabase();
} else {
	console.log("不在主进程中，跳过数据库初始化");
}

export {db};
