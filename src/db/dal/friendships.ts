import {getDB} from "../index";
import type {Friendship, FriendWithDetails} from "../entities";

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
            JOIN contacts c ON f.friend_id = c.server_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `);
		return stmt.all(userId) as FriendWithDetails[];
	}

	static syncFriendships(
		userId: number,
		friends: Array<{
			id: number;
			userId: number;
			friendId: number;
			createdAt: string;
			friend: {
				id: number;
				username: string;
				avatar: string;
				chatId?: number;
			};
		}>
	) {
		const db = getDB();
		console.log("开始同步好友关系, userId:", userId, "好友列表:", friends);

		db.exec("BEGIN TRANSACTION");
		try {
			// 1. 获取当前所有好友关系
			const currentFriends = this.findByUserId(userId);
			console.log("当前好友列表:", currentFriends);

			const currentFriendIds = new Set(currentFriends.map((f) => f.friendId));
			const newFriendIds = new Set(friends.map((f) => f.friend.id));

			// 2. 更新现有好友的联系人信息
			const updateContactStmt = db.prepare(`
                UPDATE contacts 
                SET username = @username, 
                    avatar = @avatar,
                    chat_id = @chatId
                WHERE server_id = @server_id
            `);

			// 3. 插入新好友的联系人信息
			const insertContactStmt = db.prepare(`
                INSERT INTO contacts 
                (server_id, username, avatar, chat_id)
                VALUES (@server_id, @username, @avatar, @chatId)
            `);

			// 4. 插入新的好友关系
			const insertFriendshipStmt = db.prepare(`
                INSERT INTO ${this.tableName}
                (user_id, friend_id, created_at)
                VALUES (@user_id, @friend_id, @created_at)
            `);

			// 5. 处理每个好友
			for (const friend of friends) {
				const friendData = {
					server_id: friend.friend.id,
					username: friend.friend.username,
					avatar: friend.friend.avatar,
					chatId: friend.friend.chatId || null,
				};

				if (currentFriendIds.has(friend.friend.id)) {
					// 已存在的好友，只更新资料
					console.log("更新好友资料:", friend.friend.username);
					updateContactStmt.run(friendData);
				} else {
					// 新好友，插入联系人信息和好友关系
					console.log("添加新好友:", friend.friend.username);
					insertContactStmt.run(friendData);
					insertFriendshipStmt.run({
						user_id: userId,
						friend_id: friend.friend.id,
						created_at: friend.createdAt,
					});
				}
			}

			// 6. 删除不再是好友的关系
			const friendIdsToDelete = Array.from(currentFriendIds).filter(
				(id) => !newFriendIds.has(id)
			);
			if (friendIdsToDelete.length > 0) {
				console.log("需要删除的好友关系:", friendIdsToDelete);
				const removeFriendshipStmt = db.prepare(`
                    DELETE FROM ${this.tableName}
                    WHERE user_id = ? AND friend_id = ?
                `);

				for (const friendId of friendIdsToDelete) {
					console.log("删除好友关系:", friendId);
					removeFriendshipStmt.run(userId, friendId);
				}
			}

			db.exec("COMMIT");
			console.log("好友关系同步完成");
			return true;
		} catch (error) {
			console.error("同步好友关系失败:", error);
			db.exec("ROLLBACK");
			throw error;
		}
	}
}
