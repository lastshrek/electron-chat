<template>
  <div class="h-screen flex flex-col bg-gray-900">
    <!-- 主体内容 -->
    <div class="flex-1 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        <!-- 本地视频 -->
        <div class="absolute top-4 right-4 w-72">
          <div class="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref="localVideo"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            ></video>
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div class="flex justify-center gap-2">
                <!-- 麦克风按钮和设备选择 -->
                <div class="relative group">
                  <button 
                    class="p-3 rounded-full hover:bg-gray-700/50 transition-colors relative"
                    :class="isAudioEnabled ? 'bg-blue-500' : 'bg-red-500'"
                    @click="toggleAudio"
                  >
                    <Mic v-if="isAudioEnabled" class="w-5 h-5 text-white" />
                    <MicOff v-else class="w-5 h-5 text-white" />
                    
                    <!-- 音频活动指示器 -->
                    <div v-if="isAudioEnabled" 
                      class="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                      :class="isAudioActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'"
                    ></div>
                    
                    <!-- 音量条 -->
                    <div v-if="isAudioEnabled" 
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-1 bg-black/50 rounded overflow-hidden"
                      style="height: 40px;"
                    >
                      <div 
                        class="absolute bottom-0 left-0 right-0 bg-green-500 transition-all duration-100"
                        :style="{ height: `${(audioLevel / 255) * 100}%` }"
                      ></div>
                    </div>
                  </button>
                  
                  <!-- 麦克风设备选择下拉菜单 -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="bg-black/90 rounded-lg p-2 shadow-lg min-w-[200px]">
                      <div class="text-white text-xs mb-2">选择麦克风</div>
                      <div class="space-y-1 max-h-[200px] overflow-y-auto">
                        <button
                          v-for="device in audioDevices"
                          :key="device.deviceId"
                          class="w-full text-left px-2 py-1 rounded text-sm text-white hover:bg-white/10 transition-colors"
                          :class="selectedAudioDevice === device.deviceId ? 'bg-blue-500/50' : ''"
                          @click="handleAudioDeviceChange(device.deviceId)"
                        >
                          {{ device.label || `麦克风 ${device.deviceId.slice(0, 8)}...` }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 摄像头按钮和设备选择 -->
                <div class="relative group">
                  <button 
                    class="p-3 rounded-full hover:bg-gray-700/50 transition-colors"
                    :class="isVideoEnabled ? 'bg-blue-500' : 'bg-red-500'"
                    @click="toggleVideo"
                  >
                    <Video v-if="isVideoEnabled" class="w-5 h-5 text-white" />
                    <VideoOff v-else class="w-5 h-5 text-white" />
                  </button>
                  
                  <!-- 摄像头设备选择下拉菜单 -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="bg-black/90 rounded-lg p-2 shadow-lg min-w-[200px]">
                      <div class="text-white text-xs mb-2">选择摄像头</div>
                      <div class="space-y-1 max-h-[200px] overflow-y-auto">
                        <button
                          v-for="device in videoDevices"
                          :key="device.deviceId"
                          class="w-full text-left px-2 py-1 rounded text-sm text-white hover:bg-white/10 transition-colors"
                          :class="selectedVideoDevice === device.deviceId ? 'bg-blue-500/50' : ''"
                          @click="handleVideoDeviceChange(device.deviceId)"
                        >
                          {{ device.label || `摄像头 ${device.deviceId.slice(0, 8)}...` }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 挂断按钮 -->
                <button 
                  class="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                  @click="handleExit"
                >
                  <PhoneOff class="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div class="absolute top-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
              我
            </div>
          </div>
        </div>

        <!-- 远程视频网格 -->
        <div 
          v-for="participant in meeting?.participants || []" 
          :key="participant.user.id"
          class="relative bg-black rounded-lg overflow-hidden aspect-video"
        >
          <video
            :ref="'remote-' + participant.user.id"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          ></video>
          <div class="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
            {{ participant.user.username }}
            <span class="text-xs opacity-75">({{ participant.role }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 头部信息 -->
    <div class="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white">
      <div class="flex items-center gap-4">
        <button 
          class="text-white/80 hover:text-white"
          @click="handleExit"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-lg font-semibold">{{ meeting?.title || '加载中...' }}</h1>
          <p class="text-sm text-white/60">ID: {{ meetingId }}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-white/60">
          参会人数: {{ meeting?._count?.participants ?? 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast';
import {  type MeetingService } from '@/services/meeting';
import type { Meeting } from '@/types/api';
import io, { Socket } from 'socket.io-client';
const TAG = '🤼‍♂️ MeetingRoom';
const route = useRoute();
const router = useRouter();
const { toast } = useToast();
const meetingId = route.params.id as string;

const meeting = ref<Meeting | null>(null);
const meetingService = ref<MeetingService | null>(null);
const localVideo = ref<HTMLVideoElement | null>(null);
const isAudioEnabled = ref(true);
const isVideoEnabled = ref(true);
const socket = ref<Socket | null>(null);
const audioDevices = ref<MediaDeviceInfo[]>([]);
const videoDevices = ref<MediaDeviceInfo[]>([]);
const selectedAudioDevice = ref('');
const selectedVideoDevice = ref('');
const localStream = ref<MediaStream | null>(null);
const peers = ref<{ userId: string; username: string; isAudioEnabled: boolean }[]>([]);
const peerConnections = new Map<string, RTCPeerConnection>()
// 添加音频监测相关的变量
const audioContext = ref<AudioContext | null>(null);
const audioAnalyser = ref<AnalyserNode | null>(null);
const isAudioActive = ref(false);
const audioLevel = ref(0);

// 切换音频
const toggleAudio = () => {
  if (localStream.value) {
    const audioTrack = localStream.value.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    isAudioEnabled.value = audioTrack.enabled;
    
    // 根据状态启动或停止音频监测
    if (audioTrack.enabled) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }
  }
};

// 切换视频
const toggleVideo = () => {
  console.log(TAG, 'toggleVideo');
  if (localStream.value) {
    const videoTrack = localStream.value.getVideoTracks()[0]
    videoTrack.enabled = !videoTrack.enabled
    isVideoEnabled.value = videoTrack.enabled
  }
};

// 检查媒体设备是否可用
const checkMediaDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    console.log(TAG, '可用音频设备:', audioDevices);
    console.log(TAG, '可用视频设备:', videoDevices);

    return {
      hasAudio: audioDevices.length > 0,
      hasVideo: videoDevices.length > 0
    };
  } catch (error) {
    console.error(TAG, '检查媒体设备失败:', error);
    throw error;
  }
};

// 获取本地媒体流
const getLocalStream = async () => {
  try {
    // 先检查设备可用性
    const { hasAudio, hasVideo } = await checkMediaDevices();
    console.log(TAG, '设备检查结果:', { hasAudio, hasVideo });

    if (!hasAudio && !hasVideo) {
      throw new Error('未检测到摄像头和麦克风设备');
    }

    // 尝试获取媒体流，如果某个设备不可用则不请求该设备
    const constraints: MediaStreamConstraints = {
      audio: hasAudio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } : false,
      video: hasVideo ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      } : false
    };

    console.log(TAG, '尝试获取媒体流，约束:', constraints);
    localStream.value = await navigator.mediaDevices.getUserMedia(constraints);

    if (localVideo.value) {
      localVideo.value.srcObject = localStream.value;
      console.log(TAG, '媒体流已设置到视频元素');
    }

    // 更新按钮状态
    if (hasAudio) {
      const audioTrack = localStream.value.getAudioTracks()[0];
      isAudioEnabled.value = audioTrack?.enabled ?? false;
      if (isAudioEnabled.value) {
        startAudioMonitoring();
      }
    }
    if (hasVideo) {
      const videoTrack = localStream.value.getVideoTracks()[0];
      isVideoEnabled.value = videoTrack?.enabled ?? false;
    }

    return localStream.value;
  } catch (error) {
    console.error(TAG, '获取本地媒体流失败:', error);
    let errorMessage = '无法访问摄像头或麦克风';

    if (error instanceof Error) {
      switch (error.name) {
        case 'NotFoundError':
          errorMessage = '未找到可用的摄像头或麦克风设备';
          break;
        case 'NotAllowedError':
          errorMessage = '请允许访问摄像头和麦克风';
          break;
        case 'NotReadableError':
          errorMessage = '无法访问摄像头或麦克风，可能被其他应用占用';
          break;
        case 'OverconstrainedError':
          errorMessage = '设备不支持请求的媒体约束';
          break;
        default:
          errorMessage = `获取媒体设备失败: ${error.message}`;
      }
    }

    toast({
      variant: 'destructive',
      title: '设备访问失败',
      description: errorMessage
    });

    throw error;
  }
};

// 修改 joinMeeting 函数的错误处理
const joinMeeting = async () => {
  try {
    // 获取本地流
    const stream = await getLocalStream();
    if (!stream) {
      throw new Error('无法获取媒体流');
    }

    // 加入会议
    socket.value?.emit('join_meeting', { meetingId }, (response) => {
      if (!response || response.error) {
        throw new Error(response?.error || '加入会议失败');
      }

      peers.value = response.participants.map((p: any) => ({
        userId: p.userId,
        username: p.username,
        isAudioEnabled: true
      }));
      
      // 为每个现有参与者创建连接
      peers.value.forEach(peer => {
        createPeerConnection(peer.userId);
      });
    });
  } catch (error) {
    console.error(TAG, '加入会议失败:', error);

    // 如果是设备错误，显示详细的错误信息和建议
    if (error instanceof Error && ['NotFoundError', 'NotAllowedError', 'NotReadableError'].includes(error.name)) {
      toast({
        variant: 'default',
        title: '设备访问提示',
        description: `请确保：
          1. 设备已正确连接并工作正常
          2. 已在浏览器设置中允许访问摄像头和麦克风
          3. 设备未被其他应用程序占用
          4. 如果问题持续，请尝试重新插拔设备或重启浏览器`
      });
    } else {
      toast({
        variant: 'destructive',
        title: '加入失败',
        description: error instanceof Error ? error.message : '加入会议失败，请稍后重试'
      });
    }

    // 可以选择退出会议
    router.push('/meeting');
  }
};

// 创建对等连接
const createPeerConnection = async (peerId: string) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })

  peerConnections.set(peerId, pc)

  // 添加本地流
  localStream.value?.getTracks().forEach(track => {
    pc.addTrack(track, localStream.value!)
  })

  // 处理远程流
  pc.ontrack = (event) => {
    const remoteVideo = document.querySelector(`#remote-${peerId}`) as HTMLVideoElement
    if (remoteVideo) {
      remoteVideo.srcObject = event.streams[0]
    }
  }

  // 处理ICE候选
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.value?.emit('ice_candidate', {
        to: peerId,
        candidate: event.candidate
      })
    }
  }

  // 创建并发送offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.value?.emit('offer', {
    to: peerId,
    offer
  })

  return pc
}

