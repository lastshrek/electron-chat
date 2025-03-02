<template>
	<Dialog :open="modelValue" @update:open="emit('update:modelValue', $event)">
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

				<!-- 已选成员头像展示 -->
				<transition
					enter-active-class="transition-all duration-300 ease-out"
					enter-from-class="opacity-0 transform -translate-y-4"
					enter-to-class="opacity-100 transform translate-y-0"
					leave-active-class="transition-all duration-200 ease-in"
					leave-from-class="opacity-100 transform translate-y-0"
					leave-to-class="opacity-0 transform -translate-y-4"
				>
					<div v-if="selectedMembers.length > 0" class="mb-6">
						<label class="block text-sm font-medium text-gray-700 mb-2">已选成员</label>
						<div class="flex items-center flex-wrap gap-2">
							<transition-group
								tag="div"
								class="flex flex-wrap gap-2"
								enter-active-class="transition-all duration-300 ease-out"
								enter-from-class="opacity-0 scale-75"
								enter-to-class="opacity-100 scale-100"
								leave-active-class="transition-all duration-200 ease-in absolute"
								leave-from-class="opacity-100 scale-100"
								leave-to-class="opacity-0 scale-75"
								move-class="transition-all duration-300"
							>
								<div v-for="member in selectedMembers" :key="member.id" class="relative group member-avatar">
									<img
										:src="member.avatar"
										:alt="member.username"
										class="w-10 h-10 rounded-full border-2 border-white"
									/>
									<button
										@click="toggleSelect(member.id)"
										class="absolute -top-1 -right-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
									>
										<X class="w-3 h-3 text-gray-500" />
									</button>
									<div
										class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
									>
										{{ member.username }}
									</div>
								</div>
							</transition-group>
						</div>
					</div>
				</transition>

				<!-- 选择成员 -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">选择群成员</label>
					<div class="space-y-2 max-h-[300px] overflow-y-auto">
						<div
							v-for="contact in contacts"
							:key="contact.id"
							class="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
							@click="toggleSelect(contact.friend.id)"
						>
							<input
								type="checkbox"
								:checked="selectedContacts.has(contact.friend.id)"
								class="mr-3"
								@click.stop="toggleSelect(contact.friend.id)"
							/>
							<img :src="contact.friend.avatar" :alt="contact.friend.username" class="w-10 h-10 rounded-full" />
							<span class="ml-3">{{ contact.friend.username }}</span>
						</div>
					</div>
				</div>
			</div>

			<DialogFooter>
				<div class="flex items-center justify-between w-full">
					<span class="text-sm text-gray-500">已选择 {{ selectedContacts.size }} 人</span>
					<div class="space-x-2">
						<Button variant="outline" @click="emit('update:modelValue', false)">取消</Button>
						<Button :disabled="!canCreate" @click="handleCreate">创建群聊</Button>
					</div>
				</div>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { useChatStore } from '@/stores/chat'
import { X } from 'lucide-vue-next'
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
	modelValue: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [value: boolean]
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

// 计算已选成员的信息
const selectedMembers = computed(() => {
	return contacts.value
		.filter(contact => selectedContacts.value.has(contact.friend.id))
		.map(contact => ({
			id: contact.friend.id,
			username: contact.friend.username,
			avatar: contact.friend.avatar,
		}))
})

// 切换选择状态
const toggleSelect = (userId: number) => {
	if (selectedContacts.value.has(userId)) {
		selectedContacts.value.delete(userId)
	} else {
		selectedContacts.value.add(userId)
	}
	console.log('selectedContacts', selectedContacts.value)
}

// 创建群聊
const handleCreate = async () => {
	try {
		const chat = await chatStore.createGroupChat({
			name: groupName.value,
			memberIds: Array.from(selectedContacts.value),
		})

		// 重置表单
		groupName.value = ''
		selectedContacts.value.clear()

		emit('update:modelValue', false)
		chatStore.setChat(chat)
		router.push(`/chat/${chat.id}`)
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
	console.log('contacts', contacts.value)
})

// 当对话框关闭时重置表单
watch(
	() => props.modelValue,
	newValue => {
		if (!newValue) {
			groupName.value = ''
			selectedContacts.value.clear()
		}
	}
)
</script>

<style scoped>
/* 修改现有样式 */
.member-avatar {
	position: relative;
	transition: all 0.3s ease;
	z-index: 1;
}

.member-avatar:hover {
	transform: scale(1.05);
	z-index: 2;
}

/* 头像堆叠效果 */
.member-avatar:not(:first-child) {
	margin-left: -0.75rem;
}

/* 添加新的动画样式 */
.member-avatar.v-enter-active,
.member-avatar.v-leave-active {
	transition: all 0.3s ease;
}

.member-avatar.v-enter-from,
.member-avatar.v-leave-to {
	opacity: 0;
	transform: scale(0.75);
}

.member-avatar.v-enter-to,
.member-avatar.v-leave-from {
	opacity: 1;
	transform: scale(1);
}

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
	width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
	background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
	background-color: rgba(156, 163, 175, 0.5);
	border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
	background-color: rgba(156, 163, 175, 0.8);
}
</style>
