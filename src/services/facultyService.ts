import api from './api'

export interface Faculty {
  id: number
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const facultyService = {
  async getAll() {
    const response = await api.get('/evaluation/faculties')
    return response.data
  },

  async create(data: Partial<Faculty>) {
    const response = await api.post('/evaluation/faculties', data)
    return response.data
  },

  async update(id: number, data: Partial<Faculty>) {
    const response = await api.put(`/evaluation/faculties/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/faculties/${id}`)
    return response.data
  }
}

export default facultyService
