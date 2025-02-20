import {getDB} from "../index";
import type {Contact} from "../entities";

export class ContactsDAL {
	static tableName = "contacts";

	static create(data: Omit<Contact, "id" | "created_at" | "updated_at">) {
		const db = getDB();
		const stmt = db.prepare(`
            INSERT OR REPLACE INTO ${this.tableName} 
            (server_id, username, avatar) 
            VALUES (@server_id, @username, @avatar)
            RETURNING *
        `);
		return stmt.get(data) as Contact;
	}

	static findByServerId(serverId: number) {
		const db = getDB();
		const stmt = db.prepare(`
            SELECT * FROM ${this.tableName} 
            WHERE server_id = ?
        `);
		return stmt.get(serverId) as Contact | undefined;
	}

	static findAll() {
		const db = getDB();
		const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
		return stmt.all() as Contact[];
	}
}
