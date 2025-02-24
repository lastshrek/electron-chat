import request from "@/utils/request";

export interface CreateDocumentDto {
	title: string;
	type: "word" | "excel";
}

export interface Document {
	id: string;
	title: string;
	type: "word" | "excel";
	content: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	createdBy: number;
	creator: {
		id: number;
		username: string;
		avatar: string | null;
	};
	collaborators: Array<{
		id: number;
		username: string;
		avatar: string;
	}>;
}

export interface DocumentOperation {
	id: number;
	documentId: string;
	userId: number;
	operationType: string;
	operationData: any;
	createdAt: string;
}

export interface DocumentCollaborator {
	id: number;
	documentId: string;
	userId: number;
	role: string;
	joinedAt: string;
	lastActiveAt: string;
}

export const documentApi = {
	// 创建文档
	createDocument(data: CreateDocumentDto) {
		return request.post<Document>("/documents", data);
	},

	// 获取文档列表
	getDocuments() {
		return request.get<Document[]>("/documents");
	},

	// 获取单个文档
	getDocument(id: string) {
		return request.get<Document>(`/documents/${id}`);
	},

	// 更新文档
	updateDocument(id: string, data: {content: string}) {
		return request.patch<Document>(`/documents/${id}`, data);
	},

	updateCollaboratorLastActive: (documentId: string, userId: number) => {
		return request.post(`/documents/${documentId}/collaborators/${userId}/active`);
	},
};
