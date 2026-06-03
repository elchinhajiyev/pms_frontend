import api from './api'

export const COMMISSION_PERMISSION_OPTIONS = [
  { key: 'scientific_reports', label: 'Elmi məruzələr' },
  { key: 'book_authorship', label: 'Kitab müəllifliyi' },
  { key: 'scientific_publications', label: 'Elmi nəşrlər' },
  { key: 'scientific_projects', label: 'Elmi tədqiqat layihələri' },
  { key: 'course_programs', label: 'Tədris proqramları' },
  { key: 'textbooks', label: 'Dərsliklər' },
  { key: 'course_materials', label: 'Dərs vəsaitləri' },
  { key: 'methodical_materials', label: 'Metodiki vəsaitlər' },
] as const

export type CommissionPermissionKey = typeof COMMISSION_PERMISSION_OPTIONS[number]['key']

export interface CommissionMember {
  id: number
  full_name: string
  email?: string
  photo?: string | null
}

export interface Commission {
  id: number
  name: string
  is_active: boolean
  members?: CommissionMember[]
  permission_keys?: CommissionPermissionKey[]
  created_at?: string
  updated_at?: string
}

const commissionService = {
  async getAll() {
    const response = await api.get('/evaluation/commissions')
    return response.data as { data: Commission[] }
  },

  async create(name: string) {
    const response = await api.post('/evaluation/commissions', { name })
    return response.data as { data: Commission }
  },

  async update(id: number, name: string) {
    const response = await api.put(`/evaluation/commissions/${id}`, { name })
    return response.data as { data: Commission }
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/commissions/${id}`)
    return response.data
  },

  async setMembers(id: number, memberIds: number[]) {
    const response = await api.put(`/evaluation/commissions/${id}/members`, {
      member_ids: memberIds,
    })
    return response.data as { data: Commission }
  },

  async setPermissions(id: number, permissionKeys: string[]) {
    const response = await api.put(`/evaluation/commissions/${id}/permissions`, {
      permission_keys: permissionKeys,
    })
    return response.data as { data: Commission }
  },
}

export default commissionService
