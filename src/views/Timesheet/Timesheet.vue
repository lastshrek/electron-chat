<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Clock, Plus, Save, Trash2, FileCheck } from 'lucide-vue-next'

// 获取路由实例
const router = useRouter()

// 返回上一页方法
const goBack = () => {
  router.back()
}

// 当前日期
const currentDate = ref(new Date())

// 格式化日期
const formattedDate = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
})

// 工时记录数据
const timesheetRecords = ref([
  {
    id: 1,
    project: '城市运行管理服务平台标准体系建设',
    task: '需求分析与整理',
    date: '2025-02-25',
    hours: 4.5,
    description: '整理用户需求文档，与产品经理讨论功能细节'
  },
  {
    id: 2,
    project: '城市运行管理服务平台标准体系建设',
    task: '前端界面设计',
    date: '2025-02-25',
    hours: 3.5,
    description: '设计数据展示页面，实现响应式布局'
  }
])

// 项目列表
const projects = ref([
  { id: 1, name: '城市运行管理服务平台标准体系建设' },
  { id: 2, name: '公司级开放技术架构与标准体系建设' },
  { id: 3, name: '数字院与智慧城市公共可产品整合研究' },
  { id: 4, name: '智慧园区数字孪生平台建设项目' },
  { id: 5, name: '企业级微服务架构升级计划' }
])

// 新工时记录
const newRecord = ref({
  project: '',
  task: '',
  date: new Date().toISOString().split('T')[0],
  hours: 0,
  description: ''
})

// 任务类型列表
const taskTypes = ref([
  '需求分析与整理',
  '系统设计',
  '前端界面设计',
  '后端接口开发',
  '数据库设计',
  '单元测试',
  '集成测试',
  '文档编写',
  '项目管理',
  '会议讨论'
])

// 添加新记录
const addRecord = () => {
  if (!newRecord.value.project || !newRecord.value.task || newRecord.value.hours <= 0) {
    alert('请填写完整的工时信息')
    return
  }
  
  timesheetRecords.value.push({
    id: Date.now(),
    ...newRecord.value
  })
  
  // 重置表单
  newRecord.value = {
    project: '',
    task: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: ''
  }
}

// 删除记录
const deleteRecord = (id: number) => {
  timesheetRecords.value = timesheetRecords.value.filter(record => record.id !== id)
}

// 计算总工时
const totalHours = computed(() => {
  return timesheetRecords.value.reduce((sum, record) => sum + record.hours, 0)
})

// 提交工时
const submitTimesheet = () => {
  alert('工时填报已提交成功！')
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
          <h1 class="text-2xl font-semibold text-gray-900">工时填报</h1>
        </div>
        <div>
          <button 
            @click="submitTimesheet"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FileCheck class="w-5 h-5" />
            提交工时
          </button>
        </div>
      </div>

      <!-- 日期显示 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Calendar class="w-6 h-6 text-blue-500" />
            <span class="text-lg font-medium">{{ formattedDate }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-600">总工时:</span>
            <span class="text-lg font-medium text-blue-600">{{ totalHours }} 小时</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：工时记录列表 -->
        <div class="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">今日工时记录</h2>
          
          <div class="space-y-4">
            <div 
              v-for="record in timesheetRecords" 
              :key="record.id"
              class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div class="flex justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium text-gray-900">{{ record.project }}</h3>
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {{ record.task }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-2">{{ record.description }}</p>
                  <div class="flex items-center gap-4 mt-2">
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar class="w-4 h-4" />
                      <span>{{ record.date }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <Clock class="w-4 h-4" />
                      <span>{{ record.hours }} 小时</span>
                    </div>
                  </div>
                </div>
                <button 
                  @click="deleteRecord(record.id)"
                  class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：添加工时表单 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">添加工时</h2>
          
          <form @submit.prevent="addRecord" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">项目</label>
              <select 
                v-model="newRecord.project"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>选择项目</option>
                <option v-for="project in projects" :key="project.id" :value="project.name">
                  {{ project.name }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">任务类型</label>
              <select 
                v-model="newRecord.task"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>选择任务类型</option>
                <option v-for="task in taskTypes" :key="task" :value="task">
                  {{ task }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input 
                type="date" 
                v-model="newRecord.date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">工时 (小时)</label>
              <input 
                type="number" 
                v-model="newRecord.hours"
                min="0.5" 
                step="0.5"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">工作内容描述</label>
              <textarea 
                v-model="newRecord.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请简要描述您的工作内容..."
              ></textarea>
            </div>
            
            <button 
              type="submit"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus class="w-5 h-5" />
              添加工时记录
            </button>
          </form>
        </div>
      </div>

      <!-- 工时填报说明 -->
      <div class="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-medium mb-4">工时填报说明</h2>
        <div class="text-sm text-gray-600 space-y-2">
          <p>1. 请每日及时填写工时，确保准确记录您的工作内容</p>
          <p>2. 工时最小单位为0.5小时，请按实际工作时间填写</p>
          <p>3. 每日工时总计不应超过12小时</p>
          <p>4. 工时填报将于每月25日锁定上月数据，请在截止日期前完成填报</p>
          <p>5. 如有特殊情况需修改已提交的工时，请联系项目经理</p>
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