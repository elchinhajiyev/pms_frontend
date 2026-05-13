import axios from 'axios'

export const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)

export const API_URL = isLocalhost
  ? 'http://localhost:5551/api/'
  : 'https://app.performix.az/api/'

export const ATTACHMENT_URL = isLocalhost
  ? 'http://localhost:5551'
  : 'https://bsu.performix.az'

export const Axios = axios.create({
  baseURL: API_URL
})

export default {
  isLocalhost,
  API_URL,
  ATTACHMENT_URL,
  Axios
}
