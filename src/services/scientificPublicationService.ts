import api from './api'
import { resolveAttachmentUrl } from '../utils/attachmentUrl'

export interface ScientificPublicationItem {
  id: number
  title: string
  semester: 'YAZ' | 'YAY' | 'PAYIZ' | string
  academic_year: string
  category_parameter_id?: number
  category_name?: string
  summary?: string
  link?: string
  file_path?: string
  attachment_url?: string
  file_name?: string
  status: 'pending' | 'approved' | 'rejected' | string
  rejection_reason?: string
  approved_by?: number
  approved_at?: string
  created_by: number
  created_by_name?: string
  created_by_fin?: string
  created_at: string
  updated_at: string
}

const normalizeItem = (item: ScientificPublicationItem): ScientificPublicationItem => ({
  ...item,
  attachment_url: resolveAttachmentUrl(item.attachment_url || item.file_path)
})

const normalizeItems = (items: ScientificPublicationItem[] = []) => items.map(normalizeItem)

export interface CreateScientificPublicationPayload {
  title: string
  semester: string
  academic_year: string
  category_parameter_id?: number
  summary?: string
  link?: string
  created_by: number
  file?: File | null
}

export interface UpdateScientificPublicationPayload {
  id: number
  title: string
  semester: string
  academic_year: string
  category_parameter_id?: number
  summary?: string
  link?: string
  created_by: number
  file?: File | null
}

const scientificPublicationService = {
  async getByUser(userId: number) {
    const response = await api.get(`/evaluation/scientific-publications/user/${userId}`)
    const data = normalizeItems(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem[] }
  },

  async getById(id: number, userId?: number) {
    const params = userId ? `?user_id=${encodeURIComponent(String(userId))}` : ''
    const response = await api.get(`/evaluation/scientific-publications/${id}${params}`)
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem }
  },

  async create(payload: CreateScientificPublicationPayload) {
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('semester', payload.semester)
    formData.append('academic_year', payload.academic_year)
    formData.append('created_by', String(payload.created_by))

    if (payload.category_parameter_id) {
      formData.append('category_parameter_id', String(payload.category_parameter_id))
    }
    if (payload.summary) {
      formData.append('summary', payload.summary)
    }
    if (payload.link) {
      formData.append('link', payload.link)
    }
    if (payload.file) {
      formData.append('file', payload.file)
    }

    const response = await api.post('/evaluation/scientific-publications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem }
  },

  async update(payload: UpdateScientificPublicationPayload) {
    const formData = new FormData()
    formData.append('title', payload.title)
    formData.append('semester', payload.semester)
    formData.append('academic_year', payload.academic_year)
    formData.append('created_by', String(payload.created_by))

    if (payload.category_parameter_id) {
      formData.append('category_parameter_id', String(payload.category_parameter_id))
    }
    if (payload.summary) {
      formData.append('summary', payload.summary)
    }
    if (payload.link) {
      formData.append('link', payload.link)
    }
    if (payload.file) {
      formData.append('file', payload.file)
    }

    const response = await api.put(
      `/evaluation/scientific-publications/${payload.id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem }
  },

  async getForMonitoring(status?: string) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const query = params.toString()
    const response = await api.get(`/evaluation/scientific-publications/monitoring${query ? `?${query}` : ''}`)
    const data = normalizeItems(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem[] }
  },

  async approve(id: number, approvedBy: number) {
    const response = await api.put(`/evaluation/scientific-publications/${id}/approve`, {
      approved_by: approvedBy
    })
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem }
  },

  async reject(id: number, approvedBy: number, rejectionReason: string) {
    const response = await api.put(`/evaluation/scientific-publications/${id}/reject`, {
      approved_by: approvedBy,
      rejection_reason: rejectionReason
    })
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: ScientificPublicationItem }
  }
}

export default scientificPublicationService
