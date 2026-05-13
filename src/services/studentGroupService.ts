import api from './api'

export interface StudentGroup {
  id: number
  group_number: string
  course?: number
  education_type?: 'EYANI' | 'QIYABI'
  faculty_id?: number
  teaching_subject_id?: number
  teaching_subject_ids?: number[]
  specialty_id?: number
  department_id?: number
  department_ids?: number[]
  faculty_name?: string
  teaching_subject_name?: string
  teaching_subject_names?: string[]
  specialty_name?: string
  department_name?: string
  department_names?: string[]
  teacher_ids?: number[]
  teacher_names?: string[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface StudentGroupPayload {
  group_number: string
  course?: number | null
  education_type?: 'EYANI' | 'QIYABI' | null
  faculty_id?: number | null
  teaching_subject_id?: number | null
  teaching_subject_ids?: number[]
  specialty_id?: number | null
  department_id?: number | null
  department_ids?: number[]
  teacher_ids?: number[]
}

export interface StudentGroupStudent {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  fin: string
  phone?: string
  created_at?: string
}

const studentGroupService = {
  async getAll() {
    const response = await api.get('/evaluation/student-groups')
    return response.data
  },

  async create(data: StudentGroupPayload) {
    const response = await api.post('/evaluation/student-groups', data)
    return response.data
  },

  async update(id: number, data: StudentGroupPayload) {
    const response = await api.put(`/evaluation/student-groups/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/student-groups/${id}`)
    return response.data
  },

  async getStudents(id: number): Promise<{ data: StudentGroupStudent[]; total: number }> {
    const response = await api.get(`/evaluation/student-groups/${id}/students`)
    return response.data
  }
}

export default studentGroupService
