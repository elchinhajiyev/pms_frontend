import type { AxiosInstance } from 'axios'

export const isLocalhost: boolean
export const API_URL: string
export const ATTACHMENT_URL: string
export const Axios: AxiosInstance

declare const urlConfig: {
	isLocalhost: boolean
	API_URL: string
	ATTACHMENT_URL: string
	Axios: AxiosInstance
}

export default urlConfig
