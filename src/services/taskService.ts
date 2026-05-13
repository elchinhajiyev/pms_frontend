import api from './api'

export interface TaskAssignment {
  id: number
  task_id: number
  user_id?: number | null
  assigned_by?: number | null
  work_description?: string | null
  related_activities?: Array<{ id: number; name: string }> | null
  due_date_mode?: 'task' | 'custom'
  custom_due_date?: string | null
  status?: string
  is_missed?: boolean
  rating_given?: boolean
  approved_by_manager?: boolean
  approved_by?: number | null
  approved_at?: string | null
  assignment_ratings?: TaskAssignmentRating[]
  completed_at?: string | null
  created_at?: string
  updated_at?: string
  user_name?: string | null
  user_email?: string | null
  user_photo?: string | null
  role_code?: string | null
  role_name?: string | null
}

export interface TaskAssignmentRating {
  id: number
  task_assignment_id: number
  activity_id?: number | null
  activity_name: string
  score: number
  rated_by?: number | null
  created_at?: string
}

export interface TaskAssignmentRatingInput {
  activity_id?: number | null
  activity_name: string
  score: number
}

export interface TaskUpdate {
  id: number
  task_assignment_id: number
  type: 'text' | 'file'
  content?: string | null
  file_url?: string | null
  file_name?: string | null
  created_by?: number | null
  created_by_name?: string | null
  created_at?: string
}

export interface Task {
  id: number
  subject: string
  description?: string | null
  department_id?: number | null
  department_name?: string | null
  created_by?: number | null
  created_by_name?: string | null
  priority?: string | null
  due_date?: string | null
  semester?: string | null
  academic_year?: string | null
  status: string
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
  assignee_count?: number
  completed_assignee_count?: number
  assignments?: TaskAssignment[]
  updates?: TaskUpdate[]
}

export interface TaskAssignmentInput {
  user_id: number
  work_description?: string
  related_activity_ids?: number[]
  related_activities?: string
  due_date_mode?: 'task' | 'custom'
  custom_due_date?: string | null
}

export interface TaskInput {
  subject: string
  description?: string
  department_id?: number
  priority?: string | null
  due_date: string
  semester?: string | null
  academic_year?: string | null
  status?: string
  assignees: TaskAssignmentInput[]
}

export interface TaskUpdateInput {
  content?: string
}

export interface TaskNotification {
  id: number
  user_id: number
  task_id?: number | null
  task_assignment_id?: number | null
  type: string
  message: string
  is_read: boolean
  created_at?: string
  task_subject?: string | null
}

const taskService = {
  async getTasks() {
    const response = await api.get('/tasks')
    return response.data
  },

  async getTrashedTasks() {
    const response = await api.get('/tasks/trash')
    return response.data
  },

  async getTask(id: number) {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  async createTask(data: TaskInput) {
    const response = await api.post('/tasks', data)
    return response.data
  },

  async updateTask(id: number, data: Partial<TaskInput> & { status?: string }) {
    const response = await api.put(`/tasks/${id}`, data)
    return response.data
  },

  async deleteTask(id: number) {
    const response = await api.delete(`/tasks/${id}`)
    return response.data
  },

  async restoreTask(id: number) {
    const response = await api.post(`/tasks/${id}/restore`)
    return response.data
  },

  async permanentlyDeleteTask(id: number) {
    const response = await api.delete(`/tasks/${id}/permanent`)
    return response.data
  },

  async addAssignments(id: number, assignees: TaskAssignmentInput[]) {
    const response = await api.post(`/tasks/${id}/assignments`, { assignees })
    return response.data
  },

  async getAssignments(id: number) {
    const response = await api.get(`/tasks/${id}/assignments`)
    return response.data
  },

  async completeAssignment(assignmentId: number) {
    const response = await api.post(`/tasks/assignments/${assignmentId}/complete`)
    return response.data
  },

  async rejectAssignment(assignmentId: number, reason: string) {
    const response = await api.post(`/tasks/assignments/${assignmentId}/reject`, { reason })
    return response.data
  },

  async rateAssignment(assignmentId: number, ratings: TaskAssignmentRatingInput[]) {
    const response = await api.post(`/tasks/assignments/${assignmentId}/ratings`, { ratings })
    return response.data
  },

  async addUpdate(assignmentId: number, data: TaskUpdateInput, files?: File[]) {
    const formData = new FormData()
    if (data.content) {
      formData.append('content', data.content)
    }
    if (Array.isArray(files) && files.length > 0) {
      files.forEach((file) => formData.append('files', file))
    }

    const response = await api.post(`/tasks/assignments/${assignmentId}/updates`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async editUpdate(updateId: number, data: TaskUpdateInput, files?: File[]) {
    const formData = new FormData()
    if (data.content) {
      formData.append('content', data.content)
    }
    if (Array.isArray(files) && files.length > 0) {
      files.forEach((file) => formData.append('files', file))
    }

    const response = await api.put(`/tasks/updates/${updateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async getAssignmentUpdates(assignmentId: number) {
    const response = await api.get(`/tasks/assignments/${assignmentId}/updates`)
    return response.data
  },

  async deleteUpdate(updateId: number) {
    const response = await api.delete(`/tasks/updates/${updateId}`)
    return response.data
  },

  async deleteUpdateFile(updateId: number, fileIndex: number) {
    const response = await api.delete(`/tasks/updates/${updateId}/files/${fileIndex}`)
    return response.data
  },

  async getNotifications(limit = 30) {
    const response = await api.get('/tasks/notifications', {
      params: { limit }
    })
    return response.data as { success: boolean; data: TaskNotification[]; unread_count: number }
  },

  async markNotificationRead(notificationId: number) {
    const response = await api.patch(`/tasks/notifications/${notificationId}/read`)
    return response.data
  },

  async markAllNotificationsRead() {
    const response = await api.patch('/tasks/notifications/read-all')
    return response.data
  }
}

export default taskService
