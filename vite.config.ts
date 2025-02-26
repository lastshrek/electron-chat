import {defineConfig, loadEnv} from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import {rmSync} from "node:fs";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import {fileURLToPath, URL} from "node:url";
import {resolve} from "path";
import path from "path";
export default defineConfig(({command, mode}) => {
	// 加载环境变量
	const env = loadEnv(mode, process.cwd(), "");
	process.env = {...process.env, ...env};

	console.log("Current Mode:", mode);

	// 只在非web模式下清理electron构建目录
	if (mode !== "development") {
		rmSync("dist-electron", {recursive: true, force: true});
	}

	const isServe = command === "serve";
	const isBuild = command === "build";
	const isWeb = mode === "development" || mode === "production";
	const isElectron = mode === "electron" || mode === "electron.production";
	const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

	// 从命令行获取端口，默认为5173
	const port = process.env.PORT ? parseInt(process.env.PORT) : 5173;

	// 基础配置
	const baseConfig = {
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
				"~@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		css: {
			postcss: {
				plugins: [autoprefixer(), tailwind()],
			},
		},
		build: {
			outDir: isWeb ? "dist" : "dist-electron/app",
			emptyOutDir: true,
			assetsDir: "assets",
			rollupOptions: {
				input: {
					index: resolve(__dirname, "index.html"),
				},
			},
		},
		plugins: [vue()],
		clearScreen: true,
		server: {
			host: "0.0.0.0", // 监听所有网络接口
			port: port,
			strictPort: true, // 如果端口被占用则退出
			open: isWeb, // 只在Web模式下自动打开浏览器
		},
	};

	// 如果是 Electron 模式，添加 Electron 插件
	if (isElectron) {
		return {
			...baseConfig,
			plugins: [
				...baseConfig.plugins,
				electron([
					{
						entry: "electron/main.ts",
						onstart(options) {
							if (process.env.VSCODE_DEBUG) {
								console.log("[startup] Electron App");
							} else {
								options.startup();
							}
						},
						vite: {
							build: {
								sourcemap: sourcemap ? "inline" : undefined,
								minify: isBuild,
								outDir: "dist-electron",
								rollupOptions: {
									external: ["electron"],
								},
							},
						},
					},
					{
						entry: "electron/preload.ts",
						onstart(options) {
							options.reload();
						},
						vite: {
							build: {
								sourcemap: sourcemap ? "inline" : undefined,
								minify: isBuild,
								outDir: "dist-electron",
								rollupOptions: {},
							},
						},
					},
				]),
				renderer({
					// @ts-ignore - nodeIntegration 属性在类型定义中不存在，但在运行时有效
					nodeIntegration: true,
				} as any),
			],
			build: {
				rollupOptions: {
					input: {
						index: fileURLToPath(new URL("./index.html", import.meta.url)),
					},
				},
			},
		};
	}

	// 默认配置 (Web 模式)
	return baseConfig;
});
