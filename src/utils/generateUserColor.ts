export const generateUserColor = () => {
	const colors = [
		"#ff0000", // 红色
		"#00ff00", // 绿色
		"#0000ff", // 蓝色
		"#ffff00", // 黄色
		"#ff00ff", // 品红
		"#00ffff", // 青色
	];
	return colors[Math.floor(Math.random() * colors.length)];
};
