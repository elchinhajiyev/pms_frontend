import api from './api'
import { User } from './userService'

export interface SurveyActivityScoreInput {
  activity_id: number
  likert_score: number
}

export interface CreateSurveyPayload {
  title: string
  description?: string
  year: string
  semester: 'YAZ' | 'YAY' | 'PAYIZ'
  employee_group_id: number
  question_bank_id: number
  activity_ids?: number[]
  activity_scores?: SurveyActivityScoreInput[]
  participant_ids: number[]
}

export interface Survey {
  id: number
  title: string
  description?: string
  year: string
  semester?: 'YAZ' | 'YAY' | 'PAYIZ'
  employee_group_id: number
  question_bank_id?: number | null
  question_bank_name?: string | null
  group_name?: string
  group_code?: string
  activity_scores: Array<{
    activity_id: number
    activity_name: string
    likert_score: number
  }>
  participants: Array<{
    user_id: number
    full_name: string
    fin?: string
    photo?: string | null
  }>
  created_at: string
}

export interface SurveyTeacherResultRow {
  teacher_id: number
  first_name: string
  last_name: string
  middle_name?: string
  photo?: string | null
  fin?: string
  department_name?: string
  voter_count: number
  overall_average_score?: number
  question_scores?: Array<{
    question_id: number
    question_text: string
    sort_order?: number
    activity_id?: number | null
    activity_name?: string | null
    response_count: number
    average_score?: number | null
  }>
  activity_scores?: Array<{
    activity_id: number
    activity_name: string
    response_count: number
    average_score?: number | null
  }>
}

export interface SurveyTeacherResultsResponse {
  data: SurveyTeacherResultRow[]
  survey: {
    id: number
    title: string
    year: string
    semester?: 'YAZ' | 'YAY' | 'PAYIZ'
  }
}

const surveyService = {
  async getAll() {
    const response = await api.get('/evaluation/surveys')
    return response.data
  },

  async create(data: CreateSurveyPayload) {
    const response = await api.post('/evaluation/surveys', data)
    return response.data
  },

  async update(id: number, data: CreateSurveyPayload) {
    const response = await api.put(`/evaluation/surveys/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/surveys/${id}`)
    return response.data
  },

  async getEligibleParticipants() {
    const response = await api.get('/evaluation/surveys/eligible-participants')
    return response.data as { data: User[] }
  },

  async getTeacherResultsBySurvey(surveyId: number) {
    const response = await api.get(`/evaluation/surveys/${surveyId}/teacher-results`)
    return response.data as SurveyTeacherResultsResponse
  },

  async resetResponses(surveyId: number) {
    const response = await api.delete(`/evaluation/surveys/${surveyId}/responses`)
    return response.data as { message: string; deleted_count: number }
  }
}

export default surveyService
