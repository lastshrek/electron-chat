<template>
  <div class="h-full flex flex-col">
      <!-- 头部 -->
      <div class="flex-shrink-0 p-4 border-b">
        <h1 class="text-xl font-semibold">在线会议</h1>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 p-6">
        <!-- 创建会议卡片 -->
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
          <div class="text-center mb-6">
            <Video class="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 class="text-2xl font-semibold mb-2">创建会议</h2>
            <p class="text-gray-500 mb-6">填写会议标题并创建</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              会议标题
            </label>
            <input
              v-model="meetingTitle"
              type="text"
              placeholder="请输入会议标题"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :disabled="isCreating"
              @keyup.enter="handleCreateMeeting"
            />
          </div>

          <button
            class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            @click="handleCreateMeeting"
            :disabled="isCreating || !meetingTitle.trim()"
          >
            <Loader2 v-if="isCreating" class="w-5 h-5 mr-2 animate-spin" />
            <Plus v-else class="w-5 h-5 mr-2" />
            {{ isCreating ? '创建中...' : '创建会议' }}
          </button>
        </div>

        <!-- 会议列表 -->
        <div class="max-w-md mx-auto mt-8 w-full">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium">我的会议</h3>
            <!-- 加载状态 -->
            <div v-if="isLoading" class="text-sm text-gray-500">
              加载中...
            </div>
          </div>

          <!-- 加载中状态 -->
          <div v-if="isLoading" class="flex justify-center py-8">
            <Loader2 class="w-8 h-8 animate-spin text-gray-400" />
          </div>

          <!-- 空状态 -->
          <div 
            v-else-if="meetings.length === 0" 
            class="text-center py-8 text-gray-500 border rounded-lg"
          >
            <Video class="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>暂无会议</p>
          </div>

          <!-- 会议列表 -->
          <div v-else class="space-y-4">
            <div
              v-for="meeting in meetings"
              :key="meeting.id"
              class="bg-white rounded-lg shadow-sm border p-4"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ meeting.title }}</p>
                  <p class="text-sm text-gray-500">会议 ID: {{ meeting.id }}</p>
                  <p class="text-sm text-gray-500">开始时间: {{ formatDate(meeting.startTime) }}</p>
                  <p class="text-sm text-gray-500">
                    创建者: {{ meeting.creator.username }}
                    <img 
                      :src="meeting.creator.avatar" 
                      :alt="meeting.creator.username"
                      class="w-4 h-4 rounded-full inline-block ml-1"
                    />
                  </p>
                  <p class="text-sm text-gray-500">
                    参会人数: {{ meeting._count.participants }}
                  </p>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-xs mb-2" :class="{
                    'text-green-500': meeting.status === 'ACTIVE',
                    'text-gray-500': meeting.status === 'ENDED'
                  }">
                    {{ meeting.status === 'ACTIVE' ? '进行中' : '已结束' }}
                  </span>
                  <button
                    class="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                    @click="handleJoinMeeting(meeting.id)"
                    :disabled="meeting.status === 'ENDED'"
                  >
                    加入会议
                    <span class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      将在新窗口中打开
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 分页信息 -->
            <div class="flex justify-between items-center mt-4 text-sm text-gray-500">
              <span>共 {{ totalMeetings }} 个会议</span>
              <div class="flex items-center gap-2">
                <button 
                  class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  :disabled="currentPage === 1"
                  @click="fetchMeetings(currentPage - 1)"
                >
                  上一页
                </button>
                <span>{{ currentPage }} / {{ totalPages }}</span>
                <button 
                  class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                  :disabled="currentPage === totalPages"
                  @click="fetchMeetings(currentPage + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, markRaw } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Video, Plus, Loader2 } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast';
import { authApi } from '@/api/auth';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';

interface Meeting {
  id: string;
  title: string;
  status: 'ACTIVE' | 'ENDED';
  startTime: string;
  creator: {
    id: number;
    username: string;
    avatar: string;
  };
  participants: Array<{
    user: {
      id: number;
      username: string;
      avatar: string;
    };
    role: 'HOST' | 'PARTICIPANT';
    joinTime: string;
  }>;
  _count: {
    participants: number;
  };
}

const meetings = ref<Meeting[]>([]);
const isCreating = ref(false);
const meetingTitle = ref('');
const isLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalMeetings = ref(0);
const { toast } = useToast();
const router = useRouter();

// 添加状态跟踪当前会议窗口
const meetingWindow = ref<Window | null>(null);

// 添加会议状态管理
const MEETING_STATUS_KEY = 'meeting_status';

