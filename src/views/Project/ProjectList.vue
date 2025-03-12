<template>
	<div class="h-screen flex overflow-hidden">
		<!-- 左侧项目导航 -->
		<div
			ref="sidebarRef"
			class="min-w-[200px] bg-[#1E2736] border-r border-[#2A3441] flex flex-col relative transition-width duration-75 ease-out h-screen"
			:style="{ width: sidebarWidth + 'px' }"
			:class="{ 'transition-none': isResizing }"
		>
			<!-- 头部 -->
			<div class="h-16 px-4 flex items-center justify-between border-b border-[#2A3441] flex-shrink-0">
				<h2 class="text-lg font-semibold text-[#E3E8EF] truncate">项目</h2>
				<button class="text-[#8B9BB4] hover:text-white transition-colors flex-shrink-0">
					<Plus class="w-5 h-5" />
				</button>
			</div>

			<!-- 项目列表 -->
			<div class="flex-1 overflow-y-auto px-2 py-3">
				<div class="text-[#8B9BB4] text-xs font-medium uppercase tracking-wider px-2 mb-2">我的项目</div>
				<div class="space-y-0.5">
					<button
						v-for="project in projects"
						:key="project.id"
						class="w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-[#8B9BB4] hover:bg-[#2A3441] hover:text-white transition-colors"
						:class="{ 'bg-[#2A3441] !text-white': selectedProject?.id === project.id }"
						@click="selectProject(project)"
					>
						<Hash class="w-4 h-4 flex-shrink-0" />
						<span class="text-sm truncate">{{ project.name }}</span>
					</button>
				</div>
			</div>

			<!-- 拖拽手柄 -->
			<div class="absolute top-0 right-0 w-4 h-full cursor-col-resize z-10 group" @mousedown="startResize">
				<div
					class="w-1 h-full bg-[#2A3441] group-hover:bg-blue-500 group-hover:opacity-70 mx-auto transition-colors"
				></div>
			</div>
		</div>

		<!-- 右侧内容区域 - 包含项目头部、聊天和信息标签页 -->
		<div class="flex-1 flex flex-col h-screen overflow-hidden">
			<!-- 项目头部 -->
			<div v-if="selectedProject" class="h-16 px-6 border-b flex items-center justify-between bg-white flex-shrink-0">
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
						<Briefcase class="w-4 h-4" />
					</div>
					<h1 class="text-lg font-medium">{{ selectedProject.name }}</h1>
					<span :class="`px-2 py-0.5 text-xs rounded-full ${getStatusClass(selectedProject.status)}`">
						{{ selectedProject.status }}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<!-- 项目成员头像 -->
					<div class="flex -space-x-2 ml-2">
						<img
							v-for="(member, index) in selectedProject.members.slice(0, 3)"
							:key="member.id"
							:src="member.avatar"
							:alt="member.name"
							class="w-6 h-6 rounded-full border border-white"
							:title="member.name"
						/>
						<div
							v-if="selectedProject.members.length > 3"
							class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border border-white"
							:title="
								selectedProject.members
									.slice(3)
									.map(m => m.name)
									.join(', ')
							"
						>
							+{{ selectedProject.members.length - 3 }}
						</div>
					</div>
					<!-- 提醒 -->
					<button class="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
						<Bell class="w-5 h-5" />
					</button>
					<!-- 功能 -->
					<button class="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100">
						<MoreVertical class="w-5 h-5" />
					</button>
				</div>
			</div>

			<!-- 下方内容区域 - 聊天和右侧信息 -->
			<div class="flex-1 flex overflow-hidden">
				<!-- 中间聊天区域 -->
				<div class="flex-1 flex flex-col overflow-hidden">
					<!-- 主体内容区域 - 聊天 -->
					<div class="flex-1 flex flex-col overflow-hidden">
						<!-- 如果没有选择项目，显示空状态 -->
						<div v-if="!selectedProject" class="flex-1 flex flex-col items-center justify-center text-gray-400">
							<Briefcase class="w-16 h-16 mb-4 opacity-30" />
							<p class="text-lg">请从左侧选择一个项目</p>
						</div>

						<!-- 如果选择了项目，显示聊天区域 -->
						<template v-else>
							<!-- 钉选消息区域 -->
							<div v-if="pinnedMessages.length > 0" class="border-b bg-gray-50 flex-shrink-0">
								<div class="px-6 py-2 flex items-center justify-between text-gray-500">
									<div class="flex items-center gap-2">
										<Pin class="w-4 h-4" />
										<span class="text-sm font-medium">已钉选消息</span>
										<span class="text-xs bg-gray-200 rounded-full px-2 py-0.5">{{ pinnedMessages.length }}</span>
									</div>
									<button @click="showAllPinned = !showAllPinned" class="text-xs text-blue-500 hover:text-blue-600">
										{{ showAllPinned ? '收起' : '查看全部' }}
									</button>
								</div>

								<!-- 钉选消息列表 -->
								<div class="max-h-60 overflow-y-auto" :class="{ 'max-h-24': !showAllPinned }">
									<div
										v-for="(message, index) in pinnedMessages"
										:key="'pinned-' + message.id"
										class="px-6 py-2 hover:bg-gray-100 flex items-start gap-3 group border-t border-gray-100 first:border-t-0"
									>
										<img
											:src="message.user.avatar"
											:alt="message.user.name"
											class="w-6 h-6 rounded-full flex-shrink-0"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="font-medium text-sm">{{ message.user.name }}</span>
												<span class="text-xs text-gray-400">{{ formatMessageTime(message.timestamp) }}</span>
											</div>
											<p class="text-sm text-gray-700 line-clamp-2">{{ message.content }}</p>
										</div>
										<button
											@click="unpinMessage(message.id)"
											class="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
											title="取消钉选"
										>
											<X class="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>

							<!-- 聊天消息区域 -->
							<div class="flex-1 overflow-y-auto p-6 space-y-4">
								<div v-for="(message, index) in projectMessages" :key="index">
									<!-- 日期分割线 -->
									<div
										v-if="shouldShowDateDivider(message, projectMessages[index - 1])"
										class="flex items-center justify-center my-6"
									>
										<div class="flex-1 h-px bg-gray-100"></div>
										<div class="text-xs text-gray-400 bg-white px-4">{{ formatMessageDate(message.timestamp) }}</div>
										<div class="flex-1 h-px bg-gray-100"></div>
									</div>

									<!-- 消息气泡 -->
									<div :class="['flex gap-3 group', message.isSelf ? 'flex-row-reverse' : '']">
										<img
											:src="message.user.avatar"
											:alt="message.user.name"
											class="w-8 h-8 rounded-full flex-shrink-0"
										/>
										<div
											:class="[
												'max-w-[70%] rounded-lg px-4 py-3 relative',
												message.isSelf ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700',
											]"
										>
											<div class="flex items-center gap-2" :class="[message.isSelf ? 'flex-row-reverse' : '']">
												<span class="font-medium text-sm">{{ message.user.name }}</span>
												<span class="text-xs opacity-60">{{ formatMessageTime(message.timestamp) }}</span>
											</div>
											<p class="mt-1">{{ message.content }}</p>

											<!-- 消息操作按钮 -->
											<div
												class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
												:class="{ 'left-2 right-auto': message.isSelf }"
											>
												<div class="flex items-center gap-1 bg-white shadow-md rounded-full p-1">
													<button
														@click="togglePinMessage(message)"
														class="p-1 rounded-full hover:bg-gray-100"
														:class="{ 'text-blue-500': isPinned(message.id) }"
														:title="isPinned(message.id) ? '取消钉选' : '钉选消息'"
													>
														<Pin class="w-3.5 h-3.5" />
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- 输入框区域 -->
							<div class="border-t p-4 flex-shrink-0 bg-white">
								<div class="flex items-end gap-2">
									<div class="flex-1 bg-gray-100 rounded-lg p-3">
										<textarea
											v-model="messageInput"
											rows="1"
											placeholder="发送消息..."
											class="w-full bg-transparent border-0 resize-none focus:outline-none text-sm"
											@keydown.enter.prevent="sendMessage"
										></textarea>
									</div>
									<button
										class="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
										:disabled="!messageInput.trim()"
										@click="sendMessage"
									>
										<Send class="w-5 h-5" />
									</button>
								</div>
							</div>
						</template>
					</div>
				</div>

				<!-- 右侧信息标签页 -->
				<div v-if="selectedProject" class="w-[300px] border-l flex flex-col bg-white">
					<Tabs default-value="info" class="flex flex-col h-full">
						<div class="border-b">
							<TabsList class="h-10 bg-transparent space-x-6 px-4">
								<TabsTrigger value="info">Info</TabsTrigger>
								<TabsTrigger value="pins">Pins</TabsTrigger>
								<TabsTrigger value="files">Files</TabsTrigger>
								<TabsTrigger value="links">Links</TabsTrigger>
							</TabsList>
						</div>

						<!-- 标签内容容器 -->
						<div class="flex-1 overflow-hidden relative">
							<!-- Info 标签内容 -->
							<TabsContent value="info" class="absolute inset-0 flex flex-col data-[state=inactive]:hidden">
								<div class="flex-1 overflow-y-auto">
									<div class="p-4 space-y-4">
										<!-- 主要信息 -->
										<div class="space-y-2">
											<h3 class="text-sm font-medium text-gray-500 uppercase">Main info</h3>
											<div class="space-y-1">
												<div class="flex items-center justify-between">
													<span class="text-sm text-gray-500">Creator</span>
													<div class="flex items-center gap-2">
														<img :src="selectedProject.members[0].avatar" class="w-5 h-5 rounded-full" />
														<span class="text-sm">{{ selectedProject.members[0].name }}</span>
													</div>
												</div>
												<div class="flex items-center justify-between">
													<span class="text-sm text-gray-500">Status</span>
													<span :class="`px-2 py-0.5 text-xs rounded-full ${getStatusClass(selectedProject.status)}`">
														{{ selectedProject.status }}
													</span>
												</div>
												<div class="flex items-center justify-between">
													<span class="text-sm text-gray-500">Progress</span>
													<span class="text-sm">{{ selectedProject.progress }}%</span>
												</div>
											</div>
										</div>

										<!-- 日期信息 -->
										<div class="space-y-2">
											<h3 class="text-sm font-medium text-gray-500 uppercase">Dates</h3>
											<div class="space-y-1">
												<div class="flex items-center justify-between">
													<span class="text-sm text-gray-500">Start date</span>
													<span class="text-sm">{{ selectedProject.startDate }}</span>
												</div>
												<div class="flex items-center justify-between">
													<span class="text-sm text-gray-500">Due date</span>
													<span class="text-sm">{{ selectedProject.dueDate }}</span>
												</div>
											</div>
										</div>

										<!-- 项目描述 -->
										<div class="space-y-2">
											<h3 class="text-sm font-medium text-gray-500 uppercase">Description</h3>
											<p class="text-sm text-gray-600">{{ selectedProject.description }}</p>
										</div>
									</div>
								</div>
							</TabsContent>

							<!-- Pins 标签内容 -->
							<TabsContent value="pins" class="absolute inset-0 flex flex-col data-[state=inactive]:hidden">
								<div class="flex-1 overflow-y-auto">
									<div class="p-4 space-y-3">
										<div
											v-for="message in pinnedMessages"
											:key="message.id"
											class="p-3 bg-white rounded-lg border border-gray-200"
										>
											<div class="flex items-start gap-3">
												<img :src="message.user.avatar" :alt="message.user.name" class="w-8 h-8 rounded-full" />
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2">
														<span class="font-medium text-sm">{{ message.user.name }}</span>
														<span class="text-xs text-gray-500">{{ formatMessageTime(message.timestamp) }}</span>
													</div>
													<p class="text-sm text-gray-600 mt-1">{{ message.content }}</p>
												</div>
											</div>
										</div>
									</div>
								</div>
							</TabsContent>

							<!-- Files 标签内容 -->
							<TabsContent value="files" class="absolute inset-0 flex flex-col data-[state=inactive]:hidden">
								<div class="flex-1 overflow-y-auto">
									<div class="p-4 space-y-3">
										<div
											v-for="doc in projectDocuments"
											:key="doc.name"
											class="p-3 bg-white rounded-lg border border-gray-200 flex items-center gap-3"
										>
											<div class="w-9 h-9 rounded bg-blue-50 text-blue-500 flex items-center justify-center">
												<component :is="getDocumentIcon(doc.type)" class="w-4 h-4" />
											</div>
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium truncate">{{ doc.name }}</div>
												<div class="text-xs text-gray-500 mt-0.5">{{ doc.updatedAt }}</div>
											</div>
											<button class="p-1.5 text-gray-400 hover:text-gray-600" title="下载文档">
												<Download class="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							</TabsContent>

							<!-- Links 标签内容 -->
							<TabsContent value="links" class="absolute inset-0 flex flex-col data-[state=inactive]:hidden">
								<div class="flex-1 overflow-y-auto">
									<div class="p-4 space-y-3">
										<div class="p-3 bg-white rounded-lg border border-gray-200">
											<div class="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
												<Code class="w-3.5 h-3.5" />
												<span>前端仓库</span>
											</div>
											<div class="flex items-center gap-2">
												<a href="#" class="text-sm text-blue-500 hover:text-blue-600 truncate flex-1">
													github.com/organization/project-frontend
												</a>
												<button class="p-1.5 text-gray-400 hover:text-gray-600" title="复制链接">
													<Copy class="w-4 h-4" />
												</button>
											</div>
										</div>
										<!-- 其他链接项 -->
									</div>
								</div>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</div>
		</div>

		<!-- 拖拽时的遮罩层，防止选中文本 -->
		<div v-if="isResizing" class="fixed inset-0 bg-transparent z-50 cursor-col-resize"></div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
	Plus,
	Hash,
	Search,
	Filter,
	Calendar,
	Briefcase,
	MessageSquare,
	Send,
	Bell,
	MoreVertical,
	Code,
	Server,
	Globe,
	Copy,
	Pin,
	X,
	PlusCircle,
	Activity,
	FileText,
	Link,
	CheckSquare,
	Upload,
	Download,
} from 'lucide-vue-next'
import { FileText as FileTextIcon, File, FileSpreadsheet, Image } from 'lucide-vue-next'
import { format, isToday, isYesterday } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 侧边栏宽度控制
const sidebarRef = ref(null)
const sidebarWidth = ref(250) // 默认宽度
const minWidth = 200 // 最小宽度
const maxWidth = 400 // 最大宽度
const isResizing = ref(false)
const initialX = ref(0)
const initialWidth = ref(0)

