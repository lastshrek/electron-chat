type EventCallback = (...args: any[]) => void;

export class EventEmitter {
	private events: Map<string, EventCallback[]> = new Map();

	on(event: string, callback: EventCallback): void {
		if (!this.events.has(event)) {
			this.events.set(event, []);
		}
		this.events.get(event)!.push(callback);
	}

	off(event: string, callback?: EventCallback): void {
		if (!callback) {
			this.events.delete(event);
			return;
		}
		const callbacks = this.events.get(event);
		if (callbacks) {
			const index = callbacks.indexOf(callback);
			if (index !== -1) {
				callbacks.splice(index, 1);
			}
			if (callbacks.length === 0) {
				this.events.delete(event);
			}
		}
	}

	emit(event: string, ...args: any[]): void {
		const callbacks = this.events.get(event);
		if (callbacks) {
			callbacks.forEach((callback) => callback(...args));
		}
	}

	removeAllListeners(): void {
		this.events.clear();
	}
}
