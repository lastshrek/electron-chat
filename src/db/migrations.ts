import {getDB} from "./index";

export class DBMigration {
	/**
	 * 执行所有迁移
	 */
	static async migrate() {
		const db = getDB();
		console.log("开始执行数据库迁移");

		try {
			// 迁移 contacts 表
			await this.migrateContacts();
			// 迁移 chats 表
			await this.migrateChats();
			// 迁移 friendships 表
			await this.migrateFriendships();

			console.log("数据库迁移完成");
		} catch (error) {
			console.error("数据库迁移失败:", error);
			throw error;
		}
	}

	/**
	 * 迁移 chats 表：server_id -> chat_id
	 */
	private static async migrateChats() {
		const db = getDB();
		console.log("开始迁移 chats 表");

		// 检查是否需要迁移
		const hasServerIdColumn = db
			.prepare(
				`
                SELECT 1 
                FROM pragma_table_info('chats') 
                WHERE name='server_id'
            `
			)
			.get();

		if (!hasServerIdColumn) {
			console.log("chats 表已经是最新结构");
			return;
		}

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 创建新的 chats 表
			db.exec(`
                CREATE TABLE chats_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL UNIQUE,
                    type TEXT NOT NULL,
                    name TEXT,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);

			// 2. 复制 chats 数据
			db.exec(`
                INSERT INTO chats_new (
                    id, chat_id, type, name
                )
                SELECT 
                    id, server_id, type, name
                FROM chats
            `);

			// 3. 创建新的 chat_participants 表
			db.exec(`
                CREATE TABLE chat_participants_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role TEXT NOT NULL DEFAULT 'MEMBER',
                    FOREIGN KEY (chat_id) REFERENCES chats_new(chat_id),
                    FOREIGN KEY (user_id) REFERENCES contacts(user_id)
                )
            `);

			// 4. 复制 chat_participants 数据
			db.exec(`
                INSERT INTO chat_participants_new (
                    id, chat_id, user_id, role
                )
                SELECT 
                    id, chat_id, user_id, role
                FROM chat_participants
            `);

			// 5. 创建新的 contacts 表
			db.exec(`
                CREATE TABLE contacts_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    username TEXT NOT NULL,
                    avatar TEXT,
                    chat_id INTEGER,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats_new(chat_id)
                )
            `);

			// 6. 复制 contacts 数据
			db.exec(`
                INSERT INTO contacts_new
                SELECT * FROM contacts
            `);

			// 7. 删除旧表
			db.exec("DROP TABLE chat_participants");
			db.exec("DROP TABLE contacts");
			db.exec("DROP TABLE chats");

			// 8. 重命名新表
			db.exec("ALTER TABLE chats_new RENAME TO chats");
			db.exec("ALTER TABLE chat_participants_new RENAME TO chat_participants");
			db.exec("ALTER TABLE contacts_new RENAME TO contacts");

			db.exec("COMMIT");
			console.log("chats 表迁移完成");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("chats 表迁移失败:", error);
			throw error;
		}
	}

	/**
	 * 迁移 contacts 表：server_id -> user_id
	 */
	private static async migrateContacts() {
		const db = getDB();
		console.log("开始迁移 contacts 表");

		// 检查是否需要迁移
		const hasServerIdColumn = db
			.prepare(
				`
                SELECT 1 
                FROM pragma_table_info('contacts') 
                WHERE name='server_id'
            `
			)
			.get();

		if (!hasServerIdColumn) {
			console.log("contacts 表已经是最新结构");
			return;
		}

		// 执行迁移
		db.exec(`
            -- 1. 创建新表
            CREATE TABLE contacts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                username TEXT NOT NULL,
                avatar TEXT,
                chat_id INTEGER,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(server_id)
            );

            -- 2. 复制数据
            INSERT INTO contacts_new (
                id, user_id, username, avatar, chat_id, created_at, updated_at
            )
            SELECT 
                id, server_id, username, avatar, chat_id, created_at, updated_at
            FROM contacts;

            -- 3. 删除旧表
            DROP TABLE contacts;

            -- 4. 重命名新表
            ALTER TABLE contacts_new RENAME TO contacts;
        `);

		console.log("contacts 表迁移完成");
	}

	/**
	 * 迁移 friendships 表：更新外键约束
	 */
	private static async migrateFriendships() {
		const db = getDB();
		console.log("开始迁移 friendships 表");

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 创建新表
			db.exec(`
                CREATE TABLE friendships_new (
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

			// 2. 复制数据
			db.exec(`
                INSERT INTO friendships_new 
                SELECT * FROM friendships
            `);

			// 3. 删除旧表
			db.exec("DROP TABLE friendships");

			// 4. 重命名新表
			db.exec("ALTER TABLE friendships_new RENAME TO friendships");

			db.exec("COMMIT");
			console.log("friendships 表迁移完成");
		} catch (error) {
			db.exec("ROLLBACK");
			console.error("friendships 表迁移失败:", error);
			throw error;
		}
	}
}

// 为了向后兼容，我们可以添加这个别名
export const DatabaseMigrations = DBMigration;
