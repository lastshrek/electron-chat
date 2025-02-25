<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, Check, X, Search, Filter, User } from 'lucide-vue-next'

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

// 搜索关键词
const searchKeyword = ref('')

// 部门筛选
const departments = ref([
  '全部部门',
  '数字技术研究院',
  '技术创新中心',
  '产品研发部',
  '创新研究院',
  '人工智能实验室',
  '区块链研究中心',
  '数据技术部',
  '信息安全部'
])
const selectedDepartment = ref('全部部门')

// 状态筛选
const statuses = ref([
  '全部状态',
  '待审核',
  '已通过',
  '已驳回'
])
const selectedStatus = ref('全部状态')

// 工时记录数据
const timesheetRecords = ref([
  {
    id: 1,
    name: '张三',
    department: '数字技术研究院',
    position: '高级前端工程师',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    totalHours: 176,
    overtime: 8,
    projects: [
      { name: '城市运行管理服务平台标准体系建设', hours: 120 },
      { name: '公司级开放技术架构与标准体系建设', hours: 56 }
    ],
    status: 'pending',
    submittedAt: '2025-02-25'
  },
  {
    id: 2,
    name: '李四',
    department: '技术创新中心',
    position: '后端开发工程师',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    totalHours: 168,
    overtime: 0,
    projects: [
      { name: '公司级开放技术架构与标准体系建设', hours: 168 }
    ],
    status: 'approved',
    submittedAt: '2025-02-24'
  },
  {
    id: 3,
    name: '王五',
    department: '产品研发部',
    position: '产品经理',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    totalHours: 184,
    overtime: 16,
    projects: [
      { name: '数字院与智慧城市公共可产品整合研究', hours: 120 },
      { name: '智慧园区数字孪生平台建设项目', hours: 64 }
    ],
    status: 'rejected',
    submittedAt: '2025-02-23'
  },
  {
    id: 4,
    name: '赵六',
    department: '数字技术研究院',
    position: 'UI设计师',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    totalHours: 160,
    overtime: 0,
    projects: [
      { name: '城市运行管理服务平台标准体系建设', hours: 160 }
    ],
    status: 'pending',
    submittedAt: '2025-02-25'
  },
  {
    id: 5,
    name: '钱七',
    department: '创新研究院',
    position: '研究员',
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    totalHours: 172,
    overtime: 4,
    projects: [
      { name: '2025年创新项目启动工作', hours: 172 }
    ],
    status: 'approved',
    submittedAt: '2025-02-22'
  }
])

// 筛选后的记录
const filteredRecords = computed(() => {
  return timesheetRecords.value.filter(record => {
    // 搜索过滤
    const matchesSearch = searchKeyword.value === '' || 
      record.name.includes(searchKeyword.value) || 
      record.department.includes(searchKeyword.value) ||
      record.projects.some(p => p.name.includes(searchKeyword.value))
    
    // 部门过滤
    const matchesDepartment = selectedDepartment.value === '全部部门' || 
      record.department === selectedDepartment.value
    
    // 状态过滤
    let matchesStatus = true
    if (selectedStatus.value !== '全部状态') {
      const statusMap = {
        '待审核': 'pending',
        '已通过': 'approved',
        '已驳回': 'rejected'
      }
      matchesStatus = record.status === statusMap[selectedStatus.value]
    }
    
    return matchesSearch && matchesDepartment && matchesStatus
  })
})

// 审批工时
const approveTimesheet = (id: number) => {
  const record = timesheetRecords.value.find(r => r.id === id)
  if (record) {
    record.status = 'approved'
  }
}

// 驳回工时
const rejectTimesheet = (id: number) => {
  const record = timesheetRecords.value.find(r => r.id === id)
  if (record) {
    record.status = 'rejected'
  }
}

// 导出报表
const exportReport = () => {
  alert('工时审查报表已开始下载')
}

// 获取状态标签样式
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700'
    case 'approved': return 'bg-green-100 text-green-700'
    case 'rejected': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已驳回'
    default: return '未知'
  }
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
          <h1 class="text-2xl font-semibold text-gray-900">月统计工时审查</h1>
        </div>
        <div>
          <button 
            @click="exportReport"
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
          <div class="text-gray-600">
            待审核: <span class="font-medium text-yellow-600">2</span> 人
          </div>
        </div>
      </div>

      <!-- 筛选工具栏 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search class="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                v-model="searchKeyword"
                class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="搜索姓名、部门或项目..."
              />
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <Filter class="w-5 h-5 text-gray-500" />
            <span class="text-gray-600">筛选:</span>
          </div>
          
          <div>
            <select 
              v-model="selectedDepartment"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>
          
          <div>
            <select 
              v-model="selectedStatus"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="status in statuses" :key="status" :value="status">
                {{ status }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- 工时记录列表 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="space-y-6">
          <div v-if="filteredRecords.length === 0" class="text-center py-8 text-gray-500">
            没有找到匹配的工时记录
          </div>
          
          <div 
            v-for="record in filteredRecords" 
            :key="record.id"
            class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
          >
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img :src="record.avatar" alt="用户头像" class="w-full h-full object-cover" />
              </div>
              
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="font-medium text-gray-900">{{ record.name }}</h3>
                  <span class="text-sm text-gray-500">{{ record.position }}</span>
                  <span :class="`px-2 py-0.5 rounded text-xs ${getStatusStyle(record.status)}`">
                    {{ getStatusText(record.status) }}
                  </span>
                </div>
                
                <div class="flex items-center gap-4 mb-2 text-sm">
                  <div class="flex items-center gap-1 text-gray-600">
                    <User class="w-4 h-4" />
                    <span>{{ record.department }}</span>
                  </div>
                  <div class="text-gray-600">
                    提交时间: {{ record.submittedAt }}
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mb-3">
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">总工时</div>
                    <div class="font-medium text-gray-900">{{ record.totalHours }} 小时</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-500">加班时长</div>
                    <div class="font-medium text-orange-600">{{ record.overtime }} 小时</div>
                  </div>
                </div>
                
                <div class="space-y-2">
                  <div class="text-sm font-medium text-gray-700">项目分布</div>
                  <div v-for="project in record.projects" :key="project.name" class="flex justify-between text-sm">
                    <span class="text-gray-600">{{ project.name }}</span>
                    <span class="font-medium">{{ project.hours }}h</span>
                  </div>
                </div>
              </div>
              
              <div v-if="record.status === 'pending'" class="flex flex-col gap-2">
                <button 
                  @click="approveTimesheet(record.id)"
                  class="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Check class="w-5 h-5" />
                </button>
                <button 
                  @click="rejectTimesheet(record.id)"
                  class="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style> 