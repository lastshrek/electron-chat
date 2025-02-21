import {getDB} from "../index";
import type {Contact} from "../entities";

export class ContactsDAL {
	static tableName = "contacts";

	static create(data: Omit<Contact, "id" | "created_at" | "updated_at">) {
		const db = getDB();
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO ${this.tableName} 
            (user_id, username, avatar) 
            VALUES (@user_id, @username, @avatar)
            RETURNING *
        `);
		return stmt.get(data) as Contact;
	}

	static findByUserId(userId: number) {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT * FROM ${this.tableName} 
            WHERE user_id = ?
        `);
		return stmt.get(userId) as Contact | undefined;
	}

	static findAll() {
		const db = getDB();
		const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
		return stmt.all() as Contact[];
	}

	/**
	 * 迁移 contacts 表结构
	 */
	static migrateTable() {
		const db = getDB();
		console.log("开始迁移 contacts 表结构");

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 检查是否存在旧表
			const tableExists = db
				.prepare(
					`
					SELECT name 
					FROM sqlite_master 
					WHERE type='table' AND name='contacts'
				`
				)
				.get();

			if (!tableExists) {
				// 如果表不存在，直接创建新表
				db.exec(`
					CREATE TABLE contacts (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id INTEGER NOT NULL UNIQUE,
						username TEXT NOT NULL,
						avatar TEXT,
						chat_id INTEGER,
						created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						FOREIGN KEY (chat_id) REFERENCES chats(server_id)
					)
				`);
			} else {
				// 如果表存在，执行迁移
				// 1. 创建新表
				db.exec(`
					CREATE TABLE contacts_new (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						user_id INTEGER NOT NULL UNIQUE,
						username TEXT NOT NULL,
						avatar TEXT,
						chat_id INTEGER,
						created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
						FOREIGN KEY (chat_id) REFERENCES chats(server_id)
					)
				`);

				// 2. 复制数据
				db.exec(`
					INSERT INTO contacts_new (user_id, username, avatar, chat_id, created_at, updated_at)
					SELECT server_id, username, avatar, chat_id, created_at, updated_at
					FROM contacts
				`);

				// 3. 删除旧表
				db.exec("DROP TABLE contacts");

				// 4. 重命名新表
				db.exec("ALTER TABLE contacts_new RENAME TO contacts");
			}

			db.exec("COMMIT");
			console.log("contacts 表结构迁移完成");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("contacts 表结构迁移失败:", error);
			throw error;
		}
	}
}
