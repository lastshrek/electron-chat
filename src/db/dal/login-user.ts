import {getDB} from "../index";
import type {LoginUser} from "../entities";

export class LoginUserDAL {
	static tableName = "login_user";

	static create(data: Omit<LoginUser, "id" | "created_at" | "updated_at">) {
		const db = getDB();
		console.log("正在保存登录用户:", data);

		// 确保 server_id 是整数
		const params = {
			...data,
			server_id: Math.floor(data.server_id),
		};

		// 检查用户是否已存在
		const existingUser = this.findByServerId(params.server_id);

		if (existingUser) {
			// 如果用户存在，只在信息有变化时更新
			if (
				existingUser.username !== params.username ||
				existingUser.avatar !== params.avatar
			) {
				console.log("更新现有登录用户信息");
				return this.update(params.server_id, params);
			}
			console.log("登录用户信息未变化，无需更新");
			return existingUser;
		}

		// 如果是新用户，创建记录
		console.log("创建新登录用户记录");
		const stmt = db.prepare(`
			INSERT INTO ${this.tableName} 
			(server_id, username, avatar) 
			VALUES (CAST(@server_id AS INTEGER), @username, @avatar)
			RETURNING *
		`);

		const result = stmt.get(params);
		console.log("新登录用户创建结果:", result);
		return result as LoginUser;
	}

	static getCurrentUser(): LoginUser | undefined {
		const db = getDB();
		console.log("正在获取当前登录用户");

		// 不需要按时间排序，因为应该只有一条记录
		const stmt = db.prepare(`
			SELECT * FROM ${this.tableName}
			LIMIT 1
		`);

		const result = stmt.get();
		console.log("当前登录用户查询结果:", result);
		return result as LoginUser | undefined;
	}

	static findByServerId(serverId: number): LoginUser | undefined {
		const db = getDB();

		// 确保 serverId 是整数
		const serverIdInt = Math.floor(serverId);

		const stmt = db.prepare(`
			SELECT * FROM ${this.tableName} 
			WHERE server_id = CAST(? AS INTEGER)
		`);

		const result = stmt.get(serverIdInt);
		return result as LoginUser | undefined;
	}

	static update(
		serverId: number,
		data: Partial<Omit<LoginUser, "id" | "created_at" | "updated_at">>
	) {
		const db = getDB();
		console.log("正在更新登录用户:", {serverId, data});

		const fields = Object.keys(data)
			.map((key) => `${key} = @${key}`)
			.join(", ");

		// 确保 server_id 是整数
		const params = {
			...data,
			server_id: Math.floor(serverId),
		};

		const stmt = db.prepare(`
			UPDATE ${this.tableName}
			SET ${fields}, updated_at = CURRENT_TIMESTAMP
			WHERE server_id = CAST(@server_id AS INTEGER)
			RETURNING *
		`);

		const result = stmt.get(params);
		console.log("登录用户更新结果:", result);
		return result as LoginUser;
	}
}
