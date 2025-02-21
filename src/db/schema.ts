import {Database} from "better-sqlite3";
import {DatabaseMigrations} from "./migrations";

// 初始化数据库
export const initSchema = (db: Database) => {
	try {
		// 创建 login_user 表
		db.exec(`
			CREATE TABLE IF NOT EXISTS login_user (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL UNIQUE,
				username TEXT NOT NULL,
				avatar TEXT,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// 创建 contacts 表
		db.exec(`
			CREATE TABLE IF NOT EXISTS contacts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL UNIQUE,
				username TEXT NOT NULL,
				avatar TEXT,
				chat_id INTEGER,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
			)
		`);

		// 创建 chats 表
		db.exec(`
			CREATE TABLE IF NOT EXISTS chats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				chat_id INTEGER NOT NULL UNIQUE,
				type TEXT NOT NULL,
				name TEXT,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
			)
		`);

		// 创建 friendships 表（使用新的外键约束）
		db.exec(`
			CREATE TABLE IF NOT EXISTS friendships (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				friend_id INTEGER NOT NULL,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES login_user(user_id),
				FOREIGN KEY (friend_id) REFERENCES contacts(user_id),
				UNIQUE(user_id, friend_id)
			)
		`);

		// 创建 chat_participants 表
		db.exec(`
			CREATE TABLE IF NOT EXISTS chat_participants (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				chat_id INTEGER NOT NULL,
				user_id INTEGER NOT NULL,
				role TEXT NOT NULL DEFAULT 'MEMBER',
				FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
				FOREIGN KEY (user_id) REFERENCES contacts(user_id)
			)
		`);

		// 执行迁移
		return DatabaseMigrations.migrate();
	} catch (error) {
		console.error("数据库初始化失败:", error);
		throw error;
	}
};
