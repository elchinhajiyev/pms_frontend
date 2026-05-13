import api from './api'

// ==================== TYPES ====================

export interface UserStatus {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface User {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  email?: string
  fin?: string
  position_id?: number
  department_id?: number
  employee_group_id?: number
  status_id?: number
  status_name?: string
  status_code?: string
  group_name?: string
  group_code?: string
  access_role_id?: number
  role_name?: string
  role_code?: string
  student_group_id?: number
  specialty_id?: number
}

// ==================== USER STATUS SERVICE ====================

export const userStatusService = {
  async getAll() {
    const response = await api.get('/evaluation/user-statuses')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/user-statuses/${id}`)
    return response.data
  },

  async create(data: Partial<UserStatus>) {
    const response = await api.post('/evaluation/user-statuses', data)
    return response.data
  },

  async update(id: number, data: Partial<UserStatus>) {
    const response = await api.put(`/evaluation/user-statuses/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/user-statuses/${id}`)
    return response.data
  }
}

// ==================== USER MANAGEMENT SERVICE ====================

export const userManagementService = {
  async getAllUsers() {
    const response = await api.get('/evaluation/all-users')
    return response.data
  },

  async updateUserStatus(userId: number, statusId: number | null) {
    const response = await api.put(`/evaluation/users/${userId}/status`, { status_id: statusId })
    return response.data
  },

  async updateUserRole(userId: number, roleId: number | null) {
    const response = await api.put(`/evaluation/users/${userId}/role`, { access_role_id: roleId })
    return response.data
  },

  async deleteUser(userId: number) {
    const response = await api.delete(`/evaluation/users/${userId}`)
    return response.data
  }
}

export default userStatusService