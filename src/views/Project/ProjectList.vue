<template>
	<div class="h-screen flex">
		<!-- 左侧项目列表 -->
		<div class="w-64 bg-[#1E2736] border-r border-[#2A3441]">
			<div class="h-16 px-4 flex items-center justify-between border-b border-[#2A3441]">
				<h2 class="text-lg font-semibold text-[#E3E8EF]">项目</h2>
				<button class="text-[#8B9BB4] hover:text-white transition-colors">
					<Plus class="w-5 h-5" />
				</button>
			</div>

			<!-- 项目列表 -->
			<div class="p-2 space-y-1">
				<button
					v-for="project in projects"
					:key="project.id"
					class="w-full px-3 py-2 rounded-md flex items-center gap-2 text-[#8B9BB4] hover:bg-[#2A3441] hover:text-white transition-colors"
					:class="{ 'bg-[#2A3441] !text-white': selectedProject?.id === project.id }"
					@click="selectProject(project)"
				>
					<Hash class="w-4 h-4" />
					<span class="text-sm">{{ project.name }}</span>
				</button>
			</div>
		</div>

		<!-- 右侧内容区域 -->
		<div class="flex-1 bg-white flex flex-col">
			<template v-if="selectedProject">
				<!-- 项目头部 -->
				<div class="h-16 px-4 flex items-center justify-between border-b">
					<div class="flex items-center gap-2">
						<h1 class="text-lg font-semibold">{{ selectedProject.name }}</h1>
						<span class="text-sm text-gray-500">{{ selectedProject.members.length }} 个成员</span>
					</div>
				</div>

				<!-- 修改项目内容部分 -->
				<div class="flex-1">
					<!-- 左侧讨论区 -->
					<div class="flex-1 p-4 border-r overflow-y-auto">
						<div class="space-y-6">
							<div v-for="discussion in selectedProject.discussions" :key="discussion.id" class="space-y-2">
								<!-- 用户信息和时间 -->
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<img :src="discussion.user.avatar" :alt="discussion.user.name" class="w-8 h-8 rounded-lg" />
										<span class="font-medium">{{ discussion.user.name }}</span>
									</div>
									<span class="text-sm text-gray-500">{{ discussion.time }}</span>
								</div>

								<!-- 回复引用 -->
								<div v-if="discussion.replyTo" class="ml-10 p-2 rounded bg-gray-50 text-sm text-gray-600">
									<span class="font-medium">{{ discussion.replyTo.name }}:</span>
									{{ discussion.replyTo.content }}
								</div>

								<!-- 消息内容 -->
								<div class="ml-10">
									<p class="text-gray-700">{{ discussion.content }}</p>

									<!-- 附件 -->
									<div v-if="discussion.attachments" class="mt-2 space-y-2">
										<div
											v-for="(attachment, index) in discussion.attachments"
											:key="index"
											class="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
										>
											<!-- 图片类型 -->
											<template v-if="attachment.type === 'image'">
												<div class="w-12 h-12 rounded-lg overflow-hidden">
													<img :src="attachment.url" class="w-full h-full object-cover" />
												</div>
												<div>
													<div class="font-medium">{{ attachment.name }}</div>
													<div class="text-sm text-gray-500">{{ attachment.size }}</div>
												</div>
												<ImageIcon class="w-5 h-5 text-gray-400 ml-auto" />
											</template>

											<!-- 文件类型 -->
											<template v-else>
												<div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
													<FileText class="w-5 h-5 text-red-500" />
												</div>
												<div>
													<div class="font-medium">{{ attachment.name }}</div>
													<div class="text-sm text-gray-500">{{ attachment.size }}</div>
												</div>
												<Link class="w-5 h-5 text-gray-400 ml-auto" />
											</template>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- 右侧日程区 -->
					<div class="w-80 p-4 bg-gray-50">
						<!-- 日历事项 -->
						<div class="mb-6">
							<div class="flex items-center gap-2 mb-4">
								<div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
									<Calendar class="w-5 h-5 text-blue-500" />
								</div>
								<div>
									<h3 class="font-medium">{{ selectedProject.nextMeeting?.title }}</h3>
									<p class="text-sm text-gray-500">{{ selectedProject.nextMeeting?.time }}</p>
								</div>
							</div>
							<div class="text-sm text-gray-500">{{ selectedProject.nextMeeting?.participants }} 人参与</div>
						</div>

						<!-- 成员列表 -->
						<div>
							<h3 class="font-medium mb-2">项目成员</h3>
							<div class="space-y-2">
								<div
									v-for="member in selectedProject.members"
									:key="member.id"
									class="flex items-center gap-2 text-sm text-gray-600"
								>
									<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
										{{ member.name[0] }}
									</div>
									{{ member.name }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>

			<template v-else>
				<div class="h-full flex items-center justify-center text-gray-400">选择一个项目查看详情</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Hash, Plus, Calendar, MessageSquare, FileText, Link, Image as ImageIcon } from 'lucide-vue-next'

// 模拟的项目数据
const projects = ref([
	{
		id: 1,
		name: '项目-星河',
		members: [
			{ id: 1, name: '张三' },
			{ id: 2, name: '李四' },
			{ id: 3, name: '王五' },
		],
		nextMeeting: {
			title: '项目进展状况会议',
			time: '北京时间今天下午 1:30-2:00',
			participants: 6,
		},
		discussions: [
			{
				id: 1,
				user: {
					name: '张三',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
				},
				content: '我更新了首页的设计稿，大家看看有什么意见',
				time: '10:30',
				attachments: [
					{
						type: 'image',
						name: '首页设计稿_v2.png',
						size: '2.4MB',
						url: 'https://picsum.photos/800/600',
					},
				],
			},
			{
				id: 2,
				user: {
					name: '李四',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
				},
				content: '整体看起来不错，我建议导航栏的间距可以再调整一下',
				time: '10:35',
				replyTo: {
					name: '张三',
					content: '我更新了首页的设计稿，大家看看有什么意见',
				},
			},
			{
				id: 3,
				user: {
					name: '王五',
					avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
				},
				content: '这是我整理的上周会议纪要',
				time: '11:20',
				attachments: [
					{
						type: 'file',
						name: '项目周报.pdf',
						size: '568KB',
						icon: 'pdf',
					},
				],
			},
		],
	},
	{
		id: 2,
		name: '团队-营销',
		members: [
			{ id: 1, name: '张三' },
			{ id: 4, name: '赵六' },
		],
	},
])

const selectedProject = ref(projects.value[0])

const selectProject = (project: any) => {
	selectedProject.value = project
}

// 格式化文件大小
const formatFileSize = (size: string) => size
</script>
