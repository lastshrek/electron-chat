import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import type { Friend } from '@/types/api'

export const useContactStore = defineStore('contact', () => {
	const contacts = ref<Friend[]>([])
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// 获取联系人列表
	const fetchContacts = async () => {
		isLoading.value = true
		error.value = null

		try {
			const response = await authApi.getFriends()
			contacts.value = response
		} catch (err) {
			console.error('获取联系人列表失败:', err)
			error.value = '获取联系人列表失败'
		} finally {
			isLoading.value = false
		}
	}

	// 添加联系人
	const addContact = (contact: Friend) => {
		contacts.value.push(contact)
	}

	// 移除联系人
	const removeContact = (contactId: number) => {
		contacts.value = contacts.value.filter(contact => contact.id !== contactId)
	}

	// 更新联系人信息
	const updateContact = (contactId: number, updates: Partial<Friend>) => {
		const index = contacts.value.findIndex(contact => contact.id === contactId)
		if (index !== -1) {
			contacts.value[index] = { ...contacts.value[index], ...updates }
		}
	}

	return {
		contacts,
		isLoading,
		error,
		fetchContacts,
		addContact,
		removeContact,
		updateContact,
	}
})
