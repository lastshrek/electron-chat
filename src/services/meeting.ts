import {Socket} from "socket.io-client";
import type {Device} from "mediasoup-client";
import type {
	RtpCapabilities,
	RtpParameters,
	DtlsParameters,
	Transport,
	Producer,
	Consumer,
	MediaKind,
} from "mediasoup-client/lib/types";
import {ref, type Ref} from "vue";

interface TransportOptions {
	id: string;
	iceParameters: RTCIceParameters;
	iceCandidates: RTCIceCandidate[];
	dtlsParameters: DtlsParameters;
}

interface ProduceParams {
	kind: MediaKind;
	rtpParameters: RtpParameters;
	appData?: Record<string, unknown>;
}

interface ConsumeResponse {
	id: string;
	kind: MediaKind;
	rtpParameters: RtpParameters;
	producerId: string;
	type?: string;
}

export class MeetingService {
	private device: Device;
	private socket: Socket;
	private producerTransport: Transport | null = null;
	private consumerTransport: Transport | null = null;
	private producers = new Map<string, Producer>();
	private consumers = new Map<string, Consumer>();

	public localStream: Ref<MediaStream | null> = ref(null);
	public remoteStreams: Ref<Map<string, MediaStream>> = ref(new Map());
	public isConnected: Ref<boolean> = ref(false);

	constructor(socket: Socket, device: Device) {
		this.socket = socket;
		this.device = device;
		this.setupSocketListeners();
	}

	private setupSocketListeners() {
		this.socket.on("connect", () => {
			console.log("会议服务已连接");
			this.isConnected.value = true;
		});

		this.socket.on("disconnect", () => {
			console.log("会议服务已断开");
			this.isConnected.value = false;
		});

		this.socket.on("participant-joined", (participant) => {
			console.log("新参与者加入:", participant);
		});

		this.socket.on("participant-left", (participantId) => {
			console.log("参与者离开:", participantId);
		});

		this.socket.on("producer-added", async ({producerId, participantId}) => {
			try {
				await this.consumeTrack(producerId, participantId);
			} catch (error) {
				console.error("消费远程轨道失败:", error);
			}
		});
	}

	async loadDevice(routerRtpCapabilities: RtpCapabilities) {
		try {
			await this.device.load({routerRtpCapabilities});
			console.log("设备加载成功");
		} catch (error) {
			console.error("设备加载失败:", error);
			throw error;
		}
	}

	async createTransport() {
		try {
			const transportOptions = await this.requestTransportOptions();
			this.producerTransport = this.device.createSendTransport(transportOptions);

			this.producerTransport.on("connect", async ({dtlsParameters}, callback, errback) => {
				try {
					await this.connectTransport(this.producerTransport!.id, dtlsParameters);
					callback();
				} catch (error) {
					errback(error);
				}
			});

			this.producerTransport.on(
				"produce",
				async ({kind, rtpParameters}, callback, errback) => {
					try {
						const {producerId} = await this.produceTrack(
							this.producerTransport!.id,
							kind,
							rtpParameters
						);
						callback({id: producerId});
					} catch (error) {
						errback(error);
					}
				}
			);
		} catch (error) {
			console.error("创建传输失败:", error);
			throw error;
		}
	}

	async startLocalStream(
		constraints: MediaStreamConstraints = {
			audio: true,
			video: {
				width: {ideal: 1280},
				height: {ideal: 720},
				frameRate: {ideal: 30},
			},
		}
	) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			this.localStream.value = stream;

			for (const track of stream.getTracks()) {
				await this.producerTransport?.produce({track});
			}

