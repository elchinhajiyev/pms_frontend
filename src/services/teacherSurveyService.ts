import api from './api'

export interface TeacherSurveyActivity {
  question_id: number
  question_text: string
  activity_id?: number | null
  activity_name?: string | null
  is_required?: boolean
}

export interface TeacherSurveySubmittedScore {
  question_id: number
  activity_id?: number | null
  score: number
}

export interface PendingTeacherSurveyItem {
  survey_id: number
  title: string
  description?: string
  year: string
  semester: 'YAZ' | 'YAY' | 'PAYIZ'
  group_name?: string
  teacher_id: number
  teacher_name: string
  total_activity_count: number
  rated_activity_count: number
  average_score?: number
  last_rated_at?: string
  activities: TeacherSurveyActivity[]
  questions?: TeacherSurveyActivity[]
  submitted_scores: TeacherSurveySubmittedScore[]
}

export interface CompletedTeacherSurveyItem {
  survey_id: number
  title: string
  year: string
  semester: 'YAZ' | 'YAY' | 'PAYIZ'
  group_name?: string
  teacher_id: number
  teacher_name: string
  total_activity_count: number
  rated_activity_count: number
  average_score: number
  last_rated_at?: string
}

export interface MyTeacherSurveyItem {
  teacher_id: number
  teacher_name: string
  survey_count: number
  vote_count: number
  average_score?: number
  last_rated_at?: string
}

export interface SubmitTeacherSurveyPayload {
  scores: Array<{
    question_id: number
    score: number
  }>
}

export interface TeacherSurveyResultActivity {
  activity_id: number
  activity_name: string
  average_score?: number
  vote_count: number
}

export interface TeacherSurveyResultItem {
  survey_id: number
  title: string
  description?: string
  year: string
  semester?: 'YAZ' | 'YAY' | 'PAYIZ'
  employee_group_id?: number
  group_name?: string
  overall_average_score?: number
  total_votes: number
  participant_count: number
  activity_count: number
  activities: TeacherSurveyResultActivity[]
}

export interface TeacherSurveyParticipantItem {
  participant_id: number
  first_name: string
  last_name: string
  middle_name?: string
  photo?: string | null
  group_number?: string
  phone?: string
  has_participated: boolean
}

const teacherSurveyService = {
  async getPending(userId: number) {
    const response = await api.get(`/evaluation/teacher-surveys/user/${userId}/pending`)
    return response.data as { data: PendingTeacherSurveyItem[] }
  },

  async getCompleted(userId: number) {
    const response = await api.get(`/evaluation/teacher-surveys/user/${userId}/completed`)
    return response.data as { data: CompletedTeacherSurveyItem[] }
  },

  async getMyTeachers(userId: number) {
    const response = await api.get(`/evaluation/teacher-surveys/user/${userId}/my-teachers`)
    return response.data as { data: MyTeacherSurveyItem[] }
  },

  async submit(userId: number, surveyId: number, teacherId: number, payload: SubmitTeacherSurveyPayload) {
    const response = await api.post(
      `/evaluation/teacher-surveys/user/${userId}/surveys/${surveyId}/teachers/${teacherId}/submit`,
      payload
    )
    return response.data as { message: string }
  },

  async getTeacherResults(teacherId: number) {
    const response = await api.get(`/evaluation/teacher-surveys/teacher/${teacherId}/results`)
    return response.data as { data: TeacherSurveyResultItem[] }
  },

  async getTeacherSurveyParticipants(teacherId: number, surveyId: number) {
    const response = await api.get(
      `/evaluation/teacher-surveys/teacher/${teacherId}/surveys/${surveyId}/participants`
    )
    return response.data as { data: TeacherSurveyParticipantItem[] }
  }
}

export default teacherSurveyService
