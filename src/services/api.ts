// @ts-ignore Legacy JS config module kept as the single source of API endpoints.
import urlConfig from '../config/urlindex'
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'

export const API_URL = (urlConfig.Axios.defaults.baseURL as string) || ''

export const API_ORIGIN = (() => {
  try {
    return new URL(urlConfig.ATTACHMENT_URL, window.location.origin).origin
  } catch {
    return window.location.origin
  }
})()

const api = urlConfig.Axios

api.defaults.headers.common['Content-Type'] = 'application/json'

// Request interceptor - token əlavə et
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => {
    return Promise.reject(error)
  }
)

// Response interceptor - xətaları idarə et
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export default api
