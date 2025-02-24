<!--
 * @Author       : lastshrek
 * @Date         : 2025-02-23 00:08:18
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-24 21:34:27
 * @FilePath     : /src/components/ExcelEditor.vue
 * @Description  : ExcelEditor 组件
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-23 00:08:18
-->
<template>
  <div class="h-full flex flex-col bg-white">
    <!-- 顶部工具栏 -->
    <div class="h-14 border-b flex items-center justify-between px-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-medium">{{ documentTitle }}</h2>
        <span 
          class="px-2 py-1 rounded text-sm"
          :class="connectionStatus === '已连接' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'"
        >
          {{ connectionStatus }}
        </span>
      </div>

      <!-- 协作者列表 -->
      <div class="flex items-center gap-2">
        <div class="flex -space-x-2">
          <img
            v-for="user in activeUsers"
            :key="user.userId"
            :src="user.avatar"
            :alt="user.username"
            :title="user.username"
            class="w-8 h-8 rounded-full border-2 border-white"
          />
        </div>
        <span class="text-sm text-gray-500">
          {{ activeUsers.length }} 人在线
        </span>
      </div>
    </div>

    <!-- 电子表格容器 -->
    <div ref="spreadsheetRef" class="flex-1 overflow-hidden" id="spreadsheet-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import type { CellOperation, ExcelContent } from '@/types/document'
import { useUserStore } from '@/stores/user'
import { documentApi, type Document } from '@/api/document'
import { useToast } from '@/components/ui/toast'
import { CellStyle, ExtendedCellStyle, BaseStyle } from 'x-data-spreadsheet'
import Spreadsheet from 'x-data-spreadsheet';

const TAG = '📃'


const props = defineProps<{
  documentId: string
}>()

const userStore = useUserStore()
const { toast } = useToast()

// 状态管理
const documentTitle = ref('')
const spreadsheetRef = ref<HTMLElement>()
const spreadsheet = ref<any>()
const socket = ref<Socket>()
const connectionStatus = ref('正在连接...')
const activeUsers = ref<Array<{userId: number; username: string; avatar: string}>>([])


// 修改 initSpreadsheet 函数
const initSpreadsheet = () => {
  if (!spreadsheetRef.value) return
  console.log(TAG, '初始化表格')
  
  spreadsheet.value = new Spreadsheet(spreadsheetRef.value, {
    mode: 'edit',
    showToolbar: true,
    showGrid: true,
    showContextmenu: true,
    view: {
      height: () => spreadsheetRef.value?.clientHeight || document.documentElement.clientHeight,
      width: () => spreadsheetRef.value?.clientWidth || document.documentElement.clientWidth,
    },
    row: {
      len: 100,
      height: 25,
    },
    col: {
      len: 26,
      width: 100,
      indexWidth: 60,
      minWidth: 60,
    },
    style: {
      bgcolor: '#ffffff',
      align: 'left',
      valign: 'middle',
      textwrap: false,
      strike: false,
      underline: false,
      color: '#0a0a0a',
      font: {
        name: 'Helvetica',
        size: 10,
        bold: false,
        italic: false,
      },
    },
  }).loadData({})

  // 监听单元格选择事件
  spreadsheet.value.on('cell-selected', (data: any) => {
    console.log(TAG, 'cell-selected:', data)
    if (data) {
      autoSave()
    }
  })

  // 监听单元格编辑事件
  spreadsheet.value.on('cell-edited', (text: any, ri: any, ci: any) => {
    console.log(TAG, 'cell-edited:', text, ri, ci)
    
    // 构建操作对象
    const operation: CellOperation = {
      type: 'updateCell',
      row: ri,
      column: ci,
      content: text,
      style: null, // 暂时不处理样式
      userId: userStore.userInfo?.id || 0,
    }

    // 发送操作
    socket.value?.emit('document:operation', {
      documentId: props.documentId,
      operation,
    }, () => {
      console.log(TAG, '发送操作成功')
    })
  })

  // 等待初始化完成
  return new Promise(resolve => setTimeout(resolve, 100))
}

