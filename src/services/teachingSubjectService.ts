import api from './api'

export interface TeachingSubject {
  id: number
  name: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const teachingSubjectService = {
  async getAll() {
    const response = await api.get('/evaluation/teaching-subjects')
    return response.data
  },

  async create(data: Partial<TeachingSubject>) {
    const response = await api.post('/evaluation/teaching-subjects', data)
    return response.data
  },

  async update(id: number, data: Partial<TeachingSubject>) {
    const response = await api.put(`/evaluation/teaching-subjects/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/teaching-subjects/${id}`)
    return response.data
  }
}

export default teachingSubjectService
