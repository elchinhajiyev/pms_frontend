import api from './api'
import { resolveAttachmentUrl } from '../utils/attachmentUrl'

export interface BookAuthorshipItem {
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

const normalizeItem = (item: BookAuthorshipItem): BookAuthorshipItem => ({
  ...item,
  attachment_url: resolveAttachmentUrl(item.attachment_url || item.file_path)
})

const normalizeItems = (items: BookAuthorshipItem[] = []) => items.map(normalizeItem)

export interface CreateBookAuthorshipPayload {
  title: string
  semester: string
  academic_year: string
  category_parameter_id?: number
  summary?: string
  link?: string
  created_by: number
  file?: File | null
}

export interface UpdateBookAuthorshipPayload {
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

const bookAuthorshipService = {
  async getByUser(userId: number) {
    const response = await api.get(`/evaluation/book-authorship/user/${userId}`)
    const data = normalizeItems(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem[] }
  },

  async getById(id: number, userId?: number) {
    const params = userId ? `?user_id=${encodeURIComponent(String(userId))}` : ''
    const response = await api.get(`/evaluation/book-authorship/${id}${params}`)
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem }
  },

  async create(payload: CreateBookAuthorshipPayload) {
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

    const response = await api.post('/evaluation/book-authorship', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem }
  },

  async update(payload: UpdateBookAuthorshipPayload) {
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
      `/evaluation/book-authorship/${payload.id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem }
  },

  async getForMonitoring(status?: string, userId?: number) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (Number.isFinite(userId)) params.set('user_id', String(userId))
    const query = params.toString()
    const response = await api.get(`/evaluation/book-authorship/monitoring${query ? `?${query}` : ''}`)
    const data = normalizeItems(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem[] }
  },

  async approve(id: number, approvedBy: number) {
    const response = await api.put(`/evaluation/book-authorship/${id}/approve`, {
      approved_by: approvedBy
    })
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem }
  },

  async reject(id: number, approvedBy: number, rejectionReason: string) {
    const response = await api.put(`/evaluation/book-authorship/${id}/reject`, {
      approved_by: approvedBy,
      rejection_reason: rejectionReason
    })
    const data = normalizeItem(response.data?.data)
    return { ...response.data, data } as { data: BookAuthorshipItem }
  }
}

export default bookAuthorshipService
