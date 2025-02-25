<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Clock, Plus, Trash2, FileCheck, AlertCircle } from 'lucide-vue-next'

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

// 加班记录数据
const overtimeRecords = ref([
  {
    id: 1,
    date: '2025-02-25',
    startTime: '18:00',
    endTime: '21:00',
    hours: 3,
    reason: '紧急项目需求变更，需要加班完成',
    status: 'pending'
  },
  {
    id: 2,
    date: '2025-02-20',
    startTime: '18:00',
    endTime: '20:30',
    hours: 2.5,
    reason: '系统上线前测试发现问题，需要加班修复',
    status: 'approved'
  }
])

// 新加班记录
const newRecord = ref({
  date: new Date().toISOString().split('T')[0],
  startTime: '18:00',
  endTime: '20:00',
  hours: 2,
  reason: ''
})

// 计算加班时长
const calculateHours = () => {
  if (!newRecord.value.startTime || !newRecord.value.endTime) return 0
  
  const start = new Date(`2025-01-01T${newRecord.value.startTime}:00`)
  const end = new Date(`2025-01-01T${newRecord.value.endTime}:00`)
  
  // 如果结束时间早于开始时间，假设跨天
  if (end < start) {
    end.setDate(end.getDate() + 1)
  }
  
  const diffMs = end.getTime() - start.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  newRecord.value.hours = Math.round(diffHours * 2) / 2 // 四舍五入到最近的0.5小时
  return newRecord.value.hours
}

// 监听时间变化
const updateHours = () => {
  calculateHours()
}

// 添加新记录
const addRecord = () => {
  if (!newRecord.value.date || !newRecord.value.startTime || !newRecord.value.endTime || !newRecord.value.reason) {
    alert('请填写完整的加班信息')
    return
  }
  
  overtimeRecords.value.push({
    id: Date.now(),
    ...newRecord.value,
    status: 'pending'
  })
  
  // 重置表单
  newRecord.value = {
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    hours: 2,
    reason: ''
  }
}

// 删除记录
const deleteRecord = (id: number) => {
  overtimeRecords.value = overtimeRecords.value.filter(record => record.id !== id)
}

// 提交加班申请
const submitOvertime = () => {
  alert('加班申请已提交成功！')
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
    case 'pending': return '待审批'
    case 'approved': return '已批准'
    case 'rejected': return '已拒绝'
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
          <h1 class="text-2xl font-semibold text-gray-900">加班登记</h1>
        </div>
        <div>
          <button 
            @click="submitOvertime"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FileCheck class="w-5 h-5" />
            提交申请
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
          <div class="text-gray-600">
            本月已加班: <span class="font-medium text-blue-600">5.5</span> 小时
          </div>
        </div>
      </div>

      <!-- 加班记录和表单 -->
      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：加班记录列表 -->
        <div class="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">加班记录</h2>
          
          <div class="space-y-4">
            <div v-if="overtimeRecords.length === 0" class="text-center py-8 text-gray-500">
              暂无加班记录
            </div>
            
            <div 
              v-for="record in overtimeRecords" 
              :key="record.id"
              class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div class="flex justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ record.date }}</span>
                    <span :class="`px-2 py-0.5 rounded text-xs ${getStatusStyle(record.status)}`">
                      {{ getStatusText(record.status) }}
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Clock class="w-4 h-4" />
                    <span>{{ record.startTime }} - {{ record.endTime }}</span>
                    <span class="font-medium">({{ record.hours }}小时)</span>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">{{ record.reason }}</p>
                </div>
                <button 
                  v-if="record.status === 'pending'"
                  @click="deleteRecord(record.id)"
                  class="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：添加加班表单 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">登记加班</h2>
          
          <form @submit.prevent="addRecord" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input 
                type="date" 
                v-model="newRecord.date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                <input 
                  type="time" 
                  v-model="newRecord.startTime"
                  @change="updateHours"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                <input 
                  type="time" 
                  v-model="newRecord.endTime"
                  @change="updateHours"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">加班时长</label>
              <div class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {{ newRecord.hours }} 小时
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">加班原因</label>
              <textarea 
                v-model="newRecord.reason"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请简要描述加班原因..."
                required
              ></textarea>
            </div>
            
            <button 
              type="submit"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus class="w-5 h-5" />
              添加加班记录
            </button>
          </form>
        </div>
      </div>

      <!-- 加班说明 -->
      <div class="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-medium mb-4">加班说明</h2>
        <div class="text-sm text-gray-600 space-y-2">
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>加班需提前申请，紧急情况可在加班后次日补填</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>工作日加班满3小时可申请加班餐补</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>周末及节假日加班可选择调休或加班费，请在申请时注明</p>
          </div>
          <div class="flex items-start gap-2">
            <AlertCircle class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>加班申请需经部门主管审批后生效</p>
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