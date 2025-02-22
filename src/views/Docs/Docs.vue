<template>
  <div class="h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="h-14 border-b flex items-center justify-between px-6 bg-white">
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium">文档协作</h1>
        <button 
          class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          @click="createNewDoc"
        >
          新建文档
        </button>
      </div>
    </div>

    <!-- 文档列表 -->
    <div class="flex-1 p-6 bg-gray-50 overflow-auto">
      <div class="grid grid-cols-3 gap-6">
        <!-- 文档卡片 -->
        <div 
          v-for="doc in documents" 
          :key="doc.id"
          class="bg-white rounded-xl p-4 border hover:shadow-lg transition-shadow cursor-pointer"
          @click="openDocument(doc.id)"
        >
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium truncate">{{ doc.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ doc.description }}</p>
            </div>
            <FileText class="w-5 h-5 text-gray-400" />
          </div>
          
          <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>{{ formatDate(doc.updatedAt) }}</span>
            <div class="flex items-center gap-2">
              <Users class="w-4 h-4" />
              <span>{{ doc.collaborators }} 人协作</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Users } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'

const router = useRouter()
const { toast } = useToast()

// 示例文档数据
const documents = ref([
  {
    id: 1,
    title: '项目需求文档',
    description: '详细的项目需求说明和功能规划',
    updatedAt: '2024-02-22T10:00:00',
    collaborators: 3
  },
  {
    id: 2,
    title: '会议纪要',
    description: '2024年2月产品评审会议记录',
    updatedAt: '2024-02-21T15:30:00',
    collaborators: 5
  },
  {
    id: 3,
    title: '开发规范',
    description: '团队代码规范和开发流程说明',
    updatedAt: '2024-02-20T09:15:00',
    collaborators: 8
  }
])

// 创建新文档
const createNewDoc = () => {
  toast({
    title: "功能开发中",
    description: "文档创建功能即将上线",
    duration: 3000
  })
}

// 打开文档
const openDocument = (docId: number) => {
  toast({
    title: "功能开发中",
    description: "文档编辑功能即将上线",
    duration: 3000
  })
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style> 