/// <reference types="vite/client" />

interface ImportMeta {
	readonly env: {
		readonly VITE_API_BASE_URL: string;
		readonly VITE_WS_URL: string;
		readonly VITE_CRYPTO_SECRET_KEY: string;
		readonly MODE: string;
		readonly DEV: boolean;
		readonly PROD: boolean;
		readonly SSR: boolean;
		[key: string]: string | boolean | undefined;
	};
}
