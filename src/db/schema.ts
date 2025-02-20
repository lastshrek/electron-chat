import type {IDatabase} from "./index";

// 创建用户表
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// 创建聊天表
const createChatsTable = `
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('DIRECT', 'GROUP')),
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// 创建聊天参与者表
const createChatParticipantsTable = `
CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id INTEGER,
    user_id INTEGER,
    role TEXT DEFAULT 'MEMBER' CHECK(role IN ('OWNER', 'ADMIN', 'MEMBER')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chat_id, user_id),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

// 创建消息表
const createMessagesTable = `
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
    status TEXT NOT NULL CHECK(status IN ('SENT', 'DELIVERED', 'READ')),
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
)`;

// 创建消息状态表
const createMessageStatusTable = `
CREATE TABLE IF NOT EXISTS message_status (
    message_id INTEGER,
    user_id INTEGER,
    status TEXT NOT NULL CHECK(status IN ('DELIVERED', 'READ')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;

// 创建好友关系表
const createFriendshipsTable = `
CREATE TABLE IF NOT EXISTS friendships (
    user_id1 INTEGER,
    user_id2 INTEGER,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'ACCEPTED', 'BLOCKED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id1, user_id2),
    FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE
)`;

// 初始化数据库
export const initSchema = (db: IDatabase) => {
	try {
		// 开启事务
		db.exec("BEGIN TRANSACTION;");

		// 创建所有表
		db.exec(createUsersTable);
		db.exec(createChatsTable);
		db.exec(createChatParticipantsTable);
		db.exec(createMessagesTable);
		db.exec(createMessageStatusTable);
		db.exec(createFriendshipsTable);

		// 提交事务
		db.exec("COMMIT;");

		console.log("数据库表创建成功");
	} catch (error) {
		// 回滚事务
		db.exec("ROLLBACK;");
		console.error("创建数据库表失败:", error);
		throw error;
	}
};