// 退出会议
const handleExit = () => {
  try {
    if (meetingService.value) {
      meetingService.value.close();
      meetingService.value = null;
    }
  } catch (error) {
    console.error('关闭会议服务失败:', error);
  } finally {
    router.push('/meeting');
  }
};

// 组件卸载时清理资源
onUnmounted(() => {
  try {
    if (meetingService.value) {
      meetingService.value.close();
      meetingService.value = null;
    }
    
    if (localVideo.value) {
      localVideo.value.srcObject = null;
    }
  } catch (error) {
    console.error('清理资源失败:', error);
  }
  stopAudioMonitoring();
});

const initializeSocket = () => {
  try {
    // 获取 token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    // 创建会议专用的 socket 连接
    socket.value = io(import.meta.env.VITE_WS_URL_MEETINGS, {
      path: '/socket.io',
      auth: {
        token: `Bearer ${token}`
      },
      query: { meetingId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      // 添加跨域配置
      withCredentials: true,
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    });

    // 添加连接事件监听
    socket.value?.on('connect_error', (error) => {
      console.error(TAG, 'Socket 连接错误:', JSON.stringify(error));      
      toast({
        variant: 'destructive',
        title: '连接失败',
        description: '无法连接到会议服务器'
      });
    });

    socket.value.on('error', (error) => {
      console.error(TAG, 'Socket 错误:', error);
    });

    socket.value.on('connect', () => {
      console.log(TAG, '会议室连接成功')
      joinMeeting()
    })
  } catch (error) {
    console.error(TAG, '初始化 Socket 失败:', error);
    throw error;
  }
};

// 添加设备选择相关的代码
const loadMediaDevices = async () => {
  try {
    // 请求权限
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .catch(error => {
        console.log(TAG, '请求权限时出错:', error);
        // 如果视频不可用，尝试只请求音频
        return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      });

    // 枚举设备
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // 过滤并保存设备列表
    audioDevices.value = devices.filter(device => device.kind === 'audioinput');
    videoDevices.value = devices.filter(device => device.kind === 'videoinput');

    console.log(TAG, '音频设备列表:', audioDevices.value.map(d => ({
      deviceId: d.deviceId,
      label: d.label,
      groupId: d.groupId
    })));
    console.log(TAG, '视频设备列表:', videoDevices.value.map(d => ({
      deviceId: d.deviceId,
      label: d.label,
      groupId: d.groupId
    })));

    // 设置默认设备
    if (audioDevices.value.length) {
      selectedAudioDevice.value = audioDevices.value[0].deviceId;
    }
    if (videoDevices.value.length) {
      selectedVideoDevice.value = videoDevices.value[0].deviceId;
    }
  } catch (error) {
    console.error(TAG, '加载媒体设备失败:', error);
  }
};

// 修改设备切换函数，直接接收 deviceId 参数
const handleAudioDeviceChange = async (deviceId: string) => {
  try {
    if (!deviceId) return;
    
    selectedAudioDevice.value = deviceId;
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: false
    });

    // 停止旧的音频轨道
    localStream.value?.getAudioTracks().forEach(track => track.stop());

    // 替换音频轨道
    const audioTrack = newStream.getAudioTracks()[0];
    if (localStream.value) {
      const oldTrack = localStream.value.getAudioTracks()[0];
      if (oldTrack) {
        localStream.value.removeTrack(oldTrack);
      }
      localStream.value.addTrack(audioTrack);
    }

    isAudioEnabled.value = true;
  } catch (error) {
    console.error(TAG, '切换音频设备失败:', error);
    toast({
      variant: 'destructive',
      title: '切换失败',
      description: '切换音频设备失败，请重试'
    });
  }
};

