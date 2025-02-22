<template>
  <MainLayout>
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
                    class="text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="handleJoinMeeting(meeting.id)"
                    :disabled="meeting.status === 'ENDED'"
                  >
                    加入会议
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
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MainLayout from '@/components/layout/MainLayout.vue';
import { Video, Plus, Loader2 } from 'lucide-vue-next';
import { useToast } from '@/components/ui/toast';
import { authApi } from '@/api/auth';
import { useRouter } from 'vue-router';

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

// 加入会议
const handleJoinMeeting = (meetingId: string) => {
  router.push(`/meeting/${meetingId}`);
};

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// 组件挂载时获取会议列表
onMounted(() => {
  fetchMeetings();
});
</script> 