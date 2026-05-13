import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService, { User, LoginData, RegisterData } from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; data?: { otp_code?: string } }>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setIsLoading(false)
  }, [])

  const login = async (data: LoginData) => {
    try {
      console.log('Giriş sorğusu göndərilir:', data.email)
      const response = await authService.login(data)
      console.log('Giriş cavabı:', response)
      if (response.success && response.data) {
        setUser(response.data.user)
        return { success: true }
      }
      return { success: false, message: response.message || 'Giriş uğursuz oldu' }
    } catch (error: unknown) {
      console.error('Giriş xətası:', error)
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const message = err.response?.data?.message || err.message || 'Xəta baş verdi'
      return { success: false, message }
    }
  }

  const register = async (data: RegisterData) => {
    try {
      console.log('Qeydiyyat sorğusu göndərilir:', data)
      const response = await authService.register(data)
      console.log('Qeydiyyat cavabı:', response)
      if (response.success) {
        return { success: true, data: response.data?.otp_code ? { otp_code: response.data.otp_code } : undefined }
      }
      return { success: false, message: response.message || 'Qeydiyyat uğursuz oldu' }
    } catch (error: unknown) {
      console.error('Qeydiyyat xətası:', error)
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      const message = err.response?.data?.message || err.message || 'Xəta baş verdi'
      return { success: false, message }
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => {
      const merged = prev ? { ...prev, ...updatedUser } : (updatedUser as User)
      localStorage.setItem('user', JSON.stringify(merged))
      return merged
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
