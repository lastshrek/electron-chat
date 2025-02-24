export interface CellStyle {
	bold?: boolean;
	italic?: boolean;
	fontSize?: number;
	fontFamily?: string;
	color?: string;
	bgcolor?: string;
	align?: "left" | "center" | "right";
	valign?: "top" | "middle" | "bottom";
}

export interface Cell {
	content: string;
	style?: CellStyle;
}

export interface ExcelContent {
	name: string;
	freeze: string;
	styles: any[];
	merges: any[];
	rows: {
		[key: string]: {
			cells: {
				[key: string]: {
					text: string;
					style?: CellStyle;
				};
			};
		};
		len: number;
	};
	cols: {
		len: number;
	};
	validations: any[];
	autofilter: any;
}

export type OperationType =
	| "updateCell"
	| "insertRow"
	| "deleteRow"
	| "insertColumn"
	| "deleteColumn";

export interface CellOperation {
	type: OperationType;
	row: number;
	column: number;
	content?: string;
	style?: CellStyle;
	userId: number;
}

export interface DocumentOperation {
	id: number;
	documentId: string;
	userId: number;
	operationType: string;
	operationData: any;
	createdAt: string;
	user: {
		id: number;
		username: string;
		avatar: string;
	};
}

export interface DocumentCollaborator {
	id: number;
	documentId: string;
	userId: number;
	role: "owner" | "editor" | "viewer";
	joinedAt: string;
	lastActiveAt: string;
	user: {
		id: number;
		username: string;
		avatar: string;
	};
}