// 修改状态管理
const isInMeeting = ref(localStorage.getItem(MEETING_STATUS_KEY) === 'true');

// 修改状态设置函数
const setMeetingStatus = (status: boolean) => {
  isInMeeting.value = status;
  localStorage.setItem(MEETING_STATUS_KEY, status.toString());
};

// 获取会议列表
const fetchMeetings = async (page = 1) => {
  try {
    isLoading.value = true;
    const response = await authApi.getMeetings({ page, limit: 10 });
    meetings.value = response.meetings;
    currentPage.value = response.pagination.page;
    totalPages.value = response.pagination.totalPages;
    totalMeetings.value = response.pagination.total;
  } catch (error) {
    console.error('获取会议列表失败:', error);
    toast({
      variant: 'destructive',
      title: '获取失败',
      description: '获取会议列表失败，请稍后重试',
    });
  } finally {
    isLoading.value = false;
  }
};

// 创建会议
const handleCreateMeeting = async () => {
  if (!meetingTitle.value.trim()) return;
  
  try {
    isCreating.value = true;
    const meeting = await authApi.createMeeting(meetingTitle.value.trim());
    if (meeting) {
      toast({
        title: '创建成功',
        description: `会议"${meeting.title}"已创建`,
      });
      meetingTitle.value = ''; // 清空输入
      // 刷新会议列表
      await fetchMeetings();
    }
  } catch (error) {
    console.error('创建会议失败:', error);
    toast({
      variant: 'destructive',
      title: '创建失败',
      description: '请稍后重试',
    });
  } finally {
    isCreating.value = false;
  }
};

// 修改加入会议方法
const handleJoinMeeting = (meetingId: string) => {
  // 检查是否已在会议中
  if (isInMeeting.value) {
    toast({
      title: '已在会议中',
      description: '请先退出当前会议再加入新会议',
      variant: 'default',
      action: markRaw(Button),
      actionProps: {
        variant: 'outline',
        size: 'sm',
        onClick: () => {},
        children: '我知道了'
      }
    });
    return;
  }

  try {
    const meetingUrl = `${window.location.origin}/#/meeting/${meetingId}`;

    // 区分 Electron 和浏览器环境
    if (window?.electron) {
      // 标记为已在会议中
      setMeetingStatus(true);

      // 使用一次性监听器
      const handleMeetingClosed = () => {
        setMeetingStatus(false);
      };

      // 添加事件监听
      window.electron.ipcRenderer.on('meeting-window-closed', handleMeetingClosed);
      
      // Electron 环境下直接打开链接，主进程会处理
      window.open(meetingUrl);
    } else {
      // 浏览器环境下的处理保持不变
      const windowFeatures = 'width=1280,height=720,resizable=yes';
      meetingWindow.value = window.open(meetingUrl, '_blank', windowFeatures);

      if (meetingWindow.value === null) {
        toast({
          title: '窗口被拦截',
          description: '请允许浏览器打开弹出窗口，然后重试',
          variant: 'default',
          duration: 5000,
          action: markRaw(Button),
          actionProps: {
            variant: 'outline',
            size: 'sm',
            onClick: () => handleJoinMeeting(meetingId),
            children: '重试'
          }
        });
        return;
      }

      // 监听窗口状态
      const checkWindowInterval = setInterval(() => {
        if (meetingWindow.value?.closed) {
          clearInterval(checkWindowInterval);
          meetingWindow.value = null;
          setMeetingStatus(false);
        }
      }, 1000);

      setMeetingStatus(true);
    }
  } catch (error) {
    console.error('打开会议窗口失败:', error);
    toast({
      title: '打开失败',
      description: '无法打开会议窗口，请稍后重试',
      variant: 'destructive'
    });
    setMeetingStatus(false);
  }
};

// 添加提示组件
const showPopupGuide = () => {
  toast({
    title: '提示',
    description: '请确保您的浏览器允许打开弹出窗口',
    variant: 'default',
    duration: 5000
  });
};

// 组件卸载时清理
onUnmounted(() => {
  // 关闭会议窗口
  if (meetingWindow.value && !meetingWindow.value.closed) {
    meetingWindow.value.close();
  }
  
  // 重置状态
  setMeetingStatus(false);
});

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// 组件挂载时检查状态
onMounted(() => {
  fetchMeetings();
  showPopupGuide();
  
  // 如果页面刷新时发现有会议状态，但实际没有会议窗口，则重置状态
  if (isInMeeting.value && (!meetingWindow.value || meetingWindow.value.closed)) {
    setMeetingStatus(false);
  }
});
</script> 