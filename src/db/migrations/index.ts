import {getDB} from "../index";

interface Migration {
	version: number;
	name: string;
	up: string[];
	down: string[];
}

const migrations: Migration[] = [
	{
		version: 1,
		name: "init_base_tables",
		up: [
			// 登录用户表 - 只存储当前登录用户信息
			`CREATE TABLE IF NOT EXISTS login_user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER UNIQUE NOT NULL,  -- 服务器用户ID
                username TEXT NOT NULL,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

			// 联系人表 - 存储所有好友的基本信息
			`CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER UNIQUE NOT NULL,  -- 服务器用户ID
                username TEXT NOT NULL,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

			// 好友关系表 - 存储好友关系
			`CREATE TABLE IF NOT EXISTS friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,          -- 当前用户的服务器ID
                friend_id INTEGER NOT NULL,        -- 好友的服务器ID
                created_at DATETIME NOT NULL,
                FOREIGN KEY (friend_id) REFERENCES contacts(server_id) ON DELETE CASCADE
            )`,

			// 创建索引
			`CREATE INDEX IF NOT EXISTS idx_contacts_server_id ON contacts(server_id)`,
			`CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id)`,
			`CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id)`,
		],
		down: [
			"DROP INDEX IF EXISTS idx_friendships_friend_id",
			"DROP INDEX IF EXISTS idx_friendships_user_id",
			"DROP INDEX IF EXISTS idx_contacts_server_id",
			"DROP TABLE IF EXISTS friendships",
			"DROP TABLE IF EXISTS contacts",
			"DROP TABLE IF EXISTS login_user",
		],
	},
	{
		version: 2,
		name: "remove_chat_tables",
		up: [
			// 只删除聊天相关的表，不要尝试删除不存在的表
			"DROP TABLE IF EXISTS messages",
			"DROP TABLE IF EXISTS message_status",
			"DROP TABLE IF EXISTS chat_participants",
			"DROP TABLE IF EXISTS chats",
		],
		down: [
			// 如果需要回滚，重新创建这些表
			// ... 暂时不需要实现 ...
		],
	},
	{
		version: 3,
		name: "add_chat_id_to_contacts",
		up: [
			// 添加 chatId 字段到 contacts 表
			`ALTER TABLE contacts 
			 ADD COLUMN chat_id INTEGER DEFAULT NULL`,

			// 创建索引以优化查询
			`CREATE INDEX IF NOT EXISTS idx_contacts_chat_id 
			 ON contacts(chat_id)`,
		],
		down: [
			// 删除索引
			`DROP INDEX IF EXISTS idx_contacts_chat_id`,

			// 删除 chatId 字段
			// SQLite 不支持 DROP COLUMN，需要重建表
			`CREATE TABLE contacts_temp (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				server_id INTEGER UNIQUE NOT NULL,
				username TEXT NOT NULL,
				avatar TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)`,

			`INSERT INTO contacts_temp 
			 SELECT id, server_id, username, avatar, created_at, updated_at 
			 FROM contacts`,

			`DROP TABLE contacts`,

			`ALTER TABLE contacts_temp RENAME TO contacts`,
		],
	},
	{
		version: 4,
		name: "create_chats_table",
		up: [
			// 创建聊天表
			`CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER UNIQUE NOT NULL,  -- 服务器聊天ID
                type TEXT NOT NULL CHECK(type IN ('DIRECT', 'GROUP')),  -- 聊天类型
                name TEXT,  -- 群聊名称（直接聊天为空）
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

			// 创建聊天参与者表
			`CREATE TABLE IF NOT EXISTS chat_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,  -- 参与者ID（关联contacts表）
                role TEXT DEFAULT 'MEMBER' CHECK(role IN ('OWNER', 'ADMIN', 'MEMBER')),
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(server_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES contacts(server_id) ON DELETE CASCADE,
                UNIQUE(chat_id, user_id)
            )`,

			// 先将现有的 chat_id 插入到 chats 表
			`INSERT INTO chats (server_id, type)
			 SELECT DISTINCT chat_id, 'DIRECT' as type
			 FROM contacts
			 WHERE chat_id IS NOT NULL`,

			// 重建 contacts 表以添加外键约束
			`CREATE TABLE contacts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER UNIQUE NOT NULL,
                username TEXT NOT NULL,
                avatar TEXT,
                chat_id INTEGER DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(server_id) ON DELETE SET NULL
            )`,

			// 复制数据
			`INSERT INTO contacts_new 
			 SELECT id, server_id, username, avatar, chat_id, created_at, updated_at 
			 FROM contacts`,

			// 删除旧表
			`DROP TABLE contacts`,

			// 重命名新表
			`ALTER TABLE contacts_new RENAME TO contacts`,

			// 创建索引
			`CREATE INDEX IF NOT EXISTS idx_chats_server_id ON chats(server_id)`,
			`CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id)`,
			`CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id)`,
			`CREATE INDEX IF NOT EXISTS idx_contacts_server_id ON contacts(server_id)`,
			`CREATE INDEX IF NOT EXISTS idx_contacts_chat_id ON contacts(chat_id)`,
		],
		down: [
			// 删除表和索引
			`DROP TABLE IF EXISTS chat_participants`,
			`DROP TABLE IF EXISTS chats`,

			// 重建 contacts 表（不带外键约束）
			`CREATE TABLE contacts_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER UNIQUE NOT NULL,
                username TEXT NOT NULL,
                avatar TEXT,
                chat_id INTEGER DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

			`INSERT INTO contacts_new 
			 SELECT id, server_id, username, avatar, chat_id, created_at, updated_at 
			 FROM contacts`,

			`DROP TABLE contacts`,

			`ALTER TABLE contacts_new RENAME TO contacts`,

			// 重建索引
			`CREATE INDEX IF NOT EXISTS idx_contacts_server_id ON contacts(server_id)`,
			`CREATE INDEX IF NOT EXISTS idx_contacts_chat_id ON contacts(chat_id)`,
		],
	},
];

