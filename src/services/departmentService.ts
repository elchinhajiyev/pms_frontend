import api from './api'

export interface Department {
  id: number
  name: string
  head_user_id?: number | null
  category_ids?: number[]
  categories?: {
    id: number
    name: string
  }[]
  activity_ids?: number[]
  head_user?: {
    id: number
    full_name: string
  } | null
  member_count?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface DepartmentMember {
  id: number
  full_name: string
  email: string
  is_active?: boolean
}

export interface DepartmentCategory {
  id: number
  name: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface DepartmentActivity {
  id: number
  name: string
}

const departmentService = {
  async getAll() {
    const response = await api.get('/evaluation/departments')
    return response.data
  },

  async create(data: Partial<Department>) {
    const response = await api.post('/evaluation/departments', data)
    return response.data
  },

  async update(id: number, data: Partial<Department>) {
    const response = await api.put(`/evaluation/departments/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/departments/${id}`)
    return response.data
  },

  async getMembers(id: number) {
    const response = await api.get(`/evaluation/departments/${id}/members`)
    return response.data
  },

  async setMembers(id: number, memberIds: number[]) {
    const response = await api.post(`/evaluation/departments/${id}/members`, {
      memberIds
    })
    return response.data
  },

  async addMember(id: number, userId: number) {
    const response = await api.post(`/evaluation/departments/${id}/members/add`, {
      userId
    })
    return response.data
  },

  async removeMember(id: number, userId: number) {
    const response = await api.delete(`/evaluation/departments/${id}/members/${userId}`)
    return response.data
  },

  async getCategories() {
    const response = await api.get('/evaluation/departments/categories')
    return response.data
  },

  async createCategory(name: string) {
    const response = await api.post('/evaluation/departments/categories', { name })
    return response.data
  },

  async deleteCategory(categoryId: number) {
    const response = await api.delete(`/evaluation/departments/categories/${categoryId}`)
    return response.data
  },

  async getDepartmentCategories(id: number) {
    const response = await api.get(`/evaluation/departments/${id}/categories`)
    return response.data
  },

  async getDepartmentActivities(id: number) {
    const response = await api.get(`/evaluation/departments/${id}/activities`)
    return response.data
  },

  async getMonitoringAccess(userId: number) {
    const response = await api.get(`/evaluation/departments/monitoring-access/${userId}`)
    return response.data
  }
}

export default departmentService
