import type {App} from "vue";
import {Button} from "@/components/ui/button";
import {toast} from "@/components/ui/toast";

export function install(app: App) {
	app.component("Button", Button);
}

export {toast};
