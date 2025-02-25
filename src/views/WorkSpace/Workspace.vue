<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { 
  FileText, 
  Calendar,
  ChevronRight,
  ClipboardList,
  Users,
  Clock,
  FileSpreadsheet,
  ArrowRight,
  CalendarCheck,
  BarChart3,
  Tag
} from 'lucide-vue-next'

const userStore = useUserStore()

// 项目时间轴数据
const timeline = ref([
  {
    date: '2025-01-21',
    title: '城市运行管理服务平台标准体系建设',
    status: 'ongoing',
    department: '数字技术研究院'
  },
  {
    date: '2025-01-22',
    title: '公司级开放技术架构与标准体系建设',
    status: 'ongoing',
    department: '技术创新中心'
  },
  {
    date: '2025-02-10',
    title: '数字院与智慧城市公共可产品整合研究',
    status: 'pending',
    department: '产品研发部'
  },
  {
    date: '2025-02-20',
    title: '2025年创新项目启动工作',
    status: 'pending',
    department: '创新研究院'
  },
  {
    date: '2025-03-01',
    title: '智慧园区数字孪生平台建设项目',
    status: 'ongoing',
    department: '数字技术研究院'
  },
  {
    date: '2025-03-15',
    title: '企业级微服务架构升级计划',
    status: 'pending',
    department: '技术创新中心'
  },
  {
    date: '2025-04-01',
    title: '人工智能算法优化与应用研究',
    status: 'ongoing',
    department: '人工智能实验室'
  },
  {
    date: '2025-04-15',
    title: '区块链技术在供应链中的应用研究',
    status: 'pending',
    department: '区块链研究中心'
  },
  {
    date: '2025-05-01',
    title: '智慧城市数据中台建设项目',
    status: 'ongoing',
    department: '数据技术部'
  },
  {
    date: '2025-05-20',
    title: '企业级安全体系升级项目',
    status: 'pending',
    department: '信息安全部'
  }
])

// 任务管理数据
const tasks = ref([
  {
    id: 1,
    title: '数字院-任务-工时填报-超期提醒',
    deadline: '2025-02-25',
    status: 'urgent'
  },
  {
    id: 2,
    title: '数字院-任务-工时填报-进度更新',
    deadline: '2025-02-25',
    status: 'normal'
  },
  {
    id: 3,
    title: '数字院-任务-工时填报-周报提交',
    deadline: '2025-02-26',
    status: 'normal'
  }
])

// 恢复原来的快捷入口，但更新路径以匹配新的路由
const quickAccess = ref([
  {
    title: '工时填报',
    icon: Clock,
    color: 'bg-blue-500',
    path: '/timesheet'
  },
  {
    title: '临时工作填报',
    icon: ClipboardList,
    color: 'bg-orange-500',
    path: '/tempwork'
  },
  {
    title: '任务月报统计',
    icon: FileSpreadsheet,
    color: 'bg-green-500',
    path: '/monthlyreport'
  },
  {
    title: '考勤记录',
    icon: CalendarCheck,
    color: 'bg-cyan-500',
    path: '/attendance'
  },
  {
    title: '加班登记',
    icon: Calendar,
    color: 'bg-red-500',
    path: '/overtime'  // 需要创建这个页面
  },
  {
    title: '月统计工时审查',
    icon: FileText,
    color: 'bg-indigo-500',
    path: '/timesheet-review'  // 需要创建这个页面
  }
])

// 我发起的流程
const myProcesses = ref([
  {
    id: 1,
    title: '数字院-任务-工时填报-超期提醒',
    date: '2025-02-25',
    type: '任务类'
  },
  {
    id: 2,
    title: '数字院-任务-工时填报-进度更新',
    date: '2025-02-25',
    type: '任务类'
  }
])

// 添加自动滚动相关的变量和函数
const timelineRef = ref<HTMLElement | null>(null)
const scrollInterval = ref<number | null>(null)
const isHovering = ref(false)

// 修改自动滚动函数
const autoScroll = () => {
  if (!timelineRef.value || isHovering.value) return
  
  const container = timelineRef.value
  const scrollAmount = 1 // 每次滚动的像素数
  
  // 如果已经滚动到底部，则平滑地重置到顶部
  if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
    // 暂停当前的滚动
    stopAutoScroll()
    
    // 添加过渡效果类
    container.style.transition = 'opacity 0.3s'
    container.style.opacity = '0'
    
    // 等待淡出动画完成后重置位置
    setTimeout(() => {
      container.scrollTop = 0
      container.style.opacity = '1'
      
      // 重置完成后移除过渡效果
      setTimeout(() => {
        container.style.transition = ''
        // 重新开始滚动
        startAutoScroll()
      }, 300)
    }, 300)
  } else {
    container.scrollTop += scrollAmount
  }
}

