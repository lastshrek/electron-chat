import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/index.css";
import {createPinia} from "pinia";
import {install} from "@/lib/shadcn-vue";

const pinia = createPinia();

const app = createApp(App);
install(app);

app.use(pinia).use(router).mount("#app");
