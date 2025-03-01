<template>
	<Dialog :open="open" @update:open="$emit('update:open', $event)">
		<DialogContent class="sm:max-w-[500px]">
			<DialogHeader>
				<DialogTitle>创建群聊</DialogTitle>
				<DialogDescription>选择联系人创建新的群聊</DialogDescription>
			</DialogHeader>

			<div class="py-4">
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
					<div class="space-y-2 max-h-[300px] overflow-y-auto">
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

			<DialogFooter>
				<div class="flex items-center justify-between w-full">
					<span class="text-sm text-gray-500">已选择 {{ selectedContacts.size }} 人</span>
					<div class="space-x-2">
						<Button variant="outline" @click="$emit('update:open', false)">取消</Button>
						<Button :disabled="!canCreate" @click="handleCreate">创建群聊</Button>
					</div>
				</div>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { useChatStore } from '@/stores/chat'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toastService } from '@/services/toast'

const props = defineProps<{
	open: boolean
}>()

const emit = defineEmits<{
	'update:open': [value: boolean]
}>()

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

		emit('update:open', false)
		router.push({
			name: 'Chat',
			params: { id: chat.id },
		})
		toastService.success('群聊创建成功')
	} catch (error) {
		console.error('创建群聊失败:', error)
		toastService.error('创建群聊失败')
	}
}

// 组件挂载时获取联系人列表
onMounted(async () => {
	if (contactStore.contacts.length === 0) {
		await contactStore.fetchContacts()
	}
})
</script>
