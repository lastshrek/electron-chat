<template>
  <div class="h-screen flex flex-col bg-[#17212F]">
    <!-- 头部导航栏 -->
    <div class="bg-[#1E2736] border-b border-[#2A3441]">
      <div class="h-16 px-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button 
            class="text-[#8B9BB4] hover:text-white transition-colors"
            @click="handleExit"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-lg font-semibold text-[#E3E8EF]">{{ meeting.title || '未命名会议' }}</h1>
            <p class="text-sm text-[#8B9BB4]">
              ID: {{ meetingId }} | 
              参会人数: {{ displayParticipants.length }}
            </p>
          </div>
        </div>
        
        <!-- 参会者列表按钮 -->
        <div class="relative group">
          <button class="px-4 py-2 rounded-md bg-[#2A3441] hover:bg-[#343E4D] text-[#E3E8EF] transition-colors">
            参会者 ({{ displayParticipants.length }})
          </button>
          
          <!-- 参会者下拉列表 -->
          <div class="absolute right-0 top-full mt-2 w-72 bg-[#1E2736] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <div class="p-3">
              <div class="text-sm font-medium text-[#E3E8EF] mb-2">参会者列表</div>
              <div class="space-y-2 max-h-[300px] overflow-y-auto">
                <div 
                  v-for="participant in displayParticipants"
                  :key="participant.userId"
                  class="flex items-center justify-between p-2 rounded-md hover:bg-[#2A3441]"
                  :class="{'bg-[#2A3441]/50': participant.userId === currentUserId.value}"
                >
                  <div class="flex items-center gap-2">
                    <img 
                      :src="participant.avatar || '/default-avatar.png'"
                      :alt="participant.username"
                      class="w-8 h-8 rounded-md object-cover bg-[#2A3441]"
                    />
                    <div>
                      <div class="text-sm text-[#E3E8EF]">
                        {{ participant.username }}
                        <span v-if="participant.userId === currentUserId.value" class="text-xs text-[#8B9BB4]">(我)</span>
                      </div>
                      <div class="text-xs text-[#8B9BB4]">
                        {{ new Date(participant.joinTime).toLocaleTimeString() }} 加入
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Mic 
                      v-if="participant.isAudioEnabled" 
                      class="w-4 h-4 text-green-500"
                    />
                    <MicOff 
                      v-else 
                      class="w-4 h-4 text-red-500"
                    />
                    <Video 
                      v-if="participant.isVideoEnabled" 
                      class="w-4 h-4 text-green-500"
                    />
                    <VideoOff 
                      v-else 
                      class="w-4 h-4 text-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="flex-1 p-4 pt-6 relative bg-[#17212F]">
      <!-- 视频网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 所有参与者的视频，包括自己 -->
        <div 
          v-for="participant in meeting.participants" 
          :key="participant.userId"
          class="relative bg-[#1E2736] rounded-lg overflow-hidden aspect-video"
        >
          <!-- 如果是当前用户，显示本地预览 -->
          <template v-if="participant.userId.toString() === currentUserId.toString()">
            <video
              :ref="setLocalVideoRef"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            ></video>
            
            <!-- 视频未开启时显示占位符 -->
            <div 
              v-if="!isVideoEnabled" 
              class="absolute inset-0 flex items-center justify-center bg-[#2A3441]"
            >
              <VideoOff class="w-12 h-12 text-[#8B9BB4]" />
            </div>
            
            <!-- 控制按钮 -->
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
              <div class="flex justify-center gap-2">
                <!-- 麦克风按钮和设备选择 -->
                <template v-if="showControls">
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
                    <div 
                      v-if="showDeviceControls"
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
                    <div 
                      v-if="showDeviceControls"
                      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
                </template>

                <!-- 挂断按钮 -->
                <button 
                  class="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                  @click="handleExit"
                >
                  <PhoneOff class="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </template>
          
          <!-- 如果是其他参与者，显示远程视频 -->
          <template v-else>
            <video
              :ref="'remote-' + participant.userId"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <div class="absolute bottom-2 left-2 flex items-center gap-2">
              <img 
                :src="participant.avatar || '/default-avatar.png'"
                :alt="participant.username"
                class="w-8 h-8 rounded-md object-cover bg-[#2A3441]"
              />
              <div class="text-white text-sm bg-black/50 px-2 py-1 rounded">
                {{ participant.username }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
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

// 修改 Participant 接口
interface Participant {
  userId: string;
  username: string;
  avatar: string;  // 添加头像字段
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  joinTime: Date;
}

// 修改状态定义
const meeting = ref<{
  id: string;
  title: string;
  createdAt: Date;
  participants: Participant[];
  hostId: string;
}>({
  id: meetingId,
  title: '',
  createdAt: new Date(),
  participants: [],
  hostId: ''
});

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

// 添加当前用户ID的状态
const currentUserId = ref(JSON.parse(localStorage.getItem('user_info') || '{}').user_id || '');

// 修改计算属性，添加一个用于显示的参与者列表
const displayParticipants = computed(() => {
  // 使用 Map 来去重，以 userId 为键
  const uniqueParticipants = new Map();
  
  // 添加所有参与者，包括当前用户
  meeting.value.participants.forEach(p => {
    if (!uniqueParticipants.has(p.userId) || 
        p.joinTime > uniqueParticipants.get(p.userId).joinTime) {
      uniqueParticipants.set(p.userId, p);
    }
  });
  
  // 转换回数组
  return Array.from(uniqueParticipants.values());
});

// 保持 remoteParticipants 用于视频网格显示
const remoteParticipants = computed(() => {
  return displayParticipants.value.filter(p => p.userId !== currentUserId.value);
});

// 添加环境检查函数
const isElectronApp = () => {
  return window?.electron !== undefined;
};

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
const toggleVideo = async () => {
  console.log(TAG, 'toggleVideo');
  if (!localStream.value) {
    try {
      // 如果没有流，尝试获取新的视频流
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      if (localStream.value) {
        localStream.value.addTrack(videoTrack);
      } else {
        localStream.value = stream;
      }
      
      if (localVideo.value) {
        localVideo.value.srcObject = localStream.value;
      }
      
      isVideoEnabled.value = true;
    } catch (error) {
      console.error(TAG, '获取视频流失败:', error);
      return;
    }
  } else {
    const videoTrack = localStream.value.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isVideoEnabled.value = videoTrack.enabled;
      console.log(TAG, '视频状态:', isVideoEnabled.value ? '已开启' : '已关闭');
    }
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
    // 如果是浏览器环境，直接请求默认设备
    if (!isElectronApp()) {
      console.log(TAG, '浏览器环境，使用默认设备');
      localStream.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      // 确保视频元素存在并设置流
      await nextTick();
      if (localVideo.value) {
        localVideo.value.srcObject = localStream.value;
        console.log(TAG, '本地视频流已设置');
        
        // 添加视频元素的事件监听
        localVideo.value.onloadedmetadata = () => {
          console.log(TAG, '视频元数据已加载');
          localVideo.value?.play().catch(e => console.error('视频播放失败:', e));
        };
      } else {
        console.error(TAG, '未找到本地视频元素');
      }

      // 更新按钮状态
      const audioTrack = localStream.value.getAudioTracks()[0];
      const videoTrack = localStream.value.getVideoTracks()[0];
      isAudioEnabled.value = audioTrack?.enabled ?? false;
      isVideoEnabled.value = videoTrack?.enabled ?? false;

      if (isAudioEnabled.value) {
        startAudioMonitoring();
      }

      return localStream.value;
    }

    // Electron 环境下的设备检查逻辑保持不变
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

// 修改 joinMeeting 函数
const joinMeeting = async () => {
  try {
    // 先获取本地流，只在electron环境下处理
    if (isElectronApp()) {
      // 检查可用设备
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      const hasVideo = devices.some(device => device.kind === 'videoinput');

      // 构建媒体约束
      const constraints: MediaStreamConstraints = {
        audio: hasAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: hasVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      console.log(TAG, '加入会议时使用的媒体约束:', constraints);

      // 获取媒体流
      localStream.value = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 设置视频元素
      if (localVideo.value && localStream.value) {
        localVideo.value.srcObject = localStream.value;
        console.log(TAG, '本地视频流已设置');
      }

      // 更新设备状态
      const audioTrack = localStream.value.getAudioTracks()[0];
      const videoTrack = localStream.value.getVideoTracks()[0];
      isAudioEnabled.value = !!audioTrack;
      isVideoEnabled.value = !!videoTrack;

      // 如果有音频，启动音频监测
      if (audioTrack) {
        startAudioMonitoring();
      }
    }

    // 加入会议
    socket.value?.emit('join_meeting', { meetingId }, (response: any) => {
      if (!response || response.error) {
        console.error(TAG, '加入会议失败:', response?.error);
        toast({
          variant: 'destructive',
          title: '加入失败',
          description: response?.error || '加入会议失败，请稍后重试'
        });
        // 不要自动返回到会议列表页面
        return;
      }

      console.log(TAG, '加入会议成功', response);
      console.log(TAG, '当前用户ID:', currentUserId.value);
      
      // 更新会议信息，包括自己和其他参与者
      const allParticipants = response.participants.reduce((acc: Participant[], p: any) => {
        // 检查是否已存在
        if (!acc.some(existing => existing.userId === p.userId)) {
          console.log(TAG, '添加参与者:', p.userId, p.username);
          acc.push({
            userId: p.userId,
            username: p.username,
            avatar: p.avatar || '',
            isAudioEnabled: true,
            isVideoEnabled: true,
            joinTime: new Date()
          });
        }
        return acc;
      }, []);

      meeting.value = {
        ...meeting.value,
        title: response.meeting?.title || '未命名会议',
        hostId: response.meeting?.hostId || '',
        participants: allParticipants
      };

      // 只为远程参与者创建连接
      allParticipants
        .filter(p => p.userId !== currentUserId.value)
        .forEach(peer => {
          createPeerConnection(peer.userId);
        });
    });
  } catch (error) {
    console.error(TAG, '加入会议失败:', error);
    toast({
      variant: 'destructive',
      title: '加入失败',
      description: error instanceof Error ? error.message : '加入会议失败，请稍后重试'
    });
    // 只在特定错误情况下返回
    if (error instanceof Error && error.message.includes('未登录')) {
      router.push('/meeting');
    }
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
    // 关闭当前窗口而不是跳转
    window.close();
  } catch (error) {
    console.error('关闭会议服务失败:', error);
    // 如果关闭失败，也尝试关闭窗口
    window.close();
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

// 添加会议信息获取函数
const fetchMeetingInfo = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    meeting.value = {
      ...data,
      participants: data.participants.map((p: any) => ({
        userId: p.user.id,
        username: p.user.username,
        avatar: p.user.avatar || '',  // 添加头像
        isAudioEnabled: true,
        isVideoEnabled: true,
        joinTime: new Date(p.joinedAt)
      }))
    };

    console.log(TAG, '会议信息:', meeting.value);
  } catch (error) {
    console.error(TAG, '获取会议信息失败:', error);
    toast({
      variant: 'destructive',
      title: '获取会议信息失败',
      description: '无法获取会议信息，请稍后重试'
    });
  }
};

// 修改 socket 事件处理
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
      transports: ['websocket', 'polling'],
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

    // 修改新参与者加入的处理
    socket.value.on('new_participant', (data: any) => {
      console.log(TAG, '新人加入会议室:', data);
      
      // 如果是自己，不添加到参与者列表
      if (data.userId === currentUserId.value) {
        return;
      }
      
      // 更新或添加参与者
      const participantIndex = meeting.value.participants
        .findIndex(p => p.userId === data.userId);
      
      const newParticipant = {
        userId: data.userId,
        username: data.username,
        avatar: data.avatar || '',
        isAudioEnabled: true,
        isVideoEnabled: true,
        joinTime: new Date()
      };

      if (participantIndex === -1) {
        // 参与者不存在，添加新参与者
        meeting.value.participants.push(newParticipant);
        
        // 显示通知
        toast({
          title: '新参与者加入',
          description: `${data.username} 已加入会议`,
          duration: 3000
        });

        // 创建连接
        createPeerConnection(data.userId);
      } else {
        // 参与者已存在，更新信息
        meeting.value.participants[participantIndex] = {
          ...meeting.value.participants[participantIndex],
          ...newParticipant,
          // 保留原有的音视频状态
          isAudioEnabled: meeting.value.participants[participantIndex].isAudioEnabled,
          isVideoEnabled: meeting.value.participants[participantIndex].isVideoEnabled
        };
      }
    });

    // 修改参与者离开的处理，确保正确移除
    socket.value.on('participant_left', (data: any) => {
      console.log(TAG, '参与者离开:', data);
      
      const participantIndex = meeting.value.participants
        .findIndex(p => p.userId === data.userId);
      
      if (participantIndex !== -1) {
        const participant = meeting.value.participants[participantIndex];
        
        // 移除参与者
        meeting.value.participants.splice(participantIndex, 1);

        // 显示通知
        toast({
          title: '参与者离开',
          description: `${participant.username} 已离开会议`,
          duration: 3000
        });

        // 清理连接
        if (peerConnections.has(data.userId)) {
          peerConnections.get(data.userId)?.close();
          peerConnections.delete(data.userId);
        }
      }
    });

    // 参与者媒体状态变更事件
    socket.value.on('media_state_changed', (data: any) => {
      const participant = meeting.value.participants
        .find(p => p.userId === data.userId);
      
      if (participant) {
        if ('isAudioEnabled' in data) {
          participant.isAudioEnabled = data.isAudioEnabled;
        }
        if ('isVideoEnabled' in data) {
          participant.isVideoEnabled = data.isVideoEnabled;
        }
      }
    });
  } catch (error) {
    console.error(TAG, '初始化 Socket 失败:', error);
    throw error;
  }
};

// 修改 loadMediaDevices 函数
const loadMediaDevices = async () => {
  if (!isElectronApp()) {
    console.log(TAG, '浏览器环境，跳过设备检查');
    return;
  }

  try {
    // 先尝试枚举设备，不请求权限
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(TAG, '初始设备列表:', devices);

    // 检查是否有可用设备，并记录设备ID
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log(TAG, '可用音频设备:', audioDevices.length);
    console.log(TAG, '可用视频设备:', videoDevices.length);

    // 构建媒体约束，使用找到的第一个设备
    const constraints: MediaStreamConstraints = {
      audio: audioDevices.length > 0 ? {
        deviceId: audioDevices[0].deviceId,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } : false,
      video: videoDevices.length > 0 ? {
        deviceId: videoDevices[0].deviceId,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false
    };

    console.log(TAG, '使用的媒体约束:', constraints);

    // 请求设备权限
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.value = stream;
      
      // 获取并记录实际的轨道信息
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      console.log(TAG, '获取到的音频轨道:', audioTrack?.label);
      console.log(TAG, '获取到的视频轨道:', videoTrack?.label);

      // 更新设备状态
      isAudioEnabled.value = !!audioTrack;
      isVideoEnabled.value = !!videoTrack;

      // 如果获取到了流，设置到视频元素
      if (localVideo.value) {
        localVideo.value.srcObject = stream;
        console.log(TAG, '视频元素已设置');
      }

      // 如果有音频轨道，启动音频监测
      if (audioTrack) {
        startAudioMonitoring();
      }

      // 保存设备列表
      audioDevices.value = audioDevices;
      videoDevices.value = videoDevices;

      // 设置默认设备
      if (audioDevices.length > 0) {
        selectedAudioDevice.value = audioDevices[0].deviceId;
      }
      if (videoDevices.length > 0) {
        selectedVideoDevice.value = videoDevices[0].deviceId;
      }

    } catch (error) {
      console.warn(TAG, '获取媒体流失败:', error);
      // 不抛出错误，让用户仍然可以加入会议
      toast({
        variant: 'default',
        title: '设备访问受限',
        description: '无法访问摄像头或麦克风，但您仍可以加入会议'
      });
    }

  } catch (error) {
    console.error(TAG, '加载媒体设备失败:', error);
    // 不抛出错误，让用户仍然可以加入会议
    toast({
      variant: 'destructive',
      title: '设备访问失败',
      description: '无法访问媒体设备，但您仍可以加入会议'
    });
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

// 修改设备选择按钮的显示逻辑
const showDeviceControls = computed(() => {
  return isElectronApp();
});

// 修改 onMounted
onMounted(async () => {
  try {
    // 如果是 Electron 环境才加载设备列表
    if (isElectronApp()) {
      await loadMediaDevices();
    }
    initializeSocket();
  } catch (error) {
    console.error(TAG, '初始化失败:', error);
    toast({
      variant: 'destructive',
      title: '初始化失败',
      description: '初始化失败，请刷新页面重试'
    });
  }
});

// 修改控制按钮的显示逻辑
const showControls = computed(() => {
  return isElectronApp();
});

// 在模板中添加 ref 回调
const setLocalVideoRef = (el: HTMLVideoElement | null) => {
  if (el && localStream.value) {
    el.srcObject = localStream.value;
    localVideo.value = el;
    console.log(TAG, '本地视频元素已设置');
  }
};
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
  background: #2A3441;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #3A4555;
  border-radius: 2px;
}

/* 添加阴影效果 */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* 移除渐变背景，使用纯色 */
.bg-[#1E2736] {
  background-color: #1E2736;
}
</style> 