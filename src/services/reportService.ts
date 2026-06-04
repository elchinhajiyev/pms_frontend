import api from './api'

export interface GeneralReportRow {
  user_id: number
  full_name: string
  department_name?: string
  survey_average_score?: number | string | null
  assimilation_percent?: number | string | null
  quality_percent?: number | string | null
  task_activity_average?: number | string | null
  scientific_activity_score?: number | string | null
  teaching_material_score?: number | string | null
  punctuality_score?: number | string | null
  total_score?: number | string | null
}

export interface GeneralReportParams {
  academic_year: string
  semester?: string
  search?: string
  department_id?: number | string
}

export interface ActivityReportActivity {
  key: string
  name: string
}

export interface ActivityReportRow {
  user_id: number
  full_name: string
  department_name?: string
  activity_scores?: Record<string, number | string | null>
  total_average_score?: number | string | null
}

const reportService = {
  async getGeneralReport(params: GeneralReportParams) {
    const response = await api.get('/evaluation/reports/general', { params })
    return response.data as { data: GeneralReportRow[] }
  },

  async getActivityReport(params: GeneralReportParams) {
    const response = await api.get('/evaluation/reports/activities', { params })
    return response.data as {
      activities: ActivityReportActivity[]
      data: ActivityReportRow[]
    }
  },
}

export default reportService
