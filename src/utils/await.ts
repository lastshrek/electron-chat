/*
 * @Author       : lastshrek
 * @Date         : 2025-02-28 20:59:31
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:02:34
 * @FilePath     : /src/utils/await.ts
 * @Description  : await
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-28 20:59:31
 */
/**
 * 优雅地处理 Promise 的工具函数
 * @param promise 要处理的 Promise
 * @returns [data, error] 元组,成功时 error 为 undefined,失败时 data 为 undefined
 * @example
 */
export const awaitTo = async <T, E = Error>(promise: Promise<T>): Promise<[T | undefined, E | undefined]> => {
	try {
		const data = await promise
		return [data, undefined]
	} catch (error) {
		return [undefined, error as E]
	}
}
