import api from './api'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  password: string
  fin: string
  gender?: string
  phone?: string
  birth_date?: string
  department_id?: number
  position_id?: number
  faculty_id?: number
  employee_group_id?: number
  specialty_id?: number
  student_group_id?: number
}

export interface User {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  fin: string
  gender?: string
  photo?: string
  phone?: string
  birth_date?: string
  department_id?: number
  position_id?: number
  faculty_id?: number
  role_id?: number
  employee_group_id?: number
  employee_group_code?: string
  access_role_id?: number
  role_code?: string
  role_name?: string
  department_name?: string
  is_department_head?: boolean
  nationality?: string
  registration_address?: string
  current_address?: string
  education_main_university?: string
  education_main_faculty?: string
  education_main_start_year?: number
  education_main_end_year?: number
  education_additional_university?: string
  education_additional_faculty?: string
  education_additional_start_year?: number
  education_additional_end_year?: number
  status_id: number
  created_at: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    token: string
    user: User
    otp_code?: string
  }
}

export interface RegistrationOtpVerificationData {
  email: string
  otp: string
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/users/login', data)
    if (response.data.success && response.data.data) {
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }
    return response.data
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/users/register', data)
    return response.data
  },

  async verifyRegistrationOtp(data: RegistrationOtpVerificationData): Promise<AuthResponse> {
    const response = await api.post('/users/register/verify', data)
    return response.data
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/signin'
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token')
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  }
}

export default authService
