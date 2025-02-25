<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Clock, Plus, Trash2, FileCheck, Tag, AlertCircle } from 'lucide-vue-next'

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

// 临时工作记录数据
const tempWorkRecords = ref([
  {
    id: 1,
    title: '紧急需求变更会议',
    category: '会议',
    priority: 'high',
    date: '2025-02-25',
    hours: 2,
    description: '参加产品部门组织的紧急需求变更讨论会议'
  },
  {
    id: 2,
    title: '系统故障排查',
    category: '技术支持',
    priority: 'urgent',
    date: '2025-02-25',
    hours: 3.5,
    description: '排查并修复生产环境中的数据同步问题'
  }
])

// 工作类别列表
const categories = ref([
  '会议',
  '技术支持',
  '培训',
  '文档编写',
  '需求分析',
  '突发事件处理',
  '其他'
])

// 优先级列表
const priorities = ref([
  { value: 'low', label: '低' },
  { value: 'normal', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' }
])

// 新临时工作记录
const newRecord = ref({
  title: '',
  category: '',
  priority: 'normal',
  date: new Date().toISOString().split('T')[0],
  hours: 0,
  description: ''
})

// 添加新记录
const addRecord = () => {
  if (!newRecord.value.title || !newRecord.value.category || newRecord.value.hours <= 0) {
    alert('请填写完整的临时工作信息')
    return
  }
  
  tempWorkRecords.value.push({
    id: Date.now(),
    ...newRecord.value
  })
  
  // 重置表单
  newRecord.value = {
    title: '',
    category: '',
    priority: 'normal',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: ''
  }
}

// 删除记录
const deleteRecord = (id: number) => {
  tempWorkRecords.value = tempWorkRecords.value.filter(record => record.id !== id)
}

// 计算总工时
const totalHours = computed(() => {
  return tempWorkRecords.value.reduce((sum, record) => sum + record.hours, 0)
})

// 提交临时工作记录
const submitTempWork = () => {
  alert('临时工作记录已提交成功！')
}

// 获取优先级标签颜色
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-700'
    case 'normal': return 'bg-blue-100 text-blue-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'urgent': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

// 获取优先级标签文本
const getPriorityLabel = (priority: string) => {
  const found = priorities.value.find(p => p.value === priority)
  return found ? found.label : '中'
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
          <h1 class="text-2xl font-semibold text-gray-900">临时工作填报</h1>
        </div>
        <div>
          <button 
            @click="submitTempWork"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FileCheck class="w-5 h-5" />
            提交记录
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
        <!-- 左侧：临时工作记录列表 -->
        <div class="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">临时工作记录</h2>
          
          <div class="space-y-4">
            <div 
              v-for="record in tempWorkRecords" 
              :key="record.id"
              class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div class="flex justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium text-gray-900">{{ record.title }}</h3>
                    <span :class="`px-2 py-0.5 rounded text-xs ${getPriorityColor(record.priority)}`">
                      {{ getPriorityLabel(record.priority) }}
                    </span>
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                      {{ record.category }}
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

        <!-- 右侧：添加临时工作表单 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">添加临时工作</h2>
          
          <form @submit.prevent="addRecord" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">工作标题</label>
              <input 
                type="text" 
                v-model="newRecord.title"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入临时工作标题"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">工作类别</label>
              <select 
                v-model="newRecord.category"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>选择工作类别</option>
                <option v-for="category in categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
              <select 
                v-model="newRecord.priority"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
                  {{ priority.label }}
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
                placeholder="请简要描述临时工作内容..."
              ></textarea>
            </div>
            
            <button 
              type="submit"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus class="w-5 h-5" />
              添加临时工作
            </button>
          </form>
        </div>
      </div>

      <!-- 临时工作填报说明 -->
      <div class="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-medium mb-4">临时工作填报说明</h2>
        <div class="text-sm text-gray-600 space-y-2">
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>临时工作是指未纳入正式项目计划，但需要投入工时的临时性工作任务</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>请在工作完成后及时填报，以确保工时统计的准确性</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>紧急优先级的临时工作将自动通知相关部门负责人</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>临时工作时长将计入您的月度工时统计</p>
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