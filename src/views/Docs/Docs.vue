<template>
  <div class="h-full flex flex-col">
      <!-- 顶部工具栏 -->
      <div class="h-14 border-b flex items-center justify-between px-6 bg-white">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-medium">文档协作</h1>
          <button 
            class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            @click="showDialog = true"
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
            class="bg-white rounded-xl p-4 border hover:shadow-lg transition-shadow cursor-pointer group"
            @click="openDocument(doc.id)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <!-- 根据类型显示不同图标和颜色 -->
                  <div 
                    class="p-2 rounded-lg"
                    :class="{
                      'bg-blue-50': doc.type === 'word',
                      'bg-green-50': doc.type === 'excel'
                    }"
                  >
                    <FileText 
                      v-if="doc.type === 'word'" 
                      class="w-5 h-5 text-blue-500" 
                    />
                    <Table 
                      v-else-if="doc.type === 'excel'" 
                      class="w-5 h-5 text-green-500" 
                    />
                  </div>
                  <h3 class="font-medium truncate">{{ doc.title }}</h3>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ doc.description || '暂无描述' }}</p>
              </div>
            </div>
            
            <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center gap-2">
                <!-- 显示创建者头像 -->
                <img 
                  :src="doc.creator?.avatar" 
                  :alt="doc.creator?.username"
                  class="w-6 h-6 rounded-full"
                />
                <span>{{ doc.creator?.username }}</span>
              </div>
              <span>{{ formatDate(doc.updatedAt) }}</span>
            </div>

            <!-- 底部信息 -->
            <div class="mt-2 pt-2 border-t flex items-center justify-between text-sm text-gray-500">
              <!-- 文档类型标签 -->
              <div 
                class="px-2 py-1 rounded text-xs"
                :class="{
                  'bg-blue-50 text-blue-600': doc.type === 'word',
                  'bg-green-50 text-green-600': doc.type === 'excel'
                }"
              >
                {{ doc.type === 'word' ? 'Word文档' : 'Excel表格' }}
              </div>
              
              <!-- 协作者信息 -->
              <div class="flex items-center gap-1">
                <Users class="w-4 h-4" />
                <!-- <span>{{ doc.collaborators.length }} 人协作</span> -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 新建文档弹框 -->
      <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div 
          class="bg-white rounded-lg w-[420px] shadow-xl"
          @click.stop
        >
          <!-- 弹框头部 -->
          <div class="p-4 border-b">
            <h3 class="text-lg font-medium">新建文档</h3>
            <p class="text-sm text-gray-500 mt-1">
              创建一个新的协作文档，选择文档类型并输入文档名称
            </p>
          </div>

          <!-- 弹框内容 -->
          <form @submit.prevent="handleCreateDoc" class="p-4">
            <div class="space-y-4">
              <!-- 文档类型 -->
              <div class="space-y-2">
                <label class="text-sm font-medium">文档类型</label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    class="p-3 border rounded-lg flex items-center gap-2 hover:border-blue-500 transition-colors"
                    :class="{ 'border-blue-500 bg-blue-50': newDoc.type === 'word' }"
                    @click="newDoc.type = 'word'"
                  >
                    <FileText class="w-5 h-5 text-blue-500" />
                    <span>Word 文档</span>
                  </button>
                  <button
                    type="button"
                    class="p-3 border rounded-lg flex items-center gap-2 hover:border-green-500 transition-colors"
                    :class="{ 'border-green-500 bg-green-50': newDoc.type === 'excel' }"
                    @click="newDoc.type = 'excel'"
                  >
                    <Table class="w-5 h-5 text-green-500" />
                    <span>Excel 表格</span>
                  </button>
                </div>
                <p v-if="errors.type" class="text-xs text-red-500 mt-1">
                  {{ errors.type }}
                </p>
              </div>

              <!-- 文档名称 -->
              <div class="space-y-2">
                <label class="text-sm font-medium">文档名称</label>
                <input
                  v-model="newDoc.title"
                  type="text"
                  placeholder="输入文档名称"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  :class="{ 'border-red-500': errors.title }"
                />
                <p v-if="errors.title" class="text-xs text-red-500 mt-1">
                  {{ errors.title }}
                </p>
              </div>
            </div>

            <!-- 弹框底部 -->
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                @click="closeDialog"
              >
                取消
              </button>
              <button
                type="submit"
                class="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? '创建中...' : '创建' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { FileText, Table, Users } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'
import { documentApi, type Document } from '@/api/document'

const router = useRouter()
const { toast } = useToast()

// 文档列表
const documents = ref<Document[]>([])
const TAG = '📃'
// 加载文档列表
const loadDocuments = async () => {
  try {
    const response = await documentApi.getDocuments()
    console.log(TAG, '加载文档列表:', response)
    if (response) {
      documents.value = response as unknown as Document[]
    }
  } catch (error) {
    console.error('加载文档列表失败:', error)
    toast({
      variant: 'destructive',
      title: '加载失败',
      description: '无法加载文档列表'
    })
  }
}

// 弹框状态
const showDialog = ref(false)
const isSubmitting = ref(false)

// 表单数据
const newDoc = reactive({
  title: '',
  type: ''
})

// 表单错误
const errors = reactive({
  title: '',
  type: ''
})

// 关闭弹框
const closeDialog = () => {
  showDialog.value = false
  newDoc.title = ''
  newDoc.type = ''
  errors.title = ''
  errors.type = ''
}

// 处理创建文档
const handleCreateDoc = async () => {
  // 重置错误
  errors.title = ''
  errors.type = ''
  
  // 表单验证
  if (!newDoc.type) {
    errors.type = '请选择文档类型'
    return
  }
  if (!newDoc.title.trim()) {
    errors.title = '请输入文档名称'
    return
  }

  try {
    isSubmitting.value = true
    
    // 调用创建文档 API
    const response = await documentApi.createDocument({
      title: newDoc.title.trim(),
      type: newDoc.type as 'word' | 'excel'
    })
    console.log(TAG, '创建文档:', response)
    toast({
      title: '创建成功',
      description: `已创建${newDoc.type === 'word' ? 'Word文档' : 'Excel表格'}: ${newDoc.title}`,
      duration: 3000
    })
    
    closeDialog()
    
    // 刷新文档列表
    await loadDocuments()
    
  } catch (error) {
    console.error('创建文档失败:', error)
    toast({
      variant: 'destructive',
      title: '创建失败',
      description: '请稍后重试',
      duration: 3000
    })
  } finally {
    isSubmitting.value = false
  }
}

// 打开文档
const openDocument = (docId: string) => {
  router.push(`/docs/${docId}`)
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

// 组件挂载时加载文档列表
onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style> 