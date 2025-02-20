import {getDB} from "./index";

export interface User {
	id: number;
	username: string;
	avatar: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserParams {
	username: string;
	email: string;
	passwordHash: string;
	avatar?: string;
}

export class UserDAL {
	// 创建用户
	static createUser(params: CreateUserParams): User {
		const db = getDB();
		const stmt = db.prepare(`
            INSERT INTO users (username, email, password_hash, avatar)
            VALUES (@username, @email, @passwordHash, @avatar)
            RETURNING id, username, avatar, created_at as createdAt, updated_at as updatedAt
        `);

		return stmt.get(params) as User;
	}

	// 通过ID获取用户
	static getUserById(id: number): User | null {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
            FROM users
            WHERE id = ?
        `);

		return stmt.get(id) as User | null;
	}

	// 通过用户名获取用户
	static getUserByUsername(username: string): User | null {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
            FROM users
            WHERE username = ?
        `);

		return stmt.get(username) as User | null;
	}

	// 更新用户信息
	static updateUser(id: number, updates: Partial<CreateUserParams>): User {
		const db = getDB();
		const fields = Object.keys(updates)
			.map((key) => `${key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())} = @${key}`)
			.join(", ");

		const stmt = db.prepare(`
            UPDATE users
            SET ${fields}, updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
            RETURNING id, username, avatar, created_at as createdAt, updated_at as updatedAt
        `);

		return stmt.get({id, ...updates}) as User;
	}

	// 删除用户
	static deleteUser(id: number): boolean {
		const db = getDB();
		const stmt = db.prepare("DELETE FROM users WHERE id = ?");
		const result = stmt.run(id);
		return result.changes > 0;
	}

	// 搜索用户
	static searchUsers(keyword: string, limit: number = 10): User[] {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT id, username, avatar, created_at as createdAt, updated_at as updatedAt
            FROM users
            WHERE username LIKE ?
            LIMIT ?
        `);

		return stmt.all(`%${keyword}%`, limit) as User[];
	}
}