// 修改 showEditingIndicator 函数
const showEditingIndicator = (
  userId: number, 
  row: number, 
  column: number,
  user?: { userId: number; username: string; avatar: string }
) => {
  // 打印调试信息
  console.log(TAG, '显示编辑提示:', {
    userId,
    currentUserId: userStore.userInfo?.id,
    isCurrentUser: userId === userStore.userInfo?.id,
    activeUsers: activeUsers.value,
    user,
    row,
    column
  })

  // 如果是当前用户的操作，不显示提示
  if (userId === userStore.userInfo?.id) return

  // 优先使用传入的用户信息，如果没有再从 activeUsers 中查找
  const userInfo = user || activeUsers.value.find(u => u.userId === userId)
  if (!userInfo || !spreadsheet.value) return

  // 获取表格容器
  const container = spreadsheetRef.value
  if (!container) return

  // 获取 canvas 元素
  const canvas = container.querySelector('.x-spreadsheet-table') as HTMLCanvasElement
  if (!canvas) return

  // 计算单元格位置
  const rowHeight = 25 // 默认行高
  const colWidth = 100 // 默认列宽
  const headerHeight = 25 // 表头高度
  const indexWidth = 60 // 索引列宽度

  // 创建或更新提示元素
  let indicator = document.getElementById(`editing-indicator-${userId}`)
  if (!indicator) {
    indicator = document.createElement('div')
    indicator.id = `editing-indicator-${userId}`
    indicator.className = 'editing-indicator'
    container.appendChild(indicator)
  }

  // 计算相对于 canvas 的位置
  const canvasRect = canvas.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const left = indexWidth + (column * colWidth)
  const top = headerHeight + (row * rowHeight) - 100 // 减去 100px 来调整纵向位置

  // 设置提示样式和内容
  Object.assign(indicator.style, {
    position: 'absolute',
    left: `${left + 5}px`, // 稍微偏右一点
    top: `${top + 225}px`, // 调整纵向位置
    backgroundColor: `hsl(${userId * 137.508} 70% 45%)`,
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '12px',
    zIndex: '1000',
    pointerEvents: 'none',
    transform: 'none',
    opacity: '0.9',
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255,255,255,0.2)'
  })
  indicator.textContent = `${userInfo.username} 正在编辑`

  // 3秒后自动隐藏
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator)
    }
  }, 3000)
}

// 修改 applyOperation 函数
const applyOperation = (operation: CellOperation, user?: { userId: number; username: string; avatar: string }) => {
  if (!spreadsheet.value) return
  console.log(TAG, '应用操作:', operation, '用户:', user)

  switch (operation.type) {
    case 'updateCell':
      // 显示编辑提示，优先使用传入的用户信息
      if (user) {
        showEditingIndicator(operation.userId, operation.row, operation.column, user)
      }
      // 更新单元格内容
      spreadsheet.value.cellText(operation.row, operation.column, operation.content).reRender()
      break

    case 'insertRow':
      spreadsheet.value.insertRow(operation.row)
      break

    case 'deleteRow':
      spreadsheet.value.deleteRow(operation.row)
      break

    case 'insertColumn':
      spreadsheet.value.insertColumn(operation.column)
      break

    case 'deleteColumn':
      spreadsheet.value.deleteColumn(operation.column)
      break
  }
}

// 添加获取变化单元格的辅助函数
interface CellChange {
  row: number
  col: number
  text?: string
  style?: ExtendedCellStyle
}


// 自动保存功能
let saveTimeout: NodeJS.Timeout
const autoSave = async () => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      if (!spreadsheet.value) return
      
      // 获取当前表格数据
      const data = spreadsheet.value.getData()
      console.log(TAG, '保存数据:', data)
      
      // 发送保存请求
      await documentApi.updateDocument(props.documentId, {
        content: JSON.stringify(data),
      })
      
      console.log(TAG, '文档已保存')
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: '无法保存文档内容'
      })
    }
  }, 3000)
}

