import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/index.css";
import {createPinia} from "pinia";
import {install} from "@/lib/shadcn-vue";
import {toastService} from "./services/toast";

const pinia = createPinia();

const app = createApp(App);
install(app);

// 添加全局属性
app.config.globalProperties.$toast = toastService;

// 声明类型
declare module "@vue/runtime-core" {
	interface ComponentCustomProperties {
		$toast: typeof toastService;
	}
}

app.use(pinia).use(router).mount("#app");
