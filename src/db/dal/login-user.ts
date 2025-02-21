import {getDB} from "../index";
import type {LoginUser} from "../entities";

export class LoginUserDAL {
	static tableName = "login_user";

	static create(data: Omit<LoginUser, "id" | "created_at" | "updated_at">) {
		const db = getDB();
		console.log("正在保存登录用户:", data);

		// 确保 user_id 是整数
		const params = {
			...data,
			user_id: Math.floor(data.user_id), // 兼容旧的 server_id
		};

		// 检查用户是否已存在
		const existingUser = this.findByUserId(params.user_id);

		if (existingUser) {
			// 如果用户存在，只在信息有变化时更新
			if (
				existingUser.username !== params.username ||
				existingUser.avatar !== params.avatar
			) {
				console.log("更新现有登录用户信息");
				return this.update(params.user_id, params);
			}
			console.log("登录用户信息未变化，无需更新");
			return existingUser;
		}

		// 如果是新用户，创建记录
		console.log("创建新登录用户记录");
		const stmt = db.prepare(`
			INSERT INTO ${this.tableName} 
			(user_id, username, avatar) 
			VALUES (CAST(@user_id AS INTEGER), @username, @avatar)
			RETURNING *
		`);

		const result = stmt.get(params);
		console.log("新登录用户创建结果:", result);
		return result as LoginUser;
	}

	static getCurrentUser(): LoginUser | undefined {
		const db = getDB();

		// 不需要按时间排序，因为应该只有一条记录
		const stmt = db.prepare(`
			SELECT * FROM ${this.tableName}
			LIMIT 1
		`);

		const result = stmt.get();
		if (result) {
			console.log("当前登录用户查询结果:", result.username);
		}
		return result as LoginUser | undefined;
	}

	static findByUserId(userId: number): LoginUser | undefined {
		const db = getDB();

		// 确保 userId 是整数
		const userIdInt = Math.floor(userId);

		const stmt = db.prepare(`
			SELECT * FROM ${this.tableName} 
			WHERE user_id = CAST(? AS INTEGER)
		`);

		const result = stmt.get(userIdInt);
		return result as LoginUser | undefined;
	}

	static update(
		userId: number,
		data: Partial<Omit<LoginUser, "id" | "created_at" | "updated_at">>
	) {
		const db = getDB();
		console.log("正在更新登录用户:", {userId, data});

		const fields = Object.keys(data)
			.map((key) => `${key} = @${key}`)
			.join(", ");

		// 确保 user_id 是整数
		const params = {
			...data,
			user_id: Math.floor(userId),
		};

		const stmt = db.prepare(`
			UPDATE ${this.tableName}
			SET ${fields}, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = CAST(@user_id AS INTEGER)
			RETURNING *
		`);

		const result = stmt.get(params);
		console.log("登录用户更新结果:", result);
		return result as LoginUser;
	}

	/**
	 * 清除所有登录用户数据
	 */
	static clear() {
		const db = getDB();
		const stmt = db.prepare(`DELETE FROM ${this.tableName}`);
		return stmt.run();
	}

	/**
	 * 清空所有数据库表
	 */
	static clearAll() {
		const db = getDB();
		console.log("开始清空数据库表");

		db.exec("BEGIN TRANSACTION");
		try {
			// 按照外键依赖关系的反序清空表
			db.prepare("DELETE FROM chat_participants").run();
			db.prepare("DELETE FROM friendships").run();
			db.prepare("DELETE FROM contacts").run();
			db.prepare("DELETE FROM chats").run();
			db.prepare(`DELETE FROM ${this.tableName}`).run();

			db.exec("COMMIT");
			console.log("数据库表清空完成");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("清空数据库表失败:", error);
			throw error;
		}
	}

	/**
	 * 迁移 login_user 表结构
	 */
	static migrateTable() {
		const db = getDB();
		console.log("开始迁移 login_user 表结构");

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 检查是否存在旧表
			const tableExists = db
				.prepare(
					`
				SELECT name 
				FROM sqlite_master 
				WHERE type='table' AND name='login_user'
			`
				)
				.get();

			if (!tableExists) {
				// 如果表不存在，直接创建新表
				db.exec(`
					CREATE TABLE login_user (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id INTEGER NOT NULL UNIQUE,
						username TEXT NOT NULL,
						avatar TEXT,
						created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
					)
				`);
			} else {
				// 如果表存在，执行迁移
				// 1. 创建新表
				db.exec(`
					CREATE TABLE login_user_new (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id INTEGER NOT NULL UNIQUE,
						username TEXT NOT NULL,
						avatar TEXT,
						created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
					)
				`);

				// 2. 复制数据
				db.exec(`
					INSERT INTO login_user_new (user_id, username, avatar, created_at, updated_at)
					SELECT server_id, username, avatar, created_at, updated_at
					FROM login_user
				`);

				// 3. 删除旧表
				db.exec("DROP TABLE login_user");

				// 4. 重命名新表
				db.exec("ALTER TABLE login_user_new RENAME TO login_user");
			}

			db.exec("COMMIT");
			console.log("login_user 表结构迁移完成");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("login_user 表结构迁移失败:", error);
			throw error;
		}
	}
}