// 修改开始自动滚动函数，降低滚动频率
const startAutoScroll = () => {
  if (scrollInterval.value) return // 防止重复启动
  scrollInterval.value = window.setInterval(autoScroll, 80) // 调整为80ms，使滚动更平滑
}

// 停止自动滚动
const stopAutoScroll = () => {
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
    scrollInterval.value = null
  }
}

// 鼠标进入时暂停滚动
const handleMouseEnter = () => {
  isHovering.value = true
}

// 鼠标离开时恢复滚动
const handleMouseLeave = () => {
  isHovering.value = false
}

// 组件挂载时启动自动滚动
onMounted(() => {
  startAutoScroll()
})

// 组件卸载时确保清理所有定时器和样式
onUnmounted(() => {
  stopAutoScroll()
  if (timelineRef.value) {
    timelineRef.value.style.transition = ''
    timelineRef.value.style.opacity = ''
  }
})
</script>

<template>
  <div class="p-6 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- 顶部欢迎区 -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">
          {{ userStore.userInfo?.username }}的工作台
        </h1>
        <p class="mt-2 text-gray-600">
          今天是{{ new Date().toLocaleDateString('zh-CN', { weekday: 'long' }) }}，开始您的工作吧
        </p>
      </div>

      <!-- 快捷入口 - 移到这里 -->
      <div class="mb-6 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-medium mb-6">快捷入口</h2>
        <div class="grid grid-cols-6 gap-4">
          <router-link
            v-for="item in quickAccess"
            :key="item.title"
            :to="item.path"
            class="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div 
              class="w-12 h-12 rounded-lg flex items-center justify-center text-white mb-2"
              :class="item.color"
            >
              <component :is="item.icon" class="w-6 h-6" />
            </div>
            <span class="text-sm text-gray-600 group-hover:text-gray-900">{{ item.title }}</span>
          </router-link>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：项目时间轴 -->
        <div class="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-medium">项目时间轴</h2>
            <button class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
              查看更多 <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          
          <div class="timeline-container">
            <div 
              ref="timelineRef"
              class="absolute inset-0 overflow-y-auto pr-4 custom-scrollbar"
              @mouseenter="handleMouseEnter"
              @mouseleave="handleMouseLeave"
            >
              <div class="relative">
                <div class="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div class="space-y-6">
                  <div 
                    v-for="item in timeline" 
                    :key="item.date"
                    class="relative pl-8 group"
                  >
                    <div 
                      class="absolute left-0 w-4 h-4 rounded-full border-2 mt-1.5 transition-all duration-200 group-hover:scale-125"
                      :class="item.status === 'ongoing' ? 'bg-blue-500 border-blue-200' : 'bg-gray-200 border-gray-100'"
                    ></div>
                    <div class="flex flex-col gap-2 p-4 rounded-lg border border-gray-100 
                           hover:border-blue-100 hover:bg-blue-50 transition-all duration-200"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-blue-600">{{ item.date }}</span>
                        <span 
                          class="text-xs px-2 py-1 rounded-full"
                          :class="item.status === 'ongoing' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'"
                        >
                          {{ item.status === 'ongoing' ? '进行中' : '待启动' }}
                        </span>
                      </div>
                      <h3 class="font-medium text-gray-900">{{ item.title }}</h3>
                      <p class="text-sm text-gray-500">{{ item.department }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：任务管理 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-medium">任务管理</h2>
            <button class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
              全部任务 <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          
          <div class="space-y-4">
            <div 
              v-for="task in tasks" 
              :key="task.id"
              class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div 
                  class="w-2 h-2 rounded-full mt-2"
                  :class="task.status === 'urgent' ? 'bg-red-500' : 'bg-blue-500'"
                ></div>
                <div class="flex-1">
                  <h3 class="text-gray-900 font-medium">{{ task.title }}</h3>
                  <p class="text-sm text-gray-500 mt-1">截止日期：{{ task.deadline }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我发起的流程 -->
      <div class="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-medium">我发起的流程</h2>
          <button class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
            查看更多 <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div 
            v-for="process in myProcesses" 
            :key="process.id"
            class="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-gray-900 font-medium">{{ process.title }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ process.type }} · {{ process.date }}</p>
              </div>
            </div>
            <ArrowRight class="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

/* 自定义滚动条样式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #E5E7EB;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #D1D5DB;
}

/* 修改滚动行为，使其更平滑 */
.custom-scrollbar {
  scroll-behavior: smooth;
  /* 添加触摸屏滚动支持 */
  -webkit-overflow-scrolling: touch;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}

/* 可选：添加渐变遮罩效果 */
/* 使用转义的类名选择器 */
.\[400px\] {
  position: relative;
}

.\[400px\]::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

.\[400px\]::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, transparent, white);
  pointer-events: none;
  z-index: 1;
}

/* 或者使用自定义类名 */
.timeline-container {
  position: relative;
  height: 400px;
}

.timeline-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, transparent, white);
  pointer-events: none;
  z-index: 1;
}
</style> 