			return stream;
		} catch (error) {
			console.error("获取本地媒体流失败:", error);
			throw error;
		}
	}

	private async requestTransportOptions(): Promise<TransportOptions> {
		return new Promise((resolve, reject) => {
			this.socket.emit("create-transport", (response: any) => {
				if (response.error) {
					reject(new Error(response.error));
				} else {
					resolve(response);
				}
			});
		});
	}

	private async connectTransport(
		transportId: string,
		dtlsParameters: DtlsParameters
	): Promise<void> {
		return new Promise((resolve, reject) => {
			this.socket.emit(
				"connect-transport",
				{transportId, dtlsParameters},
				(response: any) => {
					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve();
					}
				}
			);
		});
	}

	private async produceTrack(
		transportId: string,
		kind: MediaKind,
		rtpParameters: RtpParameters
	): Promise<{producerId: string}> {
		return new Promise((resolve, reject) => {
			this.socket.emit(
				"produce",
				{transportId, kind, rtpParameters},
				(response: {error?: string; producerId?: string}) => {
					if (response.error) {
						reject(new Error(response.error));
					} else if (response.producerId) {
						resolve({producerId: response.producerId});
					} else {
						reject(new Error("Invalid response"));
					}
				}
			);
		});
	}

	private async consumeTrack(producerId: string, participantId: string) {
		try {
			const {rtpCapabilities} = this.device;
			const response = await new Promise<ConsumeResponse>((resolve, reject) => {
				this.socket.emit(
					"consume",
					{producerId, rtpCapabilities},
					(res: ConsumeResponse | {error: string}) => {
						if ("error" in res) {
							reject(new Error(res.error));
						} else {
							resolve(res);
						}
					}
				);
			});

			const consumer = await this.consumerTransport?.consume(response);
			if (consumer) {
				this.consumers.set(consumer.id, consumer);
			}
			return consumer;
		} catch (error) {
			console.error("Failed to consume track:", error);
			throw error;
		}
	}

	close() {
		try {
			// 关闭所有生产者和消费者
			this.producers.forEach((producer) => producer.close());
			this.consumers.forEach((consumer) => consumer.close());

			// 关闭传输
			this.producerTransport?.close();
			this.consumerTransport?.close();

			// 停止所有媒体轨道
			if (this.localStream.value) {
				this.localStream.value.getTracks().forEach((track) => track.stop());
				this.localStream.value = null;
			}

			// 清空远程流
			this.remoteStreams.value.clear();

			// 断开 socket 连接
			this.socket.disconnect();

			console.log("会议服务已关闭");
		} catch (error) {
			console.error("关闭会议服务失败:", error);
		}
	}

	// 获取可用的媒体设备列表
	async getMediaDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return {
			audioInputs: devices.filter((device) => device.kind === "audioinput"),
			videoInputs: devices.filter((device) => device.kind === "videoinput"),
		};
	}

	// 切换音频设备
	async switchAudioDevice(deviceId: string) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {deviceId: {exact: deviceId}},
				video: false,
			});

			// 停止旧的音频轨道
			this.localStream.value?.getAudioTracks().forEach((track) => track.stop());

			// 添加新的音频轨道
			const audioTrack = stream.getAudioTracks()[0];
			if (this.localStream.value) {
				this.localStream.value.addTrack(audioTrack);
			}

			// 重新发布音频轨道
			await this.producerTransport?.produce({track: audioTrack});
		} catch (error) {
			console.error("切换音频设备失败:", error);
			throw error;
		}
	}

	// 切换视频设备
	async switchVideoDevice(deviceId: string) {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					deviceId: {exact: deviceId},
					width: {ideal: 1280},
					height: {ideal: 720},
				},
			});

			// 停止旧的视频轨道
			this.localStream.value?.getVideoTracks().forEach((track) => track.stop());

			// 添加新的视频轨道
			const videoTrack = stream.getVideoTracks()[0];
			if (this.localStream.value) {
				this.localStream.value.addTrack(videoTrack);
			}

			// 重新发布视频轨道
			await this.producerTransport?.produce({track: videoTrack});
		} catch (error) {
			console.error("切换视频设备失败:", error);
			throw error;
		}
	}

	// 启用/禁用音频
	toggleAudio(enabled: boolean) {
		const audioTrack = this.localStream.value?.getAudioTracks()[0];
		if (audioTrack) {
			audioTrack.enabled = enabled;
		}
	}

	// 启用/禁用视频
	toggleVideo(enabled: boolean) {
		const videoTrack = this.localStream.value?.getVideoTracks()[0];
		if (videoTrack) {
			videoTrack.enabled = enabled;
		}
	}
}

// 创建单例
let meetingService: MeetingService | null = null;

export const createMeetingService = (socket: Socket, device: Device): MeetingService => {
	if (!meetingService) {
		meetingService = new MeetingService(socket, device);
	}
	return meetingService;
};

export const getMeetingService = (): MeetingService | null => {
	return meetingService;
};
