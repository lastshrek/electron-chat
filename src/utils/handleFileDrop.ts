export const handleFileDrop = async (files: FileList) => {
	// 处理文件拖放的逻辑
	const file = files[0];
	if (file.type.startsWith("image/")) {
		// 处理图片
		const url = URL.createObjectURL(file);
		return {type: "image", url};
	}
	return null;
};
