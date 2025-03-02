<template>
	<Sheet :open="modelValue" @update:open="$emit('update:modelValue', $event)">
		<SheetContent class="w-[400px] sm:w-[540px]" position="right">
			<SheetHeader>
				<SheetTitle>{{ title }}</SheetTitle>
				<SheetDescription>{{ description }}</SheetDescription>
			</SheetHeader>

			<!-- 群聊信息 -->
			<div v-if="chat?.type === 'GROUP'" class="py-6">
				<div class="space-y-6">
					<!-- 群头像 -->
					<div class="flex justify-center">
						<img :src="chat.avatar" :alt="chat.name" class="w-24 h-24 rounded-2xl object-cover" />
					</div>

					<!-- 群名称 -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-500">群聊名称</label>
						<p class="text-base">{{ chat.name }}</p>
					</div>

					<!-- 群公告 -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-500">群公告</label>
						<p class="text-base">{{ chat.description || '暂无公告' }}</p>
					</div>

					<!-- 群成员 -->
					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<label class="text-sm font-medium text-gray-500">群成员 ({{ chat.participants.length }})</label>
							<Button v-if="isGroupOwner" variant="ghost" size="sm">
								<UserPlus class="w-4 h-4 mr-2" />
								邀请
							</Button>
						</div>
						<div class="grid grid-cols-5 gap-4">
							<div v-for="member in chat.participants" :key="member.id" class="text-center">
								<img :src="member.avatar" :alt="member.username" class="w-12 h-12 rounded-full mx-auto mb-1" />
								<p class="text-xs truncate">{{ member.username }}</p>
							</div>
						</div>
					</div>

					<!-- 群设置 -->
					<div v-if="isGroupOwner" class="space-y-4 pt-4">
						<Separator />
						<div class="space-y-4">
							<h4 class="text-sm font-medium text-gray-500">群设置</h4>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<label class="text-sm">群内禁言</label>
									<Switch />
								</div>
								<div class="flex items-center justify-between">
									<label class="text-sm">入群验证</label>
									<Switch />
								</div>
							</div>
						</div>
					</div>

					<!-- 退出群聊 -->
					<div class="pt-4">
						<Separator />
						<Button variant="destructive" class="w-full mt-4" @click="handleLeaveGroup">退出群聊</Button>
					</div>
				</div>
			</div>

			<!-- 用户信息 -->
			<div v-else class="py-6">
				<div class="space-y-6">
					<!-- 用户头像 -->
					<div class="flex justify-center">
						<img
							:src="getPrivateChatAvatar(chat)"
							:alt="getPrivateChatName(chat)"
							class="w-24 h-24 rounded-full object-cover"
						/>
					</div>

					<!-- 用户名称 -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-500">用户名</label>
						<p class="text-base">{{ getPrivateChatName(chat) }}</p>
					</div>

					<!-- 职务 -->
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-500">职务</label>
						<p class="text-base">{{ getPrivateChatDuty(chat) }}</p>
					</div>

					<!-- 操作按钮 -->
					<div class="space-y-4 pt-4">
						<Separator />
						<Button variant="outline" class="w-full" @click="handleClearHistory">
							<Eraser class="w-4 h-4 mr-2" />
							清空聊天记录
						</Button>
						<Button variant="destructive" class="w-full" @click="handleBlock">
							<Ban class="w-4 h-4 mr-2" />
							屏蔽
						</Button>
					</div>
				</div>
			</div>
		</SheetContent>
	</Sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { ChatInfo } from '@/stores/chat'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { UserPlus, Eraser, Ban } from 'lucide-vue-next'

const props = defineProps<{
	modelValue: boolean
	chat?: ChatInfo
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
}>()

const userStore = useUserStore()

// 标题和描述
const title = computed(() => {
	return props.chat?.type === 'GROUP' ? '群聊信息' : '用户信息'
})

const description = computed(() => {
	return props.chat?.type === 'GROUP' ? '查看和管理群聊信息' : '查看用户资料'
})

// 判断是否为群主
const isGroupOwner = computed(() => {
	return props.chat?.type === 'GROUP' && props.chat?.creator?.id === userStore.userInfo?.id
})

// 获取私聊对象信息的方法
const getPrivateChatAvatar = (chat: ChatInfo) => {
	if (!userStore.userInfo) return ''
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.avatar || ''
}

const getPrivateChatName = (chat: ChatInfo) => {
	if (!userStore.userInfo) return '未知用户'
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.username || '未知用户'
}

const getPrivateChatDuty = (chat: ChatInfo) => {
	if (!userStore.userInfo) return ''
	const otherParticipant = chat.participants.find(p => p.id !== userStore.userInfo?.id)
	return otherParticipant?.dutyName || ''
}

// 处理操作
const handleLeaveGroup = () => {
	// TODO: 实现退出群聊
	console.log('退出群聊')
}

const handleClearHistory = () => {
	// TODO: 实现清空聊天记录
	console.log('清空聊天记录')
}

const handleBlock = () => {
	// TODO: 实现屏蔽功能
	console.log('屏蔽用户')
}
</script>
