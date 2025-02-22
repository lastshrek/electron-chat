import {Device} from "mediasoup-client";
import type {RtpCapabilities, RtpParameters, DtlsParameters} from "mediasoup-client/lib/types";
import {Socket} from "socket.io-client";
import {ref} from "vue";

interface TransportOptions {
	id: string;
	iceParameters: any;
	iceCandidates: any[];
	dtlsParameters: DtlsParameters;
}

interface ProduceParams {
	kind: "audio" | "video";
	rtpParameters: RtpParameters;
	appData?: Record<string, unknown>;
}

export class MediasoupService {
	private device: Device;
	private socket: Socket;
	private producerTransport: any;
	private consumerTransport: any;
	private producers = new Map();
	private consumers = new Map();

	public localStream = ref<MediaStream | null>(null);
	public remoteStreams = ref<Map<string, MediaStream>>(new Map());

	constructor(socket: Socket) {
		this.socket = socket;
		this.device = new Device();
	}

	async loadDevice(routerRtpCapabilities: RtpCapabilities) {
		try {
			await this.device.load({routerRtpCapabilities});
			console.log("Device loaded successfully");
		} catch (error) {
			console.error("Failed to load device:", error);
			throw error;
		}
	}

	async initializeTransports(transportOptions: any) {
		try {
			this.producerTransport = this.device.createSendTransport(transportOptions);

			this.producerTransport.on("connect", async ({dtlsParameters}, callback, errback) => {
				try {
					await this.socket.emit("connect-transport", {
						transportId: this.producerTransport.id,
						dtlsParameters,
					});
					callback();
				} catch (error) {
					errback(error);
				}
			});

			this.producerTransport.on(
				"produce",
				async ({kind, rtpParameters}, callback, errback) => {
					try {
						const {id} = await this.socket.emit("produce", {
							transportId: this.producerTransport.id,
							kind,
							rtpParameters,
						});
						callback({id});
					} catch (error) {
						errback(error);
					}
				}
			);

			console.log("Transport initialized successfully");
		} catch (error) {
			console.error("Failed to initialize transport:", error);
			throw error;
		}
	}

	async publish(track: MediaStreamTrack) {
		try {
			const producer = await this.producerTransport.produce({track});
			this.producers.set(producer.id, producer);
			console.log("Track published:", track.kind);
			return producer;
		} catch (error) {
			console.error("Failed to publish track:", error);
			throw error;
		}
	}

	async startLocalStream() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: {ideal: 1280},
					height: {ideal: 720},
				},
			});
			this.localStream.value = stream;

			// 发布音视频轨道
			for (const track of stream.getTracks()) {
				await this.publish(track);
			}

			console.log("Local stream started successfully");
			return stream;
		} catch (error) {
			console.error("Failed to get local media:", error);
			throw error;
		}
	}

	async consume(remoteProducerId: string) {
		try {
			const {rtpCapabilities} = this.device;
			const {id, kind, rtpParameters} = await this.socket.emit("consume", {
				producerId: remoteProducerId,
				rtpCapabilities,
			});

			const consumer = await this.consumerTransport.consume({
				id,
				producerId: remoteProducerId,
				kind,
				rtpParameters,
			});

			this.consumers.set(consumer.id, consumer);
			console.log("Remote stream consumed:", kind);
			return consumer;
		} catch (error) {
			console.error("Failed to consume remote stream:", error);
			throw error;
		}
	}

	close() {
		try {
			// 先关闭所有生产者和消费者
			this.producers.forEach((producer) => producer.close());
			this.consumers.forEach((consumer) => consumer.close());

			// 关闭传输
			if (this.producerTransport) {
				this.producerTransport.close();
			}
			if (this.consumerTransport) {
				this.consumerTransport.close();
			}

			// 停止所有媒体轨道
			if (this.localStream.value) {
				this.localStream.value.getTracks().forEach((track) => track.stop());
				this.localStream.value = null;
			}

			// 清空远程流
			this.remoteStreams.value.clear();

			console.log("MediaSoup service closed successfully");
		} catch (error) {
			console.error("Error closing MediaSoup service:", error);
		} finally {
			// 重置所有状态
			this.producers.clear();
			this.consumers.clear();
			this.producerTransport = null;
			this.consumerTransport = null;
		}
	}

	// 添加一些辅助方法
	isDeviceLoaded(): boolean {
		return this.device.loaded;
	}

	canProduce(kind: "audio" | "video"): boolean {
		return this.device.canProduce(kind);
	}

	getLocalStream(): MediaStream | null {
		return this.localStream?.value || null;
	}

	getRemoteStreams(): Map<string, MediaStream> {
		return this.remoteStreams?.value || new Map();
	}
}

// 创建单例
let mediasoupService: MediasoupService | null = null;

export const createMediasoupService = (socket: Socket): MediasoupService => {
	if (!mediasoupService) {
		mediasoupService = new MediasoupService(socket);
	}
	return mediasoupService;
};

export const getMediasoupService = (): MediasoupService | null => {
	return mediasoupService;
};
