import api from './api'

export interface UserProfile {
  id: number
  first_name: string
  last_name: string
  middle_name?: string | null
  email: string
  phone?: string | null
  gender?: string | null
  photo?: string | null
  role_name?: string | null
  department_name?: string | null
  is_department_head?: boolean
  nationality?: string | null
  birth_date?: string | null
  registration_address?: string | null
  current_address?: string | null
  education_main_university?: string | null
  education_main_faculty?: string | null
  education_main_level?: string | null
  education_main_start_year?: number | null
  education_main_end_year?: number | null
  education_additional_university?: string | null
  education_additional_faculty?: string | null
  education_additional_level?: string | null
  education_additional_start_year?: number | null
  education_additional_end_year?: number | null
}

export interface UserCertificate {
  id: number
  user_id: number
  certificate_name: string
  issuer?: string | null
  year?: number | null
  created_at?: string
  updated_at?: string
}

const profileService = {
  async getMyProfile() {
    const response = await api.get('/users/me')
    return response.data
  },

  async getUserProfileById(userId: number) {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },

  async updateMyProfile(data: Partial<UserProfile>) {
    const response = await api.put('/users/me/profile', data)
    return response.data
  },

  async uploadMyPhoto(file: File) {
    const formData = new FormData()
    formData.append('photo', file)

    const response = await api.post('/users/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  async getMyCertificates() {
    const response = await api.get('/users/me/certificates')
    return response.data
  },

  async createMyCertificate(data: {
    certificate_name: string
    issuer?: string
    year?: number | null
  }) {
    const response = await api.post('/users/me/certificates', data)
    return response.data
  },

  async updateMyCertificate(
    id: number,
    data: { certificate_name: string; issuer?: string; year?: number | null }
  ) {
    const response = await api.put(`/users/me/certificates/${id}`, data)
    return response.data
  },

  async deleteMyCertificate(id: number) {
    const response = await api.delete(`/users/me/certificates/${id}`)
    return response.data
  }
}

export default profileService