// 修改 WebSocket 事件处理
const initWebSocket = () => {
  socket.value = io(import.meta.env.VITE_WS_URL_DOCUMENTS, {
    path: '/socket.io',
    auth: {
      token: `Bearer ${userStore.token}`,
      documentId: props.documentId
    },
    query: { documentId: props.documentId, token:  userStore.token},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  })

  socket.value.on('connect', () => {
    connectionStatus.value = '已连接'
    socket.value?.emit('document:join',  {
        documentId: props.documentId,
    }) 
  })

  socket.value.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error)
  })

  socket.value.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason)
  })
  // 监听用户列表
  socket.value.on('document:users', (users: Array<{ userId: number; username: string, avatar: string }>) => {
    // 去重处理
    const uniqueUsers = users.filter((user, index, self) => 
      index === self.findIndex(u => u.userId === user.userId)
    )
    activeUsers.value = uniqueUsers
  })
  // 监听其他用户的操作
  socket.value.on('document:operation', async (data: any) => {
    console.log(TAG, '收到操作:', data)    

    if (data.userId !== userStore.userInfo?.id) {
      // 解构 user 对象，避免传递 Proxy
      const userInfo =  {
        userId: data.userId,
        username: data.username,
        avatar: data.avatar
      } ;

      // 应用操作并传入用户信息
      applyOperation(data.operation, userInfo);          
    }
  });

  

  socket.value.on('document:user_joined', (user: any) => {
    console.log(TAG, '收到用户加入:', user)
    // 检查用户是否已存在
    const existingUserIndex = activeUsers.value.findIndex(u => u.userId === user.userId)
    if (existingUserIndex === -1) {
      // 用户不存在，添加到列表
      activeUsers.value.push(user)
    } else {
      // 用户已存在，更新信息
      activeUsers.value[existingUserIndex] = {
        ...activeUsers.value[existingUserIndex],
        ...user
      }
    }
    console.log(TAG, '当前在线用户:', activeUsers.value)
  })

  socket.value.on('user_left', (userId: number) => {
    console.log(TAG, '收到用户离开:', userId)
    activeUsers.value = activeUsers.value.filter(u => u.userId !== userId)
    console.log(TAG, '当前在线用户:', activeUsers.value)
  })

  socket.value.on('disconnect', () => {
    connectionStatus.value = '已断开连接'
    console.log(TAG, '断开连接')
  })
}

// 修改 loadDocument 函数
const loadDocument = async () => {
  try {
    const response = await documentApi.getDocument(props.documentId)
    console.log('API响应:', response)
    const doc = response as unknown as Document
    documentTitle.value = doc.title
    console.log('文档内容:', doc.content)
    if (doc.content) {
      const parsedContent = JSON.parse(doc.content)
      if (spreadsheet.value) {
        spreadsheet.value.loadData(parsedContent)
      }
    }
  } catch (error) {
    console.error('加载文档失败:', error)
    toast({
      variant: 'destructive',
      title: '加载失败',
      description: '无法加载文档内容'
    })
  }
}

onMounted(async () => {
  // 先初始化 WebSocket，确保能收到用户列表
  initWebSocket()
  // 等待连接建立
  await new Promise(resolve => {
    const checkConnection = () => {
      if (connectionStatus.value === '已连接') {
        resolve(true)
      } else {
        setTimeout(checkConnection, 100)
      }
    }
    checkConnection()
  })
  
  // 然后初始化表格和加载文档
  await initSpreadsheet()
  await loadDocument()
})

onUnmounted(() => {
  clearTimeout(saveTimeout)
  socket.value?.disconnect()
  
  // 清理所有编辑指示器
  document.querySelectorAll('.editing-indicator').forEach(el => {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  })
  
  // 清空容器
  if (spreadsheetRef.value) {
    spreadsheetRef.value.innerHTML = ''
  }
  
  // 清空引用
  spreadsheet.value = null
})

// 替代方案：使用 API 获取单元格位置
const getCellPosition = (row: number, column: number) => {
  if (!spreadsheet.value) return null
  
  // 获取表格的偏移量
  const table = spreadsheetRef.value?.querySelector('.x-spreadsheet-sheet')
  if (!table) return null
  
  const rect = table.getBoundingClientRect()
  const rowHeight = 25 // 默认行高
  const colWidth = 100 // 默认列宽
  const headerHeight = 25 // 表头高度
  const indexWidth = 60 // 索引列宽度
  
  return {
    left: rect.left + indexWidth + (column * colWidth),
    top: rect.top + headerHeight + (row * rowHeight)
  }
}
</script>

<style scoped>
.editing-indicator {
  position: absolute;
  animation: fadeInOut 3s ease-in-out;
  pointer-events: none;
  z-index: 1000;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(2px); }
  10% { opacity: 0.9; transform: translateY(0); }
  90% { opacity: 0.9; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-2px); }
}
</style>

