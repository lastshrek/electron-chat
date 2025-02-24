<template>
  <MainLayout>
    <div class="h-full flex flex-col">
      <!-- 顶部导航 -->
      <div class="h-14 border-b flex items-center px-6 bg-white">
        <button 
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          @click="router.push('/docs')"
        >
          <ChevronLeft class="w-5 h-5" />
          <span>返回文档列表</span>
        </button>
      </div>

      <!-- 编辑器容器 -->
      <div class="flex-1">
        <ExcelEditor 
          v-if="document?.type === 'excel'"
          :document-id="documentId"
        />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import MainLayout from '@/components/layout/MainLayout.vue'
import ExcelEditor from '@/components/ExcelEditor.vue'
import { documentApi, type Document } from '@/api/document'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

const documentId = route.params.id as string
const document = ref<Document | null>(null)

// 加载文档信息
const loadDocument = async () => {
  try {
    const response = await documentApi.getDocument(documentId)
    document.value = response
  } catch (error) {
    console.error('加载文档失败:', error)
    toast({
      variant: 'destructive',
      title: '加载失败',
      description: '无法加载文档',
      duration: 3000
    })
    router.push('/docs')
  }
}

onMounted(() => {
  loadDocument()
})
</script> 