import {defineConfig, loadEnv} from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import {rmSync} from "node:fs";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import {fileURLToPath, URL} from "node:url";

export default defineConfig(({command, mode}) => {
	// 加载环境变量
	const env = loadEnv(mode, process.cwd(), "");
	process.env = {...process.env, ...env};

	console.log("Current Mode:", mode); // 添加调试日志
	console.log("Loaded Env:", {
		VITE_CRYPTO_SECRET_KEY: env.VITE_CRYPTO_SECRET_KEY,
		MODE: env.MODE,
	});

	// 只在非web模式下清理electron构建目录
	if (mode !== "development") {
		rmSync("build/electron", {recursive: true, force: true});
	}

	const isServe = command === "serve";
	const isBuild = command === "build";
	const isWeb = mode === "development";
	const isElectron = mode === "electron";
	const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

	// 根据不同模式返回不同配置
	const baseConfig = {
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		css: {
			postcss: {
				plugins: [tailwind(), autoprefixer()],
			},
		},
		build: {
			outDir: isWeb ? "dist" : "build/app",
			emptyOutDir: true,
		},
		plugins: [vue()],
		clearScreen: true,
	};

	// Web 模式配置
	if (isWeb) {
		return {
			...baseConfig,
			server: {
				port: 5173,
				strictPort: true,
			},
		};
	}

	// Electron 模式配置
	if (isElectron) {
		return {
			...baseConfig,
			base: process.env.ELECTRON_RENDERER_URL,
			server: {
				port: 3678,
				strictPort: true,
			},
			plugins: [
				...baseConfig.plugins,
				electron([
					{
						entry: "electron/main.ts",
						onstart(options) {
							process.env.VSCODE_DEBUG
								? console.log("[startup] Electron App")
								: options.startup();
						},
						vite: {
							build: {
								sourcemap,
								minify: isBuild,
								outDir: "build/electron",
								rollupOptions: {},
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
								outDir: "build/electron",
								rollupOptions: {},
							},
						},
					},
				]),
				renderer(),
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

	// 默认配置
	return baseConfig;
});