export class DBMigration {
	private static readonly VERSION_TABLE = "db_version";

	static init() {
		const db = getDB();

		// 创建版本表
		db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.VERSION_TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL,
                name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
	}

	static getCurrentVersion(): number {
		const db = getDB();
		const result = db
			.prepare(
				`
            SELECT version FROM ${this.VERSION_TABLE}
            ORDER BY version DESC LIMIT 1
        `
			)
			.get();
		return result ? result.version : 0;
	}

	static async migrate() {
		const db = getDB();
		const currentVersion = this.getCurrentVersion();

		console.log(`当前数据库版本: ${currentVersion}`);

		const pendingMigrations = migrations
			.filter((m) => m.version > currentVersion)
			.sort((a, b) => a.version - b.version);

		if (pendingMigrations.length === 0) {
			console.log("数据库已是最新版本");
			return;
		}

		console.log(`需要执行 ${pendingMigrations.length} 个迁移`);

		for (const migration of pendingMigrations) {
			console.log(`执行迁移: ${migration.name} (版本 ${migration.version})`);

			db.exec("BEGIN TRANSACTION");

			try {
				// 执行迁移脚本
				for (const sql of migration.up) {
					db.exec(sql);
				}

				// 记录版本
				db.prepare(
					`
                    INSERT INTO ${this.VERSION_TABLE} (version, name)
                    VALUES (@version, @name)
                `
				).run({
					version: migration.version,
					name: migration.name,
				});

				db.exec("COMMIT");
				console.log(`迁移完成: ${migration.name}`);
			} catch (error) {
				console.error(`迁移失败: ${migration.name}`, error);
				db.exec("ROLLBACK");
				throw error;
			}
		}

		console.log("所有迁移执行完成");
	}
}
