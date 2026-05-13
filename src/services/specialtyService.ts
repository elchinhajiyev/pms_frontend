import api from './api'

export interface Specialty {
  id: number
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const specialtyService = {
  async getAll() {
    const response = await api.get('/evaluation/specialties')
    return response.data
  },

  async create(data: Partial<Specialty>) {
    const response = await api.post('/evaluation/specialties', data)
    return response.data
  },

  async update(id: number, data: Partial<Specialty>) {
    const response = await api.put(`/evaluation/specialties/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/specialties/${id}`)
    return response.data
  }
}

export default specialtyService
