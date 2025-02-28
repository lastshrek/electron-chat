/*
 * @Author       : lastshrek
 * @Date         : 2025-02-19 19:14:45
 * @LastEditors  : lastshrek
 * @LastEditTime : 2025-02-28 21:27:48
 * @FilePath     : /src/api/auth.ts
 * @Description  : auth api
 * Copyright 2025 lastshrek, All Rights Reserved.
 * 2025-02-19 19:14:45
 */
import request from '@/utils/request'
import type {
	ApiResponse,
	LoginParams,
	LoginResponse,
	RegisterParams,
	RegisterResult,
	SearchResponse,
	UserInfo,
	Friend,
	FriendRequestResponse,
	OrganizationResponse,
	DepartmentUser,
} from '@/types/api'

interface MeetingParticipant {
	id: number
	meetingId: string
	userId: number
	joinTime: string
	leaveTime: string | null
	role: 'HOST' | 'PARTICIPANT'
	user: {
		id: number
		username: string
		avatar: string
	}
}

interface Meeting {
	id: string
	title: string
	createdBy: number
	status: 'ACTIVE' | 'ENDED'
	startTime: string
	endTime: string | null
	createdAt: string
	updatedAt: string
	participants: MeetingParticipant[]
	creator: {
		id: number
		username: string
		avatar: string
	}
}

interface MeetingListResponse {
	meetings: Array<{
		id: string
		title: string
		status: 'ACTIVE' | 'ENDED'
		startTime: string
		creator: {
			id: number
			username: string
			avatar: string
		}
		participants: Array<{
			user: {
				id: number
				username: string
				avatar: string
			}
			role: 'HOST' | 'PARTICIPANT'
			joinTime: string
		}>
		_count: {
			participants: number
		}
	}>
	pagination: {
		page: number
		limit: number
		total: number
		totalPages: number
	}
}

export const authApi = {
	// 登录
	login: (params: LoginParams) => {
		return request.post('/users/login', params)
	},

	// 登出
	logout: () => {
		return request.post('/users/logout')
	},

	// 刷新 token
	refreshToken: () => {
		return request.post<ApiResponse<{ token: string }>>('/auth/refresh')
	},

	// 注册
	register: (data: RegisterParams) => {
		return request.post<ApiResponse<RegisterResult>>('/users/register', data)
	},

	// 搜索用户
	searchUsers: async (keyword: string) => {
		try {
			return await request.get<SearchResponse>('/users/search', {
				params: { keyword },
			})
		} catch (error) {
			console.error('搜索用户失败:', error)
			throw error
		}
	},

	// 发送好友请求
	sendFriendRequest: (fromId: number, toId: number) => {
		return request.post<ApiResponse<void>>(`/users/friend-requests`, { toId })
	},

	// 获取好友请求列表
	getFriendRequests: (status: 'PENDING' | 'ACCEPTED' | 'REJECTED') => {
		return request.get<FriendRequestResponse>('/users/friend-requests', {
			params: { status },
		})
	},

	// 添加处理好友请求的接口
	respondToFriendRequest: (requestId: number, status: 'ACCEPTED' | 'REJECTED') => {
		return request.patch<ApiResponse<void>>(`/users/friend-requests/${requestId}`, {
			status,
		})
	},

	// 获取用户信息
	getUserInfo: () => {
		return request.get<UserInfo>('/auth/user')
	},

	// 获取好友列表
	getFriends: () => {
		return request.get<Friend[]>('/users/friends')
	},

	// 获取组织架构
	getOrganizations: () => {
		return request.get<OrganizationResponse>('/organizations/structure')
	},

	// 获取部门用户列表
	getDepartmentUsers: (departmentId: string) => {
		return request.get<DepartmentUser[]>(`/organizations/${departmentId}/users`)
	},

	// 创建会议
	createMeeting: (title: string) => {
		return request.post<Meeting>('/meetings', { title })
	},

	// 获取会议列表
	getMeetings: (params?: { page?: number; limit?: number }) => {
		return request.get<MeetingListResponse>('/meetings', { params })
	},

	// 获取会议信息
	getMeetingInfo: (meetingId: string) => {
		return request.get<Meeting>(`/meetings/${meetingId}`)
	},
}

export async function createLoginUser(user: {
	id: number // 确保有这个字段
	username: string
	avatar: string
}) {
	return await window.electron.ipcRenderer.invoke('db:createLoginUser', user)
}
