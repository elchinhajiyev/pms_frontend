import api from './api'

export interface SurveyQuestionBankQuestion {
  id?: number
  bank_id?: number
  activity_id?: number | null
  activity_name?: string | null
  activity_code?: string | null
  activity_category?: string | null
  question_text: string
  sort_order?: number
  is_required: boolean
  created_at?: string
  updated_at?: string
}

export interface SurveyQuestionBank {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  question_count: number
  questions: SurveyQuestionBankQuestion[]
  created_at?: string
  updated_at?: string
}

export interface SurveyQuestionBankPayload {
  name: string
  description?: string | null
  questions: SurveyQuestionBankQuestion[]
}

export const surveyQuestionBankService = {
  async getAll() {
    const response = await api.get('/evaluation/survey-question-banks')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/survey-question-banks/${id}`)
    return response.data
  },

  async create(data: SurveyQuestionBankPayload) {
    const response = await api.post('/evaluation/survey-question-banks', data)
    return response.data
  },

  async update(id: number, data: SurveyQuestionBankPayload) {
    const response = await api.put(`/evaluation/survey-question-banks/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/survey-question-banks/${id}`)
    return response.data
  }
}

export default surveyQuestionBankService
