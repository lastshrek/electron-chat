/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:34:53
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-19 20:35:40
 * @FilePath     : /src/utils/crypto.ts
 * @Description  :
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:34:53
 */
import CryptoJS from "crypto-js";

// 获取环境变量中的密钥
const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET_KEY;

console.log("Crypto Environment:", {
	// 添加调试日志
	MODE: import.meta.env.MODE,
	DEV: import.meta.env.DEV,
	PROD: import.meta.env.PROD,
	VITE_CRYPTO_SECRET_KEY: import.meta.env.VITE_CRYPTO_SECRET_KEY,
});

if (!SECRET_KEY) {
	console.error("VITE_CRYPTO_SECRET_KEY is not defined in environment variables");
	throw new Error("VITE_CRYPTO_SECRET_KEY is required");
}

const FALLBACK_KEY = "chat-secret-key-0725"; // 仅用于开发环境

console.log("当前环境变量:", {
	MODE: import.meta.env.MODE,
	VITE_CRYPTO_SECRET_KEY: import.meta.env.VITE_CRYPTO_SECRET_KEY,
	allEnv: import.meta.env,
});

export const encrypt = (text: string): string => {
	// 生成 32 字节的密钥
	const keyHash = CryptoJS.SHA256(SECRET_KEY || FALLBACK_KEY);
	const key = CryptoJS.enc.Hex.parse(keyHash.toString());

	// 使用固定的 IV
	const iv = CryptoJS.lib.WordArray.create(new Uint8Array(16));

	// 加密
	const encrypted = CryptoJS.AES.encrypt(text, key, {
		iv: iv,
		mode: CryptoJS.mode.CBC,
		padding: CryptoJS.pad.Pkcs7,
	});

	return encrypted.toString();
};
