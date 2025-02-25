<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, ArrowLeft } from 'lucide-vue-next'

// 获取路由实例
const router = useRouter()

// 返回上一页方法
const goBack = () => {
  router.back()
}

// 定义节假日类型
interface Holiday {
  type: 'holiday' | 'workday';
  name: string;
}

interface Holidays {
  [key: string]: Holiday;
}

// 定义考勤记录类型
interface AttendanceRecord {
  type: 'check-in' | 'check-out';
  time: string;
  location: string;
  status: 'normal' | 'late' | 'overtime';
}

interface DayRecord {
  date: string;
  records: AttendanceRecord[];
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  hasRecord: boolean;
  record?: DayRecord;
  isWeekend: boolean;
  holiday: Holiday | null;
}

// 考勤记录数据
const attendanceRecords = ref<DayRecord[]>([
  {
    date: '2025-02-25',
    records: [
      {
        type: 'check-in',
        time: '09:00',
        location: '公司大厦-A座',
        status: 'normal'
      },
      {
        type: 'check-out',
        time: '18:00',
        location: '公司大厦-A座',
        status: 'normal'
      }
    ]
  },
  {
    date: '2025-02-24',
    records: [
      {
        type: 'check-in',
        time: '09:15',
        location: '公司大厦-A座',
        status: 'late'
      },
      {
        type: 'check-out',
        time: '18:30',
        location: '公司大厦-A座',
        status: 'overtime'
      }
    ]
  }
])

// 当前月份
const currentMonth = ref(new Date())

// 切换月份
const changeMonth = (delta: number) => {
  const newDate = new Date(currentMonth.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentMonth.value = newDate
}

// 格式化日期
const formatMonth = (date: Date) => {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
}

// 考勤统计
const statistics = ref({
  normal: 20,
  late: 2,
  early: 1,
  absent: 0,
  overtime: 5
})

// 添加日历相关的函数和数据
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

// 添加 2025 年节假日数据
const holidays: Holidays = {
  '2025-01-01': { type: 'holiday', name: '元旦' },
  '2025-02-08': { type: 'holiday', name: '春节' },
  '2025-02-09': { type: 'holiday', name: '春节' },
  '2025-02-10': { type: 'holiday', name: '春节' },
  '2025-02-11': { type: 'holiday', name: '春节' },
  '2025-02-12': { type: 'holiday', name: '春节' },
  '2025-02-13': { type: 'holiday', name: '春节' },
  '2025-04-05': { type: 'holiday', name: '清明节' },
  '2025-05-01': { type: 'holiday', name: '劳动节' },
  '2025-06-22': { type: 'holiday', name: '端午节' },
  '2025-09-29': { type: 'holiday', name: '中秋节' },
  '2025-10-01': { type: 'holiday', name: '国庆节' },
  '2025-10-02': { type: 'holiday', name: '国庆节' },
  '2025-10-03': { type: 'holiday', name: '国庆节' },
  // 调休工作日
  '2025-02-15': { type: 'workday', name: '春节调休' },
  '2025-02-16': { type: 'workday', name: '春节调休' },
  '2025-04-06': { type: 'workday', name: '清明调休' },
  '2025-09-28': { type: 'workday', name: '中秋调休' },
  '2025-10-04': { type: 'workday', name: '国庆调休' },
}

// 获取日历数据
const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const daysInMonth = getDaysInMonth(currentMonth.value)
  const firstDay = getFirstDayOfMonth(currentMonth.value)
  
  // 添加上个月的日期
  const prevMonthDays = getDaysInMonth(new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1))
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthDays - i,
      isCurrentMonth: false,
      hasRecord: false,
      isWeekend: false,
      holiday: null
    })
  }
  
  // 添加当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = `${currentMonth.value.getFullYear()}-${String(currentMonth.value.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const record = attendanceRecords.value.find(r => r.date === currentDate)
    const dayOfWeek = new Date(currentDate).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    days.push({
      date: i,
      isCurrentMonth: true,
      hasRecord: !!record,
      record: record,
      isWeekend,
      holiday: holidays[currentDate] || null
    })
  }
  
  // 添加下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      hasRecord: false,
      isWeekend: false,
      holiday: null
    })
  }
  
  return days
})

// 星期标题
const weekDays = ['日', '一', '二', '三', '四', '五', '六']
</script>

