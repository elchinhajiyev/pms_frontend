import { type ChangeEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons'
import Label from '../form/Label'
import Input from '../form/input/InputField'
import Checkbox from '../form/input/Checkbox'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import authService from '../../services/authService'

interface StudentGroup {
  id: number
  group_number: string
  faculty_id?: number
  faculty_name?: string
  specialty_id?: number
  specialty_name?: string
  teaching_subject_names?: string[]
  department_names?: string[]
}

export default function SignUpForm() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [searchingGroup, setSearchingGroup] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    password: '',
    password_confirm: '',
    fin: '',
    phone: '',
    student_group_id: null as number | null
  })

  const [groupSearchInput, setGroupSearchInput] = useState('')
  const [foundGroup, setFoundGroup] = useState<StudentGroup | null>(null)

  const canCompleteRegistration = userType === 'teacher' || Boolean(foundGroup)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    if (!formData.first_name.trim()) {
      setError('Ad tələb olunur')
      return false
    }
    if (!formData.last_name.trim()) {
      setError('Soyad tələb olunur')
      return false
    }
    if (!formData.fin.trim()) {
      setError('FIN kod tələb olunur')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email tələb olunur')
      return false
    }
    if (!formData.password.trim()) {
      setError('Şifrə tələb olunur')
      return false
    }
    if (formData.password !== formData.password_confirm) {
      setError('Şifrələr uyğun gəlmir')
      return false
    }
    return true
  }

  const handleNextStep = () => {
    setError('')
    if (!validateStep1()) return

    setStep(2)
    setUserType('student')
    setGroupSearchInput('')
    setFoundGroup(null)
    setFormData((prev) => ({
      ...prev,
      student_group_id: null
    }))
  }

  const handleSearchGroup = async () => {
    if (!groupSearchInput.trim()) {
      setError('Qrup nömrəsini daxil edin')
      return
    }

    setSearchingGroup(true)
    setError('')
    setFoundGroup(null)

    try {
      const response = await api.get(
        `/evaluation/student-groups/search?group_number=${encodeURIComponent(
          groupSearchInput.trim()
        )}`
      )

      if (response.data.data) {
        setFoundGroup(response.data.data)
        setFormData((prev) => ({
          ...prev,
          student_group_id: response.data.data.id
        }))
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qrup axtarışı uğursuz oldu')
      setFoundGroup(null)
    } finally {
      setSearchingGroup(false)
    }
  }

  const buildRegistrationPayload = () => ({
    first_name: formData.first_name.trim(),
    last_name: formData.last_name.trim(),
    middle_name: formData.middle_name.trim() || undefined,
    email: formData.email.trim(),
    password: formData.password,
    fin: formData.fin.trim(),
    phone: formData.phone.trim() || undefined,
    student_group_id:
      userType === 'student' ? formData.student_group_id || undefined : undefined,
    faculty_id: userType === 'student' ? foundGroup?.faculty_id : undefined,
    specialty_id: userType === 'student' ? foundGroup?.specialty_id : undefined
  })

  const handleSendOtp = async () => {
    setError('')
    setSuccess('')

    if (!isChecked) {
      setError('Şərtləri qəbul etməlisiniz')
      return
    }

    if (userType === 'student' && !foundGroup) {
      setError('Qrup seçilməyib')
      return
    }

    setIsLoading(true)
    try {
      const result = await register(buildRegistrationPayload())

      if (result.success) {
        setOtpCode(result.data?.otp_code || '')
        setStep(3)
        setSuccess('Təsdiq kodu email ünvanınıza göndərildi. Zəhmət olmasa kodu daxil edin.')
      } else {
        setError(result.message || 'Təsdiq kodu göndərilə bilmədi')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Təsdiq kodu göndərilə bilmədi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    setSuccess('')

    if (!otpCode.trim()) {
      setError('OTP kodu tələb olunur')
      return
    }

    setIsVerifyingOtp(true)
    try {
      const result = await authService.verifyRegistrationOtp({
        email: formData.email.trim(),
        otp: otpCode.trim()
      })

      if (result.success) {
        setSuccess('Qeydiyyat tamamlandı. Giriş səhifəsinə yönləndirilirsiniz...')
        setTimeout(() => navigate('/signin'), 2000)
      } else {
        setError(result.message || 'Qeydiyyat tamamlanmadı')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Qeydiyyat tamamlanmadı')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-full no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Ana səhifəyə qayıt
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Qeydiyyat {step === 1 && '(Addım 1/3)'} {step === 2 && '(Addım 2/3)'} {step === 3 && '(Addım 3/3)'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1
                ? 'Şəxsi məlumatlarınızı daxil edin'
                : step === 2
                  ? 'Tədris məlumatlarınızı seçin və təsdiq kodu alın'
                  : 'Email ünvanınıza göndərilən təsdiq kodunu daxil edin'}
            </p>
          </div>

          <div>
            {error && (
              <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded border border-green-400 bg-green-100 p-3 text-green-700">
                {success}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <Label>
                        Ad<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Adınızı daxil edin"
                        required
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label>
                        Soyad<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Soyadınızı daxil edin"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Ata adı</Label>
                    <Input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      placeholder="Ata adınızı daxil edin"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <Label>
                        FIN kod<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        name="fin"
                        value={formData.fin}
                        onChange={handleChange}
                        placeholder="FIN kodunuzu daxil edin"
                        maxLength={7}
                        required
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+994 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>
                      Email<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div>
                    <Label>
                      Şifrə<span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Şifrənizi daxil edin"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Şifrənin təkrarı<span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Şifrənizi yenidən daxil edin"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        name="password_confirm"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        required
                      />
                      <span
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPasswordConfirm ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                  >
                    Sonrakı addıma keç →
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-5">
                  <div>
                    <Label>
                      İstifadəçi növü<span className="text-error-500">*</span>
                    </Label>
                    <div className="mt-2 flex items-center gap-6">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="user_type"
                          value="student"
                          checked={userType === 'student'}
                          onChange={() => {
                            setUserType('student')
                            setError('')
                          }}
                          className="h-4 w-4"
                        />
                        Tələbə
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="user_type"
                          value="teacher"
                          checked={userType === 'teacher'}
                          onChange={() => {
                            setUserType('teacher')
                            setError('')
                            setGroupSearchInput('')
                            setFoundGroup(null)
                            setFormData((prev) => ({
                              ...prev,
                              student_group_id: null
                            }))
                          }}
                          className="h-4 w-4"
                        />
                        Müəllim
                      </label>
                    </div>
                  </div>

                  {userType === 'student' && (
                    <div>
                      <Label>
                        Qrup nömrəsi<span className="text-error-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={groupSearchInput}
                          onChange={(e) => setGroupSearchInput(e.target.value)}
                          placeholder="Məs: J-205"
                        />
                        <button
                          type="button"
                          onClick={handleSearchGroup}
                          disabled={searchingGroup}
                          className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                          {searchingGroup ? '...' : 'Axtar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {userType === 'student' && foundGroup && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      {foundGroup.faculty_name && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Fakültə:
                          </span>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {foundGroup.faculty_name}
                          </p>
                        </div>
                      )}

                      {foundGroup.specialty_name && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            İxtisas:
                          </span>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {foundGroup.specialty_name}
                          </p>
                        </div>
                      )}

                      {foundGroup.teaching_subject_names && foundGroup.teaching_subject_names.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Tədris edilən fənlər:
                          </span>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {foundGroup.teaching_subject_names.join(', ')}
                          </p>
                        </div>
                      )}

                      {foundGroup.department_names && foundGroup.department_names.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Kafedralar:
                          </span>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {foundGroup.department_names.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Checkbox className="w-5 h-5" checked={isChecked} onChange={setIsChecked} />
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                      Hesab yaratmaqla{' '}
                      <span className="text-gray-800 dark:text-white/90">İstifadə Şərtləri</span>{' '}
                      və{' '}
                      <span className="text-gray-800 dark:text-white">Gizlilik Siyasəti</span>{' '}
                      ilə razılaşıram
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1)
                        setGroupSearchInput('')
                        setFoundGroup(null)
                      }}
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      ← Geri
                    </button>
                    <button
                      type="button"
                      disabled={isLoading || !canCompleteRegistration}
                      onClick={handleSendOtp}
                      className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      {isLoading ? 'Kod göndərilir...' : 'Təsdiq kodunu göndər'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-5">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
                    <p>
                      <span className="font-medium">{formData.email}</span> ünvanına təsdiq kodu göndərildi.
                    </p>
                    <p className="mt-1">
                      Kod 10 dəqiqə etibarlıdır. Zəhmət olmasa email qutusunu və spam bölməsini yoxlayın.
                    </p>
                  </div>

                  <div>
                    <Label>
                      OTP kodu<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6 rəqəmli kod"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2)
                        setSuccess('')
                        setError('')
                      }}
                      className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      ← Geri
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center rounded-lg bg-gray-600 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-gray-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Kod yenidən göndərilir...' : 'Kodu yenidən göndər'}
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifyingOtp}
                      className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
                    >
                      {isVerifyingOtp ? 'Yoxlanılır...' : 'Qeydiyyatı tamamla'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Hesabınız var?{' '}
                <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Daxil ol
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}