// 开始调整大小
const startResize = e => {
	isResizing.value = true
	initialX.value = e.clientX
	initialWidth.value = sidebarWidth.value

	document.addEventListener('mousemove', handleMouseMove)
	document.addEventListener('mouseup', stopResize)

	// 添加类以防止文本选择
	document.body.classList.add('resize-active')

	// 防止文本选择
	e.preventDefault()
}

// 处理鼠标移动
const handleMouseMove = e => {
	if (!isResizing.value) return

	// 计算鼠标移动的距离
	const dx = e.clientX - initialX.value

	// 计算新宽度
	const newWidth = initialWidth.value + dx

	// 限制最小和最大宽度
	if (newWidth >= minWidth && newWidth <= maxWidth) {
		sidebarWidth.value = newWidth
	} else if (newWidth < minWidth) {
		sidebarWidth.value = minWidth
	} else if (newWidth > maxWidth) {
		sidebarWidth.value = maxWidth
	}

	// 使用 requestAnimationFrame 优化性能
	requestAnimationFrame(() => {
		document.body.style.cursor = 'col-resize'
	})
}

// 停止调整大小
const stopResize = () => {
	isResizing.value = false
	document.removeEventListener('mousemove', handleMouseMove)
	document.removeEventListener('mouseup', stopResize)

	// 移除防止文本选择的类
	document.body.classList.remove('resize-active')
	document.body.style.cursor = ''
}

