import {getDB} from "../index";
import type {Friendship, FriendWithDetails} from "../entities";
import {LoginUserDAL} from "./login-user";

export class FriendshipsDAL {
	static tableName = "friendships";

	static create(data: Omit<Friendship, "id" | "created_at">) {
		const db = getDB();
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO ${this.tableName} 
            (user_id, friend_id, created_at) 
            VALUES (@user_id, @friend_id, @created_at)
            RETURNING *
        `);
		return stmt.get(data) as Friendship;
	}

	static findByUserId(userId: number): FriendWithDetails[] {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT 
                f.id,
                f.created_at as createdAt,
                f.user_id as userId,
                f.friend_id as friendId,
                c.username as friendUsername,
                c.avatar as friendAvatar,
                c.chat_id as chatId
            FROM ${this.tableName} f
            LEFT JOIN contacts c ON f.friend_id = c.user_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `);

		console.log("查询好友列表SQL参数:", userId);
		const results = stmt.all(userId);
		console.log("查询好友列表结果:", results);

		return results as FriendWithDetails[];
	}

	static async syncFriendships(
		userId: number,
		friends: Array<{
			friendId: number;
			friend: {
				id: number;
				username: string;
				avatar: string;
				chatId: number;
			};
		}>
	): Promise<boolean> {
		const db = getDB();
		console.log("开始同步好友关系, userId:", userId);
		console.log("接收到的好友数据:", friends);

		// 确保 userId 是整数
		userId = Math.floor(userId);

		// 获取新好友的 ID 列表
		const newFriendIds = friends.map((f) => Math.floor(f.friend.id)).filter((id) => id);
		console.log("新的好友ID列表:", newFriendIds);

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 先创建/更新联系人记录
			const upsertContactStmt = db.prepare(`
                INSERT INTO contacts 
                (user_id, username, avatar, chat_id)
                VALUES (?, ?, ?, NULL)
                ON CONFLICT(user_id) DO UPDATE SET
                username = excluded.username,
                avatar = excluded.avatar,
                updated_at = CURRENT_TIMESTAMP
            `);

			// 2. 创建聊天记录
			const chatStmt = db.prepare(`
                INSERT OR IGNORE INTO chats 
                (chat_id, type, name)
                VALUES (?, 'DIRECT', NULL)
            `);

			// 3. 更新联系人的 chat_id
			const updateContactChatStmt = db.prepare(`
                UPDATE contacts
                SET chat_id = ?
                WHERE user_id = ?
            `);

			// 处理每个好友的数据
			for (const {friend} of friends) {
				console.log("处理好友数据:", friend);
				if (!friend.id || !friend.username || !friend.chatId) {
					console.warn("跳过无效的好友数据:", friend);
					continue;
				}

				const friendId = Math.floor(friend.id);
				const chatId = Math.floor(friend.chatId);

				// 1. 先创建联系人记录
				upsertContactStmt.run(friendId, friend.username, friend.avatar || null);

				// 2. 创建聊天记录
				chatStmt.run(chatId);

				// 3. 更新联系人的 chat_id
				updateContactChatStmt.run(chatId, friendId);
			}

			// 4. 删除不再是好友的记录
			if (newFriendIds.length > 0) {
				const placeholders = newFriendIds.map(() => "?").join(",");
				const deleteFriendshipsStmt = db.prepare(`
                    DELETE FROM ${this.tableName}
                    WHERE user_id = ?
                    AND friend_id NOT IN (${placeholders})
                `);
				deleteFriendshipsStmt.run(userId, ...newFriendIds);
			}

			// 5. 创建或更新好友关系
			const upsertFriendshipStmt = db.prepare(`
                INSERT INTO ${this.tableName}
                (user_id, friend_id, created_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, friend_id) DO UPDATE SET
                updated_at = CURRENT_TIMESTAMP
            `);

			for (const {friend} of friends) {
				if (!friend.id) continue;
				const friendId = Math.floor(friend.id);
				// 确保 user_id 总是较小的 ID，friend_id 总是较大的 ID
				const [smallerId, biggerId] = [userId, friendId].sort((a, b) => a - b);
				upsertFriendshipStmt.run(smallerId, biggerId);
			}

			db.exec("COMMIT");
			return true;
		} catch (error) {
			console.error("同步好友关系失败:", error);
			db.exec("ROLLBACK");
			throw error;
		}
	}
}
