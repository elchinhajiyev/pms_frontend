import api from './api'

export interface AccessRole {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  is_active: boolean
  user_count?: number
}

const accessRoleService = {
  getAll: async () => {
    return api.get('/evaluation/access-roles')
  },

  getById: async (id: number) => {
    return api.get(`/evaluation/access-roles/${id}`)
  },

  create: async (data: Partial<AccessRole>) => {
    return api.post('/evaluation/access-roles', data)
  },

  update: async (id: number, data: Partial<AccessRole>) => {
    return api.put(`/evaluation/access-roles/${id}`, data)
  },

  delete: async (id: number) => {
    return api.delete(`/evaluation/access-roles/${id}`)
  }
}

export default accessRoleService
