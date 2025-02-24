import {CellStyle} from "x-data-spreadsheet";

declare module "x-data-spreadsheet" {
	// 基础样式类型
	export interface BaseStyle {
		bgcolor?: string;
		align?: "left" | "center" | "right";
		valign?: "top" | "middle" | "bottom";
		textwrap?: boolean;
		strike?: boolean;
		underline?: boolean;
		color?: string;
		font?: {
			name?: string;
			size?: number;
			bold?: boolean;
			italic?: boolean;
		};
	}

	// 扩展样式类型
	export interface ExtendedCellStyle extends BaseStyle {
		border?: Record<string, any>;
		format?: string;
	}

	// 修改 CellData 接口
	export interface CellData {
		text?: string;
		style?: ExtendedCellStyle;
	}

	export interface SpreadsheetOptions {
		mode?: "edit" | "read";
		showToolbar?: boolean;
		showGrid?: boolean;
		showContextmenu?: boolean;
		view?: {
			height?: () => number;
			width?: () => number;
		};
		row?: {
			len: number;
			height: number;
		};
		col?: {
			len: number;
			width: number;
			minWidth: number;
			indexWidth: number;
		};
		style?: BaseStyle;
	}

	export default class Spreadsheet {
		constructor(container: HTMLElement, options?: SpreadsheetOptions);

		on(eventName: string, callback: (...args: any[]) => void): void;
		cell(row: number, col: number, data?: CellData): void;
		insertRow(index: number): void;
		deleteRow(index: number): void;
		insertColumn(index: number): void;
		deleteColumn(index: number): void;
		loadData(data: any): void;
		getData(): any;
		change(callback: (data: any) => void): this;
		getCell(row: number, col: number): HTMLElement | null;
	}
}
