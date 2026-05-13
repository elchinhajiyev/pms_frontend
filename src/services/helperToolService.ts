import api from './api'

export interface HelperToolOption {
  id: number
  value: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const helperToolService = {
  async getAcademicYears() {
    const response = await api.get('/evaluation/helper-tools/academic-years')
    return response.data as { data: HelperToolOption[] }
  },

  async createAcademicYear(value: string) {
    const response = await api.post('/evaluation/helper-tools/academic-years', { value })
    return response.data
  },

  async updateAcademicYear(id: number, value: string) {
    const response = await api.put(`/evaluation/helper-tools/academic-years/${id}`, { value })
    return response.data
  },

  async deleteAcademicYear(id: number) {
    const response = await api.delete(`/evaluation/helper-tools/academic-years/${id}`)
    return response.data
  },

  async getSemesters() {
    const response = await api.get('/evaluation/helper-tools/semesters')
    return response.data as { data: HelperToolOption[] }
  },

  async createSemester(value: string) {
    const response = await api.post('/evaluation/helper-tools/semesters', { value })
    return response.data
  },

  async updateSemester(id: number, value: string) {
    const response = await api.put(`/evaluation/helper-tools/semesters/${id}`, { value })
    return response.data
  },

  async deleteSemester(id: number) {
    const response = await api.delete(`/evaluation/helper-tools/semesters/${id}`)
    return response.data
  }
}

export default helperToolService