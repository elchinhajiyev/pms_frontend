import api from './api'

// ==================== TYPES ====================

export interface EmployeeGroup {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  is_active: boolean
  member_count?: number
}

export interface EvaluationParameter {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  category: string
  min_score: number
  max_score: number
  weight: number
  sort_order: number
  is_active: boolean
}

export interface EvaluationRuleEvaluator {
  id: number
  evaluator_type: string
  evaluator_group_id: number
  evaluator_group_code?: string
  evaluator_group_name?: string
  weight: number
  is_required: boolean
}

export interface EvaluationRule {
  id: number
  name: string
  description?: string
  target_type: string
  target_group_id: number
  target_group_code?: string
  target_group_name?: string
  min_evaluators: number
  evaluation_period: string
  is_anonymous: boolean
  self_evaluation_allowed: boolean
  require_comment: boolean
  academic_year?: string
  is_active: boolean
  evaluators?: EvaluationRuleEvaluator[]
  parameters?: EvaluationParameter[]
}

export interface EvaluationScore {
  parameter_id: number
  score: number
  comment?: string
  code?: string
  name?: string
}

export interface Evaluation {
  id: number
  evaluatee_id: number
  evaluatee_name?: string
  evaluatee_group_id?: number
  evaluator_id: number
  evaluator_name?: string
  evaluator_group_id?: number
  is_anonymous: boolean
  rule_id: number
  rule_name?: string
  total_score: number
  average_score: number
  general_comment?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  academic_year: string
  semester?: number
  submitted_at?: string
  approved_at?: string
  scores?: EvaluationScore[]
}

export interface PendingEvaluation {
  user_id: number
  first_name: string
  last_name: string
  email: string
  photo?: string | null
  group_id: number
  group_code: string
  group_name: string
  rule_id: number
  rule_name: string
}

export interface UserStats {
  summary: {
    total_evaluations: number
    overall_average: number
    min_score: number
    max_score: number
  }
  byParameter: Array<{
    code: string
    name: string
    average_score: number
    count: number
  }>
}

export interface CreateEvaluationData {
  evaluatee_id: number
  evaluatee_group_id?: number
  evaluatee_department_id?: number
  evaluatee_faculty_id?: number
  evaluator_id: number
  evaluator_group_id?: number
  is_anonymous?: boolean
  rule_id: number
  general_comment?: string
  status?: string
  academic_year: string
  semester?: number
  scores: Array<{
    parameter_id: number
    score: number
    comment?: string
  }>
}

// ==================== SERVICES ====================

export const employeeGroupService = {
  async getAll() {
    const response = await api.get('/evaluation/employee-groups')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/employee-groups/${id}`)
    return response.data
  },

  async create(data: Partial<EmployeeGroup>) {
    const response = await api.post('/evaluation/employee-groups', data)
    return response.data
  },

  async update(id: number, data: Partial<EmployeeGroup>) {
    const response = await api.put(`/evaluation/employee-groups/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/employee-groups/${id}`)
    return response.data
  }
}

export const evaluationParameterService = {
  async getAll(category?: string) {
    const params = category ? `?category=${encodeURIComponent(category)}` : ''
    const response = await api.get(`/evaluation/parameters${params}`)
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/parameters/${id}`)
    return response.data
  },

  async create(data: Partial<EvaluationParameter>) {
    const response = await api.post('/evaluation/parameters', data)
    return response.data
  },

  async update(id: number, data: Partial<EvaluationParameter>) {
    const response = await api.put(`/evaluation/parameters/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/parameters/${id}`)
    return response.data
  }
}

export const evaluationRuleService = {
  async getAll() {
    const response = await api.get('/evaluation/rules')
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/evaluation/rules/${id}`)
    return response.data
  },

  async getByTargetGroup(groupId: number) {
    const response = await api.get(`/evaluation/rules/target/${groupId}`)
    return response.data
  },

  async getByEvaluatorGroup(groupId: number) {
    const response = await api.get(`/evaluation/rules/evaluator/${groupId}`)
    return response.data
  },

  async create(data: Partial<EvaluationRule> & { evaluators?: Array<{ group_id: number; weight: number; is_required: boolean }>; parameter_ids?: number[] }) {
    const response = await api.post('/evaluation/rules', data)
    return response.data
  },

  async update(id: number, data: Partial<EvaluationRule>) {
    const response = await api.put(`/evaluation/rules/${id}`, data)
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/rules/${id}`)
    return response.data
  }
}

export const evaluationService = {
  async getById(id: number) {
    const response = await api.get(`/evaluation/evaluations/${id}`)
    return response.data
  },

  async getReceivedByUser(userId: number, academicYear?: string) {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    const response = await api.get(`/evaluation/evaluations/user/${userId}/received${params}`)
    return response.data
  },

  async getGivenByUser(userId: number, academicYear?: string) {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    const response = await api.get(`/evaluation/evaluations/user/${userId}/given${params}`)
    return response.data
  },

  async getPendingForUser(userId: number, academicYear?: string) {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    const response = await api.get(`/evaluation/evaluations/user/${userId}/pending${params}`)
    return response.data
  },

  async getUserStats(userId: number, academicYear?: string) {
    const params = academicYear ? `?academic_year=${academicYear}` : ''
    const response = await api.get(`/evaluation/evaluations/user/${userId}/stats${params}`)
    return response.data
  },

  async create(data: CreateEvaluationData) {
    const response = await api.post('/evaluation/evaluations', data)
    return response.data
  },

  async update(id: number, data: Partial<CreateEvaluationData>) {
    const response = await api.put(`/evaluation/evaluations/${id}`, data)
    return response.data
  },

  async approve(id: number, approvedBy: number) {
    const response = await api.put(`/evaluation/evaluations/${id}/approve`, { approved_by: approvedBy })
    return response.data
  },

  async reject(id: number, approvedBy: number) {
    const response = await api.put(`/evaluation/evaluations/${id}/reject`, { approved_by: approvedBy })
    return response.data
  },

  async delete(id: number) {
    const response = await api.delete(`/evaluation/evaluations/${id}`)
    return response.data
  }
}

export default evaluationService