const handleVideoDeviceChange = async (deviceId: string) => {
  try {
    if (!deviceId) return;
    
    selectedVideoDevice.value = deviceId;
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // 停止旧的视频轨道
    localStream.value?.getVideoTracks().forEach(track => track.stop());

    // 替换视频轨道
    const videoTrack = newStream.getVideoTracks()[0];
    if (localStream.value) {
      const oldTrack = localStream.value.getVideoTracks()[0];
      if (oldTrack) {
        localStream.value.removeTrack(oldTrack);
      }
      localStream.value.addTrack(videoTrack);
    }

    // 更新视频预览
    if (localVideo.value) {
      localVideo.value.srcObject = localStream.value;
    }

    isVideoEnabled.value = true;
  } catch (error) {
    console.error(TAG, '切换视频设备失败:', error);
    toast({
      variant: 'destructive',
      title: '切换失败',
      description: '切换视频设备失败，请重试'
    });
  }
};

// 在 script 部分添加新的方法
const openCamera = async () => {
  try {
    if (!selectedVideoDevice.value) {
      toast({
        variant: 'destructive',
        title: '无法开启摄像头',
        description: '请先选择一个摄像头设备'
      });
      return;
    }

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: selectedVideoDevice.value },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    const videoTrack = newStream.getVideoTracks()[0];
    
    if (localStream.value) {
      // 如果已有视频轨道，先移除
      const oldTrack = localStream.value.getVideoTracks()[0];
      if (oldTrack) {
        oldTrack.stop();
        localStream.value.removeTrack(oldTrack);
      }
      localStream.value.addTrack(videoTrack);
    } else {
      localStream.value = newStream;
    }

    if (localVideo.value) {
      localVideo.value.srcObject = localStream.value;
    }

    isVideoEnabled.value = true;
    console.log(TAG, '摄像头已开启');
  } catch (error) {
    console.error(TAG, '开启摄像头失败:', error);
    toast({
      variant: 'destructive',
      title: '开启失败',
      description: '无法开启摄像头，请检查设备连接'
    });
  }
};

