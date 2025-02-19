interface ElectronAPI {
	platform: string;
	send: (channel: string, data: any) => void;
	on: (channel: string, callback: Function) => void;
	removeAllListeners: (channel: string) => void;
}

interface Window {
	electron: ElectronAPI;
}
