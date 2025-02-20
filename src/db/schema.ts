import {Database} from "better-sqlite3";
import {DBMigration} from "./migrations";

// 初始化数据库
export const initSchema = (db: Database) => {
	try {
		// 初始化数据库迁移
		DBMigration.init();

		// 执行迁移
		return DBMigration.migrate();
	} catch (error) {
		console.error("数据库初始化失败:", error);
		throw error;
	}
};
