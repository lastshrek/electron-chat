interface ElectronAPI {
	platform: string
	send: (channel: string, data: any) => void
	on: (channel: string, callback: Function) => void
	removeAllListeners: (channel: string) => void
	db: DBOperations
}

interface Window {
	electron: {
		ipcRenderer: {
			invoke(channel: string, ...args: any[]): Promise<any>
			on(channel: string, func: (...args: any[]) => void): void
			once(channel: string, func: (...args: any[]) => void): void
		}
	}
}
