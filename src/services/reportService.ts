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

const reportService = {
  async getGeneralReport(params: GeneralReportParams) {
    const response = await api.get('/evaluation/reports/general', { params })
    return response.data as { data: GeneralReportRow[] }
  },
}

export default reportService
