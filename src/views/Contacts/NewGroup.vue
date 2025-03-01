<template>
	<div class="flex flex-col h-full">
		<!-- 顶部导航 -->
		<div class="h-14 border-b flex items-center px-4 shrink-0">
			<button class="mr-4" @click="router.back()">
				<ArrowLeft class="w-5 h-5 text-gray-600" />
			</button>
			<h1 class="text-lg font-medium">创建群聊</h1>
		</div>

		<!-- 主要内容 -->
		<div class="flex-1 overflow-y-auto p-4">
			<!-- 群聊信息 -->
			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 mb-2">群聊名称</label>
				<input
					v-model="groupName"
					type="text"
					placeholder="请输入群聊名称"
					class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- 选择成员 -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">选择群成员</label>
				<div class="space-y-2">
					<div
						v-for="contact in contacts"
						:key="contact.id"
						class="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
						@click="toggleSelect(contact)"
					>
						<input type="checkbox" :checked="selectedContacts.has(contact.id)" class="mr-3" @click.stop />
						<img :src="contact.avatar" :alt="contact.username" class="w-10 h-10 rounded-full" />
						<span class="ml-3">{{ contact.username }}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- 底部按钮 -->
		<div class="h-16 border-t flex items-center justify-between px-4 shrink-0">
			<span class="text-sm text-gray-500">已选择 {{ selectedContacts.size }} 人</span>
			<button
				class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
				:disabled="!canCreate"
				@click="handleCreate"
			>
				创建群聊
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const contactStore = useContactStore()
const chatStore = useChatStore()

const groupName = ref('')
const selectedContacts = ref(new Set<number>())

// 获取联系人列表
const contacts = computed(() => contactStore.contacts)

// 是否可以创建群聊
const canCreate = computed(() => {
	return groupName.value.trim() && selectedContacts.value.size >= 2
})

// 切换选择状态
const toggleSelect = (contact: any) => {
	if (selectedContacts.value.has(contact.id)) {
		selectedContacts.value.delete(contact.id)
	} else {
		selectedContacts.value.add(contact.id)
	}
}

// 创建群聊
const handleCreate = async () => {
	try {
		const chat = await chatStore.createGroupChat({
			name: groupName.value,
			participants: Array.from(selectedContacts.value),
		})

		router.push({
			name: 'Chat',
			params: { id: chat.id },
		})
	} catch (error) {
		console.error('创建群聊失败:', error)
		// TODO: 显示错误提示
	}
}

// 组件挂载时获取联系人列表
onMounted(async () => {
	if (contactStore.contacts.length === 0) {
		await contactStore.fetchContacts()
	}
})
</script>