const closeCamera = () => {
  try {
    if (localStream.value) {
      const videoTrack = localStream.value.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.value.removeTrack(videoTrack);
      }
    }
    
    if (localVideo.value) {
      localVideo.value.srcObject = localStream.value;
    }

    isVideoEnabled.value = false;
    console.log(TAG, '摄像头已关闭');
  } catch (error) {
    console.error(TAG, '关闭摄像头失败:', error);
  }
};

// 添加音频监测功能
const startAudioMonitoring = () => {
  try {
    if (!localStream.value) return;
    
    const audioTrack = localStream.value.getAudioTracks()[0];
    if (!audioTrack) {
      console.log(TAG, '未检测到音频轨道');
      return;
    }

    audioContext.value = new AudioContext();
    const source = audioContext.value.createMediaStreamSource(localStream.value);
    audioAnalyser.value = audioContext.value.createAnalyser();
    audioAnalyser.value.fftSize = 256;
    source.connect(audioAnalyser.value);

    const dataArray = new Uint8Array(audioAnalyser.value.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!audioAnalyser.value) return;
      
      audioAnalyser.value.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      audioLevel.value = average;
      
      // 设置一个阈值来判断是否在说话
      isAudioActive.value = average > 20;
      
      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
    console.log(TAG, '音频监测已启动');
  } catch (error) {
    console.error(TAG, '启动音频监测失败:', error);
  }
};

// 停止音频监测
const stopAudioMonitoring = () => {
  try {
    if (audioContext.value) {
      audioContext.value.close();
      audioContext.value = null;
    }
    audioAnalyser.value = null;
    isAudioActive.value = false;
    audioLevel.value = 0;
  } catch (error) {
    console.error(TAG, '停止音频监测失败:', error);
  }
};

onMounted(async () => {
  try {
    await loadMediaDevices(); // 先加载设备列表
    initializeSocket();      // 然后初始化连接
  } catch (error) {
    console.error(TAG, '初始化失败:', error);
    toast({
      variant: 'destructive',
      title: '初始化失败',
      description: '无法初始化设备，请检查设备连接并刷新页面'
    });
  }
});
</script>

<style scoped>
/* 添加一些过渡动画 */
.group:hover .group-hover\:opacity-100 {
  transition-delay: 200ms;
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style> 