<template>
  <div class="p-6 min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- 顶部导航 - 修改为返回按钮 -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <button 
            @click="goBack"
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <h1 class="text-2xl font-semibold text-gray-900">考勤记录</h1>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：考勤日历 -->
        <div class="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-blue-500" />
              <h2 class="text-lg font-medium">考勤日历</h2>
            </div>
            <div class="flex items-center gap-2">
              <button 
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                @click="changeMonth(-1)"
              >
                <ChevronLeft class="w-5 h-5" />
              </button>
              <span class="text-gray-700 min-w-[120px] text-center">
                {{ formatMonth(currentMonth) }}
              </span>
              <button 
                class="p-1 hover:bg-gray-100 rounded transition-colors"
                @click="changeMonth(1)"
              >
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- 日历网格 -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <!-- 星期标题 -->
            <div class="grid grid-cols-7 bg-gray-50">
              <div 
                v-for="day in weekDays" 
                :key="day"
                class="py-2 text-center text-sm font-medium text-gray-700"
              >
                {{ day }}
              </div>
            </div>
            
            <!-- 日历格子 -->
            <div class="grid grid-cols-7">
              <div 
                v-for="(day, index) in calendarDays" 
                :key="index"
                class="border-t border-l first:border-l-0 relative aspect-square"
                :class="{
                  'bg-gray-50': !day.isCurrentMonth,
                  'hover:bg-blue-50 transition-colors': day.isCurrentMonth,
                  'bg-red-50': day.isCurrentMonth && day.holiday?.type === 'holiday',
                  'bg-orange-50': day.isCurrentMonth && day.holiday?.type === 'workday',
                  'bg-gray-100': day.isCurrentMonth && day.isWeekend && !day.holiday
                }"
              >
                <div class="p-2">
                  <div class="flex justify-between items-start">
                    <span 
                      class="text-sm"
                      :class="{
                        'text-gray-400': !day.isCurrentMonth,
                        'text-gray-900': day.isCurrentMonth && !day.isWeekend && !day.holiday,
                        'text-red-600': day.isCurrentMonth && (
                          day.holiday?.type === 'holiday' || 
                          (day.isWeekend && !day.holiday)
                        ),
                        'text-orange-600': day.isCurrentMonth && day.holiday?.type === 'workday'
                      }"
                    >
                      {{ day.date }}
                    </span>
                    <!-- 节假日标记 -->
                    <span 
                      v-if="day.holiday"
                      class="text-xs px-1 rounded"
                      :class="{
                        'bg-red-100 text-red-600': day.holiday.type === 'holiday',
                        'bg-orange-100 text-orange-600': day.holiday.type === 'workday'
                      }"
                    >
                      {{ day.holiday.type === 'holiday' ? '休' : '班' }}
                    </span>
                  </div>
                  
                  <!-- 节假日名称 -->
                  <div 
                    v-if="day.holiday"
                    class="text-xs mt-1"
                    :class="{
                      'text-red-600': day.holiday.type === 'holiday',
                      'text-orange-600': day.holiday.type === 'workday'
                    }"
                  >
                    {{ day.holiday.name }}
                  </div>
                  
                  <!-- 考勤状态指示器 -->
                  <div v-if="day.hasRecord" class="mt-1 space-y-1">
                    <div 
                      v-for="record in day.record?.records"
                      :key="record.type"
                      class="text-xs px-1 py-0.5 rounded"
                      :class="{
                        'bg-green-100 text-green-700': record.status === 'normal',
                        'bg-red-100 text-red-700': record.status === 'late',
                        'bg-orange-100 text-orange-700': record.status === 'overtime'
                      }"
                    >
                      {{ record.time }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 考勤记录详情 -->
          <div class="mt-6 space-y-4">
            <div 
              v-for="record in attendanceRecords" 
              :key="record.date"
              class="p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors"
            >
              <div class="text-sm font-medium text-gray-900 mb-2">{{ record.date }}</div>
              <div class="space-y-2">
                <div 
                  v-for="(item, index) in record.records" 
                  :key="index"
                  class="flex items-center justify-between text-sm"
                >
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4" :class="{
                      'text-green-600': item.status === 'normal',
                      'text-red-600': item.status === 'late',
                      'text-orange-600': item.status === 'overtime'
                    }" />
                    <span>{{ item.type === 'check-in' ? '上班' : '下班' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>{{ item.time }}</span>
                    <MapPin class="w-4 h-4 text-gray-400" />
                    <span class="text-gray-500">{{ item.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：考勤统计 -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-lg font-medium mb-6">本月统计</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <span class="text-green-700">正常出勤</span>
              <span class="text-green-700 font-medium">{{ statistics.normal }}天</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
              <span class="text-red-700">迟到</span>
              <span class="text-red-700 font-medium">{{ statistics.late }}次</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <span class="text-yellow-700">早退</span>
              <span class="text-yellow-700 font-medium">{{ statistics.early }}次</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <span class="text-gray-700">缺勤</span>
              <span class="text-gray-700 font-medium">{{ statistics.absent }}天</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <span class="text-blue-700">加班</span>
              <span class="text-blue-700 font-medium">{{ statistics.overtime }}次</span>
            </div>
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

.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

/* 添加节假日相关样式 */
.holiday-badge {
  font-size: 0.65rem;
  line-height: 1;
}
</style> 