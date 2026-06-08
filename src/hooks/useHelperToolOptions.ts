import { useEffect, useState } from 'react'
import helperToolService from '../services/helperToolService'

const defaultAcademicYears = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []

  for (let year = currentYear - 2; year <= currentYear + 3; year += 1) {
    years.push(`${year}-${year + 1}`)
  }

  return years
}

const defaultSemesters = () => ['YAZ', 'YAY', 'PAYIZ']

export const useHelperToolOptions = () => {
  const [academicYears, setAcademicYears] = useState<string[]>(defaultAcademicYears())
  const [semesters, setSemesters] = useState<string[]>(defaultSemesters())

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const [yearsRes, semestersRes] = await Promise.all([
          helperToolService.getAcademicYears(),
          helperToolService.getSemesters()
        ])

        if (!alive) return

        const years = Array.isArray(yearsRes?.data)
          ? yearsRes.data.map((item) => String(item.value || '').trim()).filter(Boolean)
          : []
        const semesterValues = Array.isArray(semestersRes?.data)
          ? semestersRes.data.map((item) => String(item.value || '').trim()).filter(Boolean)
          : []

        if (years.length > 0) {
          setAcademicYears(years)
        }

        if (semesterValues.length > 0) {
          setSemesters(semesterValues)
        }
      } catch {
        if (!alive) return
        setAcademicYears(defaultAcademicYears())
        setSemesters(defaultSemesters())
      }
    }

    load()

    return () => {
      alive = false
    }
  }, [])

  return { academicYears, semesters }
}

export const useEnsureActiveSemester = <T extends string>(
  semesters: string[],
  semester: T,
  setSemester: (semester: T) => void
) => {
  useEffect(() => {
    if (semesters.length === 0 || semesters.includes(semester)) return
    setSemester(semesters[0] as T)
  }, [semesters, semester, setSemester])
}
