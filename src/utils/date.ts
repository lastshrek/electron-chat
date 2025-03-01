/**
 * 格式化时间
 * @param dateStr ISO 格式的日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (dateStr: string): string => {
	if (!dateStr) return ''

	const date = new Date(dateStr)
	const now = new Date()
	const diff = now.getTime() - date.getTime()

	// 今天的消息只显示时间
	if (isToday(date)) {
		return date.toLocaleTimeString('zh-CN', {
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	// 昨天的消息显示"昨天"
	if (isYesterday(date)) {
		return (
			'昨天 ' +
			date.toLocaleTimeString('zh-CN', {
				hour: '2-digit',
				minute: '2-digit',
			})
		)
	}

	// 一周内的消息显示星期几
	if (diff < 7 * 24 * 60 * 60 * 1000) {
		return (
			date.toLocaleDateString('zh-CN', { weekday: 'long' }) +
			' ' +
			date.toLocaleTimeString('zh-CN', {
				hour: '2-digit',
				minute: '2-digit',
			})
		)
	}

	// 其他情况显示完整日期
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

/**
 * 判断是否是今天
 */
const isToday = (date: Date): boolean => {
	const today = new Date()
	return (
		date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
	)
}

/**
 * 判断是否是昨天
 */
const isYesterday = (date: Date): boolean => {
	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)
	return (
		date.getDate() === yesterday.getDate() &&
		date.getMonth() === yesterday.getMonth() &&
		date.getFullYear() === yesterday.getFullYear()
	)
}
