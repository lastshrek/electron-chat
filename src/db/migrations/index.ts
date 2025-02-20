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
