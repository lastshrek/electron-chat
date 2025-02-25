<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, PieChart, BarChart3, Clock, FileText } from 'lucide-vue-next'

// 获取路由实例
const router = useRouter()

// 返回上一页方法
const goBack = () => {
  router.back()
}

// 当前月份
const currentMonth = ref(new Date())

// 切换月份
const changeMonth = (delta: number) => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentMonth.value = newDate
}

// 格式化月份
const formattedMonth = computed(() => {
  return currentMonth.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

// 项目工时数据
const projectHours = ref([
  { 
    project: '城市运行管理服务平台标准体系建设', 
    hours: 78.5,
    percentage: 45
  },
  { 
    project: '公司级开放技术架构与标准体系建设', 
    hours: 42,
    percentage: 24
  },
  { 
    project: '数字院与智慧城市公共可产品整合研究', 
    hours: 35.5,
    percentage: 20
  },
  { 
    project: '其他项目', 
    hours: 19,
    percentage: 11
  }
])

// 任务类型工时数据
const taskTypeHours = ref([
  { type: '需求分析与整理', hours: 32, percentage: 18 },
  { type: '系统设计', hours: 45, percentage: 26 },
  { type: '前端界面设计', hours: 38, percentage: 22 },
  { type: '后端接口开发', hours: 28, percentage: 16 },
  { type: '测试', hours: 15, percentage: 9 },
  { type: '文档编写', hours: 10, percentage: 6 },
  { type: '会议讨论', hours: 7, percentage: 3 }
])

// 每日工时数据
const dailyHours = ref([
  { date: '2025-02-01', hours: 8, day: '周一' },
  { date: '2025-02-02', hours: 8.5, day: '周二' },
  { date: '2025-02-03', hours: 7.5, day: '周三' },
  { date: '2025-02-04', hours: 9, day: '周四' },
  { date: '2025-02-05', hours: 8, day: '周五' },
  { date: '2025-02-08', hours: 6, day: '周一' },
  { date: '2025-02-09', hours: 7, day: '周二' },
  { date: '2025-02-10', hours: 8, day: '周三' },
  { date: '2025-02-11', hours: 8.5, day: '周四' },
  { date: '2025-02-12', hours: 7.5, day: '周五' },
  { date: '2025-02-15', hours: 8, day: '周一' },
  { date: '2025-02-16', hours: 9, day: '周二' },
  { date: '2025-02-17', hours: 8.5, day: '周三' },
  { date: '2025-02-18', hours: 7, day: '周四' },
  { date: '2025-02-19', hours: 8, day: '周五' },
  { date: '2025-02-22', hours: 8.5, day: '周一' },
  { date: '2025-02-23', hours: 9, day: '周二' },
  { date: '2025-02-24', hours: 8, day: '周三' },
  { date: '2025-02-25', hours: 7.5, day: '周四' },
  { date: '2025-02-26', hours: 8, day: '周五' }
])

// 月度统计数据
const monthlyStats = ref({
  totalHours: 175,
  workdays: 20,
  avgHoursPerDay: 8.75,
  overtime: 15,
  tempWork: 12,
  utilization: 92
})

// 下载报表
const downloadReport = () => {
  alert('月度报表已开始下载')
}
</script>

<template>
  <div class="p-6 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- 顶部导航 -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <button 
            @click="goBack"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <h1 class="text-2xl font-semibold text-gray-900">任务月报统计</h1>
        </div>
        <div>
          <button 
            @click="downloadReport"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download class="w-5 h-5" />
            导出报表
          </button>
        </div>
      </div>

      <!-- 月份选择器 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Calendar class="w-6 h-6 text-blue-500" />
            <div class="flex items-center gap-2">
              <button 
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                @click="changeMonth(-1)"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>
              <span class="text-lg font-medium">{{ formattedMonth }}</span>
              <button 
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                @click="changeMonth(1)"
              >
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-600">总工时:</span>
            <span class="text-lg font-medium text-blue-600">{{ monthlyStats.totalHours }} 小时</span>
          </div>
        </div>
      </div>

      <!-- 月度统计卡片 -->
      <div class="grid grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <Clock class="w-6 h-6 text-blue-500" />
            <h2 class="text-lg font-medium">工时统计</h2>
          </div>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">工作天数</span>
              <span class="font-medium">{{ monthlyStats.workdays }} 天</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">日均工时</span>
              <span class="font-medium">{{ monthlyStats.avgHoursPerDay }} 小时</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">加班时长</span>
              <span class="font-medium text-orange-600">{{ monthlyStats.overtime }} 小时</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">临时工作</span>
              <span class="font-medium text-blue-600">{{ monthlyStats.tempWork }} 小时</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">工时利用率</span>
              <span class="font-medium text-green-600">{{ monthlyStats.utilization }}%</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <PieChart class="w-6 h-6 text-blue-500" />
            <h2 class="text-lg font-medium">项目分布</h2>
          </div>
          <div class="space-y-3">
            <div v-for="(item, index) in projectHours" :key="index" class="space-y-1">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600 truncate max-w-[70%]" :title="item.project">{{ item.project }}</span>
                <span class="font-medium">{{ item.hours }}h ({{ item.percentage }}%)</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-blue-500 h-2 rounded-full" 
                  :style="`width: ${item.percentage}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center gap-3 mb-4">
            <FileText class="w-6 h-6 text-blue-500" />
            <h2 class="text-lg font-medium">任务类型分布</h2>
          </div>
          <div class="space-y-3">
            <div v-for="(item, index) in taskTypeHours" :key="index" class="space-y-1">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600">{{ item.type }}</span>
                <span class="font-medium">{{ item.hours }}h ({{ item.percentage }}%)</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-green-500 h-2 rounded-full" 
                  :style="`width: ${item.percentage}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 每日工时图表 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center gap-3 mb-6">
          <BarChart3 class="w-6 h-6 text-blue-500" />
          <h2 class="text-lg font-medium">每日工时分布</h2>
        </div>
        
        <div class="h-64">
          <div class="flex h-full items-end">
            <div 
              v-for="(item, index) in dailyHours" 
              :key="index"
              class="flex-1 flex flex-col items-center group"
            >
              <div 
                class="w-full max-w-[30px] bg-blue-500 rounded-t transition-all group-hover:bg-blue-600"
                :style="`height: ${(item.hours / 10) * 100}%`"
              ></div>
              <div class="mt-2 text-xs text-gray-500 rotate-45 origin-left">{{ item.date.split('-')[2] }}日</div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-between mt-8">
          <div class="text-sm text-gray-600">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded"></div>
              <span>日常工时</span>
            </div>
          </div>
          <div class="text-sm text-gray-600">
            <span>标准工时线: 8小时/天</span>
          </div>
        </div>
      </div>

      <!-- 月度工作总结 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-medium mb-4">月度工作总结</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-gray-900 mb-2">主要工作成果</h3>
            <ul class="list-disc list-inside text-gray-600 space-y-1">
              <li>完成城市运行管理服务平台需求分析与原型设计</li>
              <li>开发并测试公司级开放技术架构核心模块</li>
              <li>参与数字院与智慧城市产品整合研究，提交研究报告</li>
              <li>解决生产环境中的3个关键技术问题</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-medium text-gray-900 mb-2">下月工作计划</h3>
            <ul class="list-disc list-inside text-gray-600 space-y-1">
              <li>启动城市运行管理服务平台前端开发</li>
              <li>完成公司级开放技术架构文档编写</li>
              <li>开始智慧园区数字孪生平台建设项目</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-medium text-gray-900 mb-2">问题与建议</h3>
            <p class="text-gray-600">
              建议优化跨部门协作流程，提高沟通效率；需要增加技术培训资源，提升团队技术能力。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style> 