// 组件卸载时清理事件监听器
onUnmounted(() => {
	document.removeEventListener('mousemove', handleMouseMove)
	document.removeEventListener('mouseup', stopResize)
	document.body.classList.remove('resize-active')
	document.body.style.cursor = ''
})

// 模拟项目数据
const projects = ref([
	{
		id: 1,
		name: '城市运行管理服务平台标准体系建设',
		description:
			'建立城市运行管理服务平台标准体系，包括数据标准、接口标准、服务标准等。该项目旨在提高城市管理效率，实现数据互通共享，为智慧城市建设提供标准支撑。',
		status: '进行中',
		startDate: '2025-01-15',
		dueDate: '2025-06-30',
		progress: 65,
		members: [
			{ id: 1, name: '张三', role: '项目经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
			{ id: 2, name: '李四', role: '技术负责人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
			{ id: 3, name: '王五', role: '产品经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
			{ id: 4, name: '赵六', role: '开发工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
		],
	},
	{
		id: 2,
		name: '公司级开放技术架构研发',
		description:
			'研发公司级开放技术架构，支持多种应用场景，提高开发效率和系统稳定性。该架构将采用微服务设计，支持容器化部署，并提供完善的API管理和服务治理能力。',
		status: '规划中',
		startDate: '2025-03-01',
		dueDate: '2025-08-15',
		progress: 20,
		members: [
			{ id: 1, name: '张三', role: '架构师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
			{ id: 5, name: '钱七', role: '开发工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
		],
	},
	{
		id: 3,
		name: '数字院与智慧城市公共可产品整合研究',
		description:
			'研究数字院与智慧城市公共产品的整合方案，提出可行性建议和实施路径。通过整合现有资源，避免重复建设，提高资源利用效率，为城市数字化转型提供支撑。',
		status: '已完成',
		startDate: '2024-11-05',
		dueDate: '2025-03-10',
		progress: 100,
		members: [
			{ id: 2, name: '李四', role: '研究员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
			{ id: 3, name: '王五', role: '分析师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
			{ id: 6, name: '孙八', role: '顾问', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
		],
	},
	{
		id: 4,
		name: '智慧园区数字孪生平台建设项目',
		description:
			'建设智慧园区数字孪生平台，实现园区可视化管理、智能分析和预测决策。该平台将整合物联网、大数据、人工智能等技术，构建园区的数字映射，实现实时监控和智能管理。',
		status: '进行中',
		startDate: '2025-02-20',
		dueDate: '2025-09-20',
		progress: 45,
		members: [
			{ id: 4, name: '赵六', role: '项目经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
			{ id: 5, name: '钱七', role: '技术专家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
			{ id: 6, name: '孙八', role: '开发工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
			{ id: 7, name: '周九', role: '测试工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
		],
	},
	{
		id: 5,
		name: '智慧交通大数据分析平台',
		description:
			'基于城市交通大数据，构建智能分析平台，提供交通态势感知和决策支持。该平台将利用人工智能算法对交通数据进行深度挖掘，为交通管理部门提供科学决策依据。',
		status: '已暂停',
		startDate: '2025-01-10',
		dueDate: '2025-10-15',
		progress: 30,
		members: [
			{ id: 1, name: '张三', role: '数据科学家', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
			{ id: 3, name: '王五', role: '产品经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
			{ id: 7, name: '周九', role: '开发工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
		],
	},
])

const selectedProject = ref(null)

// 选择项目
const selectProject = project => {
	selectedProject.value = project
}

// 根据状态获取样式类
const getStatusClass = (status: string) => {
	switch (status) {
		case '进行中':
			return 'bg-blue-100 text-blue-700'
		case '规划中':
			return 'bg-purple-100 text-purple-700'
		case '已完成':
			return 'bg-green-100 text-green-700'
		case '已暂停':
			return 'bg-orange-100 text-orange-700'
		default:
			return 'bg-gray-100 text-gray-700'
	}
}

// 获取项目进度
const getProjectProgress = project => {
	return project.progress || 0
}

// 模拟最近活动数据
const recentActivities = [
	{
		user: {
			name: '张三',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
		},
		time: '今天 10:23',
		content: '更新了项目进度到 65%',
	},
	{
		user: {
			name: '李四',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
		},
		time: '昨天 16:45',
		content: '上传了新文档《数据标准规范 v2.0》',
	},
	{
		user: {
			name: '王五',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
		},
		time: '昨天 09:12',
		content: '完成了"用户管理模块"的需求分析',
	},
]

// 模拟项目文档
const projectDocuments = [
	{
		name: '项目需求说明书.docx',
		type: 'doc',
		updatedAt: '2025-02-15',
	},
	{
		name: '系统架构设计.pptx',
		type: 'ppt',
		updatedAt: '2025-02-20',
	},
	{
		name: '数据标准规范 v2.0.xlsx',
		type: 'excel',
		updatedAt: '2025-03-05',
	},
	{
		name: '项目进度甘特图.png',
		type: 'image',
		updatedAt: '2025-03-10',
	},
]

// 获取文档图标
const getDocumentIcon = (type: string) => {
	switch (type) {
		case 'doc':
			return FileTextIcon
		case 'image':
			return Image
		case 'excel':
			return FileSpreadsheet
		default:
			return File
	}
}

// 模拟项目任务数据
const projectTasks = {
	total: 24,
	completed: 10,
	inProgress: 8,
	pending: 6,
}

// 消息输入
const messageInput = ref('')

// 模拟项目消息数据
const projectMessages = ref([
	{
		id: 1,
		content: '我已经更新了数据标准文档，请大家查看一下',
		timestamp: '2024-03-15T10:30:00',
		user: {
			id: 1,
			name: '张三',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
		},
		isSelf: false,
	},
	{
		id: 2,
		content: '好的，我待会看看',
		timestamp: '2024-03-15T10:32:00',
		user: {
			id: 2,
			name: '李四',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
		},
		isSelf: true,
	},
	// ... 更多消息
])

// 发送消息
const sendMessage = () => {
	if (!messageInput.value.trim()) return

	const newMessage = {
		id: Date.now(),
		content: messageInput.value,
		timestamp: new Date().toISOString(),
		user: {
			id: 2, // 当前用户ID
			name: '李四',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
		},
		isSelf: true,
	}

	projectMessages.value.push(newMessage)
	messageInput.value = ''
}

// 判断是否需要显示日期分割线
const shouldShowDateDivider = (currentMessage, previousMessage) => {
	if (!previousMessage) return true
	const currentDate = new Date(currentMessage.timestamp).toDateString()
	const previousDate = new Date(previousMessage.timestamp).toDateString()
	return currentDate !== previousDate
}

// 格式化消息日期
const formatMessageDate = (timestamp: string) => {
	const date = new Date(timestamp)
	if (isToday(date)) return '今天'
	if (isYesterday(date)) return '昨天'
	return format(date, 'yyyy年M月d日')
}

// 格式化消息时间
const formatMessageTime = (timestamp: string) => {
	return format(new Date(timestamp), 'HH:mm')
}

// 钉选消息相关
const pinnedMessageIds = ref<number[]>([])
const showAllPinned = ref(false)

// 计算钉选消息列表
const pinnedMessages = computed(() => {
	return projectMessages.value
		.filter(msg => pinnedMessageIds.value.includes(msg.id))
		.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

// 检查消息是否已钉选
const isPinned = (messageId: number) => {
	return pinnedMessageIds.value.includes(messageId)
}

// 切换消息钉选状态
const togglePinMessage = message => {
	if (isPinned(message.id)) {
		unpinMessage(message.id)
	} else {
		pinMessage(message.id)
	}
}

// 钉选消息
const pinMessage = (messageId: number) => {
	if (!pinnedMessageIds.value.includes(messageId)) {
		pinnedMessageIds.value.push(messageId)
	}
}

// 取消钉选
const unpinMessage = (messageId: number) => {
	pinnedMessageIds.value = pinnedMessageIds.value.filter(id => id !== messageId)
}
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar,
.overflow-auto::-webkit-scrollbar {
	width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track,
.overflow-auto::-webkit-scrollbar-track {
	background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb,
.overflow-auto::-webkit-scrollbar-thumb {
	background-color: rgba(139, 155, 180, 0.3);
	border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover,
.overflow-auto::-webkit-scrollbar-thumb:hover {
	background-color: rgba(139, 155, 180, 0.5);
}

/* 禁止文本选择，避免拖拽时选中文本 */
.cursor-col-resize {
	user-select: none;
}

/* 添加过渡效果 */
.transition-width {
	transition-property: width;
}

/* 拖拽时禁用文本选择 */
:global(.resize-active) {
	user-select: none !important;
	cursor: col-resize !important;
}

/* 添加新的样式 */
textarea {
	min-height: 24px;
	max-height: 120px;
}

textarea::-webkit-scrollbar {
	width: 4px;
}

textarea::-webkit-scrollbar-track {
	background: transparent;
}

textarea::-webkit-scrollbar-thumb {
	background-color: rgba(0, 0, 0, 0.2);
	border-radius: 2px;
}

/* 添加新样式 */
.line-clamp-2 {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
