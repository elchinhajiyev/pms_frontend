import api from './api'

// ==================== TYPES ====================

export interface Activity {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  category?: string
  max_score: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  groups?: ActivityGroup[]
}

export interface ActivityGroup {
  id: number
  code: string
  name: string
  is_required?: boolean
}

export interface GroupMember {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  fin?: string
  position_id?: number
  department_id?: number
  employee_group_id?: number
}

// ==================== SERVICES ====================

export const activityService = {
  async getAll() {
    const response = await api.get('/evaluation/activities')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/activities/${id}`)
    return response.data
  },

  async create(data: Partial<Activity>) {
    const response = await api.post('/evaluation/activities', data)
    return response.data
  },

  async update(id: number, data: Partial<Activity>) {
    const response = await api.put(`/evaluation/activities/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/activities/${id}`)
    return response.data
  },

  async getGroups(id: number) {
    const response = await api.get(`/evaluation/activities/${id}/groups`)
    return response.data
  },

  async setGroups(id: number, groupIds: number[]) {
    const response = await api.put(`/evaluation/activities/${id}/groups`, { group_ids: groupIds })
    return response.data
  },

  async getGroupActivities(groupId: number) {
    const response = await api.get(`/evaluation/employee-groups/${groupId}/activities`)
    return response.data
  },

  async setGroupActivities(groupId: number, activityIds: number[]) {
    const response = await api.put(`/evaluation/employee-groups/${groupId}/activities`, { activity_ids: activityIds })
    return response.data
  }
}

export const groupMemberService = {
  async getMembers(groupId: number) {
    const response = await api.get(`/evaluation/employee-groups/${groupId}/members`)
    return response.data
  },

  async getUsersWithoutGroup() {
    const response = await api.get('/evaluation/users-without-group')
    return response.data
  },

  async updateUserGroup(userId: number, groupId: number | null) {
    const response = await api.put(`/evaluation/users/${userId}/group`, { group_id: groupId })
    return response.data
  }
}

export